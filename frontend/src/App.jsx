import { useState, useRef, useCallback, useEffect } from "react";
import { ImgLabOperations } from "./utils/operations";

const CONDITION_COLORS = {
  acne: "#ef5b63",
  dark_spots: "#b7791f",
  wrinkles: "#7c3aed",
  redness: "#e11d48",
  pores: "#0f766e"
};

const DEFAULT_STATUS = {
  state: "checking",
  label: "Checking service"
};

function App() {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingTime, setProcessingTime] = useState(null);
  const [backendStatus, setBackendStatus] = useState(DEFAULT_STATUS);
  const [analysis, setAnalysis] = useState(null);
  const [inputMode, setInputMode] = useState("upload");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        return response.json();
      })
      .then((data) => {
        if (!alive) return;
        const engine = data?.engine ? ` (${data.engine})` : "";
        setBackendStatus({ state: "ready", label: `Ready${engine}` });
      })
      .catch(() => {
        if (!alive) return;
        setBackendStatus({ state: "error", label: "Service offline" });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const resetAll = useCallback(() => {
    if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);
    if (processedImage) URL.revokeObjectURL(processedImage);
    if (fileInputRef.current) fileInputRef.current.value = "";
    stopCamera();
    setImage(null);
    setProcessedImage(null);
    setAnalysis(null);
    setError(null);
    setProcessingTime(null);
  }, [image, processedImage, stopCamera]);

  const acceptImageFile = useCallback((file) => {
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Format tidak didukung. Gunakan PNG, JPEG, atau WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File terlalu besar (maks 10 MB).");
      return;
    }

    if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);
    if (processedImage) URL.revokeObjectURL(processedImage);

    setError(null);
    setProcessedImage(null);
    setAnalysis(null);
    setProcessingTime(null);

    const objectUrl = URL.createObjectURL(file);
    setImage({ file, objectUrl, name: file.name, size: file.size });
  }, [image, processedImage]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    acceptImageFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload({ target: { files: [file] } });
    } else {
      setError("Drop file gambar yang valid.");
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Kamera tidak didukung oleh browser ini.");
      return;
    }
    setIsCameraStarting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      setError("Kamera tidak bisa dibuka. Cek izin kamera atau gunakan upload file.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  const captureCameraPhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Preview kamera belum siap.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Browser tidak dapat mengambil gambar kamera.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    if (!blob) {
      setError("Foto kamera gagal dibuat.");
      return;
    }
    const file = new File([blob], `kamera-wajah-${Date.now()}.jpg`, { type: "image/jpeg" });
    acceptImageFile(file);
    stopCamera();
  };

  const processImage = async (goal) => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);
    setProcessingTime(null);

    try {
      const operation = ImgLabOperations.byId(goal.operationId);
      if (!operation) {
        throw new Error("Tool tidak ditemukan.");
      }
      const defaults = ImgLabOperations.defaultsFor(operation);

      const formData = new FormData();
      formData.append("file", image.file);
      formData.append("goal_id", goal.id);
      formData.append("parameters", JSON.stringify(defaults));

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        let msg = "Processing service could not process this image.";
        try {
          const payload = await response.json();
          if (payload?.message) msg = payload.message;
        } catch {
          // Keep the safe generic message when the backend returns non-JSON.
        }
        throw new Error(msg);
      }

      const blob = await response.blob();
      const elapsedHeader =
        response.headers.get("X-ImgLab-Processing-Time") ||
        response.headers.get("X-Processing-Time-Ms");
      const analysisHeader = response.headers.get("X-DermaScope-Analysis");
      const parsedAnalysis = analysisHeader ? JSON.parse(analysisHeader) : null;
      const elapsedMs = Number(elapsedHeader);
      if (processedImage) URL.revokeObjectURL(processedImage);
      setProcessedImage(URL.createObjectURL(blob));
      setAnalysis(parsedAnalysis);
      setProcessingTime(Number.isFinite(elapsedMs) && elapsedMs > 0 ? Math.round(elapsedMs) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusDot =
    backendStatus.state === "ready"
      ? "bg-success"
      : backendStatus.state === "error"
        ? "bg-error"
        : "bg-warning";

  const primaryGoal = ImgLabOperations.goals[0];
  const canAnalyze = image && backendStatus.state === "ready" && !isProcessing;

  return (
    <div className="min-h-screen bg-derma-shell text-base-content">
      <nav className="px-4 py-5 lg:px-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="kicker">DermaScope</p>
          <h1 className="text-2xl sm:text-4xl font-semibold">Analisis kondisi kulit wajah</h1>
          <p className="max-w-2xl text-sm text-base-content/65">
            Upload satu foto wajah, lalu baca overlay area bermasalah, skor kategori, dan breakdown zona wajah.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="clinical-chip">
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`}></span>
            <span>{backendStatus.label}</span>
          </div>
          {image && (
            <button className="btn btn-ghost btn-sm" onClick={resetAll}>
              Foto baru
            </button>
          )}
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 pb-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10">
        <section className="analysis-stage">
          {!image ? (
            <div className="intake-grid">
              <div className="space-y-5">
                <p className="kicker">Face photo intake</p>
                <h2 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                  Dari foto biasa jadi peta kondisi kulit.
                </h2>
                <p className="max-w-2xl text-base text-base-content/65">
                  Sistem membaca sinyal visual seperti jerawat, noda gelap, kerutan, kemerahan, dan pori besar di zona wajah.
                </p>
                <div className="legend-row">
                  {Object.entries(CONDITION_COLORS).map(([id, color]) => (
                    <span key={id}>
                      <i style={{ backgroundColor: color }}></i>
                      {id.replace("_", " ")}
                    </span>
                  ))}
                </div>
                <div className="source-switch" aria-label="Pilih sumber foto">
                  <button
                    type="button"
                    className={inputMode === "upload" ? "active" : ""}
                    onClick={() => {
                      stopCamera();
                      setInputMode("upload");
                    }}
                  >
                    Upload file
                  </button>
                  <button
                    type="button"
                    className={inputMode === "camera" ? "active" : ""}
                    onClick={() => setInputMode("camera")}
                  >
                    Kamera
                  </button>
                </div>
              </div>

              {inputMode === "upload" ? (
                <div
                  className={`upload-card ${isDragOver ? "is-dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="upload-symbol">+</div>
                  <h2 className="text-2xl font-semibold">Upload foto wajah</h2>
                  <p className="text-sm text-base-content/60">
                    PNG, JPEG, atau WebP. Maksimum 10 MB. Gunakan foto wajah yang jelas dan cukup terang.
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <div className="camera-card">
                  <div className="camera-preview">
                    <video ref={videoRef} playsInline muted aria-label="Preview kamera wajah"></video>
                    {!isCameraActive && (
                      <div className="camera-empty">
                        <span>Kamera belum aktif</span>
                        <small>Gunakan pencahayaan rata dan hadapkan wajah ke kamera.</small>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={startCamera}
                      disabled={isCameraStarting || isCameraActive}
                    >
                      {isCameraStarting ? "Membuka..." : "Aktifkan kamera"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={captureCameraPhoto}
                      disabled={!isCameraActive}
                    >
                      Ambil foto
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={stopCamera}
                      disabled={!isCameraActive}
                    >
                      Matikan
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="clinical-panel overflow-hidden">
                <div className="stage-bar">
                  <div>
                    <p className="kicker">Face evidence</p>
                    <p className="max-w-[260px] truncate font-medium">{image.name}</p>
                  </div>
                  <span>{formatBytes(image.size)}</span>
                  {processingTime && <span className="font-mono text-success">{processingTime} ms</span>}
                  <button
                    className="btn btn-primary btn-sm ml-auto"
                    onClick={() => processImage(primaryGoal)}
                    disabled={!canAnalyze}
                  >
                    {isProcessing ? "Menganalisis..." : analysis ? "Analisis ulang" : "Mulai analisis"}
                  </button>
                </div>

                <div className="face-frame">
                  <img src={image.objectUrl} alt="Foto wajah original" className="face-image" />
                  {processedImage && (
                    <img src={processedImage} alt="Overlay hasil analisis" className="face-image overlay-image" />
                  )}
                  {!processedImage && (
                    <div className="stage-empty">
                      {isProcessing ? "Membaca zona wajah..." : "Tekan Mulai analisis untuk melihat overlay."}
                    </div>
                  )}
                </div>
              </div>

              {analysis?.warning && (
                <div className="alert alert-warning">
                  <span>{analysis.warning}</span>
                </div>
              )}

              {analysis && (
                <div className="zone-grid">
                  {analysis.zones.map((zone) => (
                    <div key={zone.id} className="zone-strip">
                      <span>{zone.label}</span>
                      <strong>{zone.score}</strong>
                      <small>{zone.dominantConcern}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="clinical-panel p-5">
            <p className="kicker">Skin Health Score</p>
            <div className="score-gauge">
              <span>{analysis?.overallScore ?? "--"}</span>
              <small>/100</small>
            </div>
            <p className="mt-3 text-sm text-base-content/65">
              Skor dihitung dari sinyal visual pada foto. Ini analisis pengolahan citra, bukan diagnosis medis.
            </p>
          </div>

          <div className="clinical-panel p-5 space-y-3">
            <div>
              <p className="kicker">Kategori</p>
              <h2 className="text-lg font-semibold">Area bermasalah</h2>
            </div>
            {(analysis?.categories || [
              { id: "acne", label: "Jerawat", score: 0, severity: "pending", count: 0, coverage: 0 },
              { id: "dark_spots", label: "Noda gelap", score: 0, severity: "pending", count: 0, coverage: 0 },
              { id: "wrinkles", label: "Kerutan", score: 0, severity: "pending", count: 0, coverage: 0 },
              { id: "redness", label: "Kemerahan", score: 0, severity: "pending", count: 0, coverage: 0 },
              { id: "pores", label: "Pori besar", score: 0, severity: "pending", count: 0, coverage: 0 }
            ]).map((category) => (
              <div key={category.id} className="condition-row">
                <i
                  className={`condition-marker marker-${category.id}`}
                  style={{ backgroundColor: CONDITION_COLORS[category.id] }}
                ></i>
                <div>
                  <strong>{category.label}</strong>
                  <span>{analysis ? `${category.coverage}% area, ${category.count} titik` : "Menunggu analisis"}</span>
                </div>
                <b>{analysis ? category.score : "--"}</b>
              </div>
            ))}
          </div>

          <div className="clinical-panel p-5 text-sm text-base-content/65">
            <p className="kicker">Pipeline</p>
            <ol className="mt-3 space-y-2">
              <li>1. Deteksi wajah</li>
              <li>2. Isolasi kulit</li>
              <li>3. Bagi zona wajah</li>
              <li>4. Analisis kondisi</li>
              <li>5. Overlay + skor</li>
            </ol>
          </div>
        </aside>

        {error && (
          <div className="lg:col-span-2">
            <div className="alert alert-error">
              <span>{error}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>
                Tutup
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
