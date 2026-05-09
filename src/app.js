(function bootImgLab(root) {
  "use strict";

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_DIMENSION = 4096;
  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
  const OPENCV_SCRIPT_URL = "https://docs.opencv.org/4.x/opencv.js";
  const USE_BACKEND = true;

  let openCvLoadPromise = null;
  let compareDragging = false;

  const state = {
    cv: null,
    imageLoaded: false,
    currentObjectUrl: null,
    activeGoalId: "clean-noise",
    activeOperationId: "bilateral-filter",
    lastResult: null,
    engineLoading: false
  };

  const elements = {
    engineDot: document.getElementById("engineDot"),
    engineStatus: document.getElementById("engineStatus"),
    imageInput: document.getElementById("imageInput"),
    imageMeta: document.getElementById("imageMeta"),
    categoryTabs: document.getElementById("categoryTabs"),
    operationList: document.getElementById("operationList"),
    originalCanvas: document.getElementById("originalCanvas"),
    processedCanvas: document.getElementById("processedCanvas"),
    processedLayer: document.getElementById("processedLayer"),
    compareLine: document.getElementById("compareLine"),
    canvasFrame: document.getElementById("canvasFrame"),
    emptyState: document.getElementById("emptyState"),
    compareSlider: document.getElementById("compareSlider"),
    compareValue: document.getElementById("compareValue"),
    resetButton: document.getElementById("resetButton"),
    exportButton: document.getElementById("exportButton"),
    activeMethod: document.getElementById("activeMethod"),
    processingTime: document.getElementById("processingTime"),
    resultWarning: document.getElementById("resultWarning"),
    methodDescription: document.getElementById("methodDescription"),
    parameterForm: document.getElementById("parameterForm"),
    processButton: document.getElementById("processButton"),
    statusMessage: document.getElementById("statusMessage")
  };

  function setStatus(message, tone) {
    elements.statusMessage.textContent = message;
    elements.statusMessage.dataset.tone = tone || "neutral";
  }

  function setEngineStatus(message, ready) {
    elements.engineStatus.textContent = message;
    elements.engineDot.dataset.ready = ready ? "true" : "false";
  }

  async function checkBackendHealth() {
    if (!USE_BACKEND) return;
    try {
      const response = await fetch(`${resolveBackendBaseUrl()}/api/health`, { cache: "no-store" });
      if (!response.ok) throw new Error("BACKEND_NOT_READY");
      setEngineStatus("Backend ready", true);
    } catch (_error) {
      setEngineStatus("Backend unreachable", false);
      setStatus("Backend tidak bisa diakses. Pastikan service backend aktif.", "error");
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return "-";
    const units = ["B", "KB", "MB"];
    let value = bytes;
    let unitIndex = 0;
    while (value > 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  function updateImageMeta(file, width, height) {
    elements.imageMeta.innerHTML = `
      <div><dt>File</dt><dd>${escapeHtml(file ? file.name : "No image")}</dd></div>
      <div><dt>Resolusi</dt><dd>${width && height ? `${width} x ${height}px` : "-"}</dd></div>
      <div><dt>Ukuran</dt><dd>${file ? formatBytes(file.size) : "-"}</dd></div>
    `;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character]));
  }

  function drawImageToCanvas(image, canvas) {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return scale < 1;
  }

  function syncProcessedFromOriginal() {
    elements.processedCanvas.width = elements.originalCanvas.width;
    elements.processedCanvas.height = elements.originalCanvas.height;
    const context = elements.processedCanvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, elements.processedCanvas.width, elements.processedCanvas.height);
    context.drawImage(elements.originalCanvas, 0, 0);
  }

  function setCompare(value) {
    elements.compareValue.textContent = `${value}%`;
    elements.processedLayer.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
    elements.compareLine.style.left = `${value}%`;
  }

  function updateCompareFromPointer(event) {
    if (elements.compareSlider.disabled) return;
    const rect = elements.canvasFrame.getBoundingClientRect();
    const clampedX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const value = Math.round((clampedX / rect.width) * 100);
    elements.compareSlider.value = String(value);
    setCompare(value);
  }

  function startCompareDrag(event) {
    if (elements.compareSlider.disabled) return;
    compareDragging = true;
    updateCompareFromPointer(event);
    if (elements.canvasFrame.setPointerCapture) {
      elements.canvasFrame.setPointerCapture(event.pointerId);
    }
  }

  function stopCompareDrag(event) {
    if (!compareDragging) return;
    compareDragging = false;
    if (elements.canvasFrame.releasePointerCapture) {
      elements.canvasFrame.releasePointerCapture(event.pointerId);
    }
  }

  function canProcess() {
    if (!state.imageLoaded) return false;
    return USE_BACKEND ? true : Boolean(state.cv);
  }

  function updateControlState() {
    const ready = canProcess();
    elements.processButton.disabled = !state.imageLoaded || (!USE_BACKEND && state.engineLoading);
    elements.compareSlider.disabled = !state.imageLoaded;
    elements.resetButton.disabled = !state.imageLoaded;
    elements.exportButton.disabled = !state.lastResult;
    if (ready) {
      const readyMessage = USE_BACKEND
        ? "Siap. Klik Proses untuk mengirim ke backend."
        : "Siap. Pilih tujuan hasil, atur sedikit bila perlu, lalu proses gambar.";
      setStatus(readyMessage, "success");
    } else if (state.imageLoaded && !state.cv && !state.engineLoading) {
      setStatus("Gambar siap. Klik Proses untuk memuat engine.", "neutral");
    }
  }

  function resolveBackendBaseUrl() {
    if (window.location.port === "4173") {
      return `http://${window.location.hostname}:8000`;
    }
    return window.location.origin;
  }

  function renderCategories() {
    elements.categoryTabs.innerHTML = "";
    root.ImgLabOperations.goals.forEach((goal) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<strong>${goal.label}</strong><span>${goal.intent}</span>`;
      button.className = "category-tab";
      button.dataset.active = String(goal.id === state.activeGoalId);
      button.addEventListener("click", () => {
        state.activeGoalId = goal.id;
        state.activeOperationId = goal.operationId;
        renderCategories();
        renderOperations();
        renderParameters();
      });
      elements.categoryTabs.appendChild(button);
    });
  }

  function renderOperations() {
    elements.operationList.innerHTML = "";
    const goal = root.ImgLabOperations.goalById(state.activeGoalId);
    const operation = goal ? root.ImgLabOperations.byId(goal.operationId) : null;
    if (!goal || !operation) return;

    const summary = document.createElement("div");
    summary.className = "goal-summary";
    summary.innerHTML = `
      <span>Tujuan aktif</span>
      <strong>${goal.label}</strong>
      <p>${goal.summary}</p>
      <small>Metode yang dipakai: ${operation.label}</small>
    `;
    elements.operationList.appendChild(summary);
  }

  function renderParameters() {
    const goal = root.ImgLabOperations.goalById(state.activeGoalId);
    const operation = root.ImgLabOperations.byId(state.activeOperationId);
    elements.activeMethod.textContent = goal ? `Tujuan: ${goal.label}` : "Belum ada tujuan";
    elements.methodDescription.textContent = operation
      ? `${operation.description} Metode teknis: ${operation.label}.`
      : "Pilih tujuan pengolahan untuk melihat kontrolnya.";
    elements.parameterForm.innerHTML = "";

    if (!operation || operation.parameters.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-controls";
      empty.textContent = "Tujuan ini tidak perlu parameter tambahan.";
      elements.parameterForm.appendChild(empty);
      return;
    }

    operation.parameters.forEach((parameter) => {
      const field = document.createElement("label");
      field.className = "control-field";
      field.htmlFor = `param-${parameter.id}`;

      const labelRow = document.createElement("span");
      labelRow.className = "control-label";
      labelRow.innerHTML = `<span>${parameter.label}</span><output id="output-${parameter.id}">${parameter.defaultValue}</output>`;

      let input;
      if (parameter.type === "select") {
        input = document.createElement("select");
        parameter.options.forEach((option) => {
          const item = document.createElement("option");
          item.value = option;
          item.textContent = option;
          input.appendChild(item);
        });
      } else if (parameter.type === "boolean") {
        input = document.createElement("input");
        input.type = "checkbox";
        input.checked = Boolean(parameter.defaultValue);
      } else {
        input = document.createElement("input");
        input.type = "range";
        input.min = parameter.min;
        input.max = parameter.max;
        input.step = parameter.step;
      }

      input.id = `param-${parameter.id}`;
      input.name = parameter.id;
      input.value = parameter.defaultValue;
      input.dataset.type = parameter.type;
      input.addEventListener("input", () => {
        const output = document.getElementById(`output-${parameter.id}`);
        output.textContent = input.type === "checkbox" ? (input.checked ? "on" : "off") : input.value;
      });

      field.appendChild(labelRow);
      field.appendChild(input);
      elements.parameterForm.appendChild(field);
    });
  }

  function readParameterValues(operation) {
    const values = root.ImgLabOperations.defaultsFor(operation);
    operation.parameters.forEach((parameter) => {
      const input = elements.parameterForm.elements[parameter.id];
      if (!input) return;
      if (parameter.type === "boolean") {
        values[parameter.id] = input.checked;
      } else {
        values[parameter.id] = input.value;
      }
    });
    return root.ImgLabOperations.validateParameters(operation, values);
  }

  function loadOpenCvScript() {
    if (openCvLoadPromise) return openCvLoadPromise;
    openCvLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.async = true;
      script.src = OPENCV_SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("ENGINE_LOAD_FAILED"));
      document.head.appendChild(script);
    });
    return openCvLoadPromise;
  }

  async function waitForOpenCv() {
    await loadOpenCvScript();
    const startedAt = Date.now();
    while (!root.cv) {
      if (Date.now() - startedAt > 20000) {
        throw new Error("ENGINE_NOT_READY");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const cv = root.cv instanceof Promise ? await root.cv : root.cv;
    return cv;
  }

  async function initializeEngine() {
    if (state.cv || state.engineLoading) return;
    state.engineLoading = true;
    try {
      setEngineStatus("Loading OpenCV.js...", false);
      setStatus("Engine sedang dimuat. Ini bisa butuh beberapa detik.", "neutral");
      state.cv = await waitForOpenCv();
      setEngineStatus("OpenCV.js ready", true);
    } catch (error) {
      setEngineStatus("OpenCV.js failed to load", false);
      setStatus("OpenCV.js gagal dimuat. Cek koneksi internet, lalu refresh.", "error");
    } finally {
      state.engineLoading = false;
      updateControlState();
    }
  }

  function handleFile(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setStatus("Pilih gambar PNG, JPEG, atau WebP.", "error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus("Gambar lebih besar dari batas MVP 10 MB.", "error");
      return;
    }

    if (state.currentObjectUrl) URL.revokeObjectURL(state.currentObjectUrl);
    const objectUrl = URL.createObjectURL(file);
    state.currentObjectUrl = objectUrl;

    const image = new Image();
    image.onload = () => {
      const downscaled = drawImageToCanvas(image, elements.originalCanvas);
      syncProcessedFromOriginal();
      state.imageLoaded = true;
      state.lastResult = null;
      elements.emptyState.hidden = true;
      elements.canvasFrame.dataset.hasImage = "true";
      elements.canvasFrame.dataset.compareReady = "true";
      elements.originalCanvas.dataset.visible = "true";
      elements.processedCanvas.dataset.visible = "true";
      setCompare(Number(elements.compareSlider.value));
      updateImageMeta(file, elements.originalCanvas.width, elements.originalCanvas.height);
      elements.processingTime.textContent = "-";
      elements.resultWarning.textContent = downscaled
        ? "Preview diperkecil untuk menjaga memori browser."
        : "Gambar siap. Pilih tujuan pengolahan.";
      updateControlState();
      setStatus("Gambar berhasil dimuat. File tetap lokal di browser ini.", "success");
    };
    image.onerror = () => {
      setStatus("Gambar tidak bisa dibaca. Pilih file lain.", "error");
      URL.revokeObjectURL(objectUrl);
      state.currentObjectUrl = null;
    };
    image.src = objectUrl;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("EXPORT_FAILED"));
      }, "image/png");
    });
  }

  function drawBlobToProcessedCanvas(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const targetWidth = elements.originalCanvas.width || image.naturalWidth;
        const targetHeight = elements.originalCanvas.height || image.naturalHeight;
        const scale = Math.min(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
        const drawWidth = Math.max(1, Math.round(image.naturalWidth * scale));
        const drawHeight = Math.max(1, Math.round(image.naturalHeight * scale));
        const offsetX = Math.round((targetWidth - drawWidth) / 2);
        const offsetY = Math.round((targetHeight - drawHeight) / 2);

        elements.processedCanvas.width = targetWidth;
        elements.processedCanvas.height = targetHeight;
        const context = elements.processedCanvas.getContext("2d", { willReadFrequently: true });
        context.clearRect(0, 0, targetWidth, targetHeight);
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        URL.revokeObjectURL(url);
        resolve();
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("IMAGE_DECODE_FAILED"));
      };
      image.src = url;
    });
  }

  async function processWithBackend(operation, values, warnings, goal) {
    const startedAt = performance.now();
    const blob = await canvasToBlob(elements.originalCanvas);
    const formData = new FormData();
    formData.append("file", blob, "imglab-source.png");
    formData.append("goal_id", state.activeGoalId);
    formData.append("parameters", JSON.stringify(values));

    const baseUrl = resolveBackendBaseUrl().replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/api/process`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      let message = "Backend tidak bisa memproses gambar.";
      try {
        const error = await response.json();
        if (error && error.message) message = error.message;
      } catch (_error) {
        // Keep the safe fallback message.
      }
      throw new Error(message);
    }

    const resultBlob = await response.blob();
    await drawBlobToProcessedCanvas(resultBlob);
    const backendWarnings = JSON.parse(response.headers.get("X-ImgLab-Warnings") || "[]");
    const resultWarnings = warnings.map((warning) => warning.message).concat(backendWarnings);
    state.lastResult = {
      width: Number(response.headers.get("X-ImgLab-Width") || elements.processedCanvas.width),
      height: Number(response.headers.get("X-ImgLab-Height") || elements.processedCanvas.height),
      outputMode: response.headers.get("X-ImgLab-Output-Mode") || operation.outputMode,
      processingTimeMs: Math.max(1, Math.round(performance.now() - startedAt)),
      warnings: resultWarnings.map((message) => ({ code: "BACKEND_WARNING", message }))
    };
    elements.processingTime.textContent = `${state.lastResult.processingTimeMs} ms`;
    elements.resultWarning.textContent = resultWarnings.length
      ? resultWarnings.join(" ")
      : `${state.lastResult.width} x ${state.lastResult.height}px ${state.lastResult.outputMode} output.`;
    setCompare(Number(elements.compareSlider.value));
    setStatus(`${goal ? goal.label : operation.label} selesai via backend.`, "success");
  }

  async function processImage() {
    if (!state.imageLoaded) {
      setStatus("Upload gambar dulu sebelum memproses.", "error");
      return;
    }
    if (!USE_BACKEND && !state.cv) {
      await initializeEngine();
      if (!state.cv) return;
    }
    const operation = root.ImgLabOperations.byId(state.activeOperationId);
    if (!operation) {
      setStatus("Tujuan pengolahan tidak dikenal.", "error");
      return;
    }

    const { values, warnings } = readParameterValues(operation);
    const goal = root.ImgLabOperations.goalById(state.activeGoalId);
    setStatus(`Memproses: ${goal ? goal.label : operation.label}...`, "neutral");
    elements.processButton.disabled = true;

    requestAnimationFrame(async () => {
      try {
        if (USE_BACKEND) {
          await processWithBackend(operation, values, warnings, goal);
        } else {
          const result = root.ImgLabProcessing.applyOperation(
            state.cv,
            elements.originalCanvas,
            elements.processedCanvas,
            operation,
            values
          );
          result.warnings = warnings.concat(result.warnings);
          state.lastResult = result;
          elements.processingTime.textContent = `${result.processingTimeMs} ms`;
          elements.resultWarning.textContent = result.warnings.length
            ? result.warnings.map((warning) => warning.message).join(" ")
            : `${result.width} x ${result.height}px ${result.outputMode} output.`;
          setCompare(Number(elements.compareSlider.value));
          setStatus(`${goal ? goal.label : operation.label} selesai.`, "success");
        }
      } catch (error) {
        setStatus(error.message || "Gambar ini tidak bisa diproses dengan tujuan tersebut.", "error");
      } finally {
        updateControlState();
      }
    });
  }

  function resetResult() {
    if (!state.imageLoaded) return;
    syncProcessedFromOriginal();
    state.lastResult = null;
    elements.processingTime.textContent = "-";
    elements.resultWarning.textContent = "Hasil dikembalikan ke original.";
    updateControlState();
    setStatus("Hasil di-reset.", "neutral");
  }

  function exportPng() {
    if (!state.lastResult) {
      setStatus("Proses gambar dulu sebelum export.", "error");
      return;
    }
    try {
      const operation = root.ImgLabOperations.byId(state.activeOperationId);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
      link.download = `imglab-${operation.id}-${timestamp}.png`;
      link.href = elements.processedCanvas.toDataURL("image/png");
      link.click();
      setStatus("PNG siap diexport.", "success");
    } catch (error) {
      setStatus("Export gagal. Coba proses gambar lagi.", "error");
    }
  }

  function bindEvents() {
    elements.imageInput.addEventListener("change", (event) => {
      handleFile(event.target.files[0]);
    });
    elements.compareSlider.addEventListener("input", () => {
      setCompare(Number(elements.compareSlider.value));
    });
    elements.canvasFrame.addEventListener("pointerdown", startCompareDrag);
    elements.canvasFrame.addEventListener("pointermove", (event) => {
      if (!compareDragging) return;
      updateCompareFromPointer(event);
    });
    elements.canvasFrame.addEventListener("pointerup", stopCompareDrag);
    elements.canvasFrame.addEventListener("pointerleave", stopCompareDrag);
    elements.canvasFrame.addEventListener("pointercancel", stopCompareDrag);
    elements.processButton.addEventListener("click", processImage);
    elements.resetButton.addEventListener("click", resetResult);
    elements.exportButton.addEventListener("click", exportPng);
  }

  function init() {
    renderCategories();
    renderOperations();
    renderParameters();
    bindEvents();
    setCompare(Number(elements.compareSlider.value));
    updateImageMeta(null);
    setEngineStatus("Checking backend...", false);
    setStatus("Upload gambar untuk mulai. Proses akan dikirim ke backend.", "neutral");
    checkBackendHealth();
  }

  init();
})(window);
