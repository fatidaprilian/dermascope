import { useState, useRef, useCallback, useEffect } from "react";
import { ImgLabOperations } from "./utils/operations";

const INTENT_ICONS = {
  Restorasi: "🔧",
  Enhancement: "✨",
  Analysis: "🔍",
  Threshold: "◐",
  Upscaling: "⬆",
  Morphology: "🔬"
};

const DEFAULT_STATUS = {
  state: "checking",
  label: "Checking backend"
};

function App() {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [activeGoal, setActiveGoal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingTime, setProcessingTime] = useState(null);
  const [backendStatus, setBackendStatus] = useState(DEFAULT_STATUS);
  const [wipePercent, setWipePercent] = useState(100);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const fileInputRef = useRef(null);

  const activeOperation = activeGoal
    ? ImgLabOperations.byId(activeGoal.operationId)
    : null;
  const activeCategory = activeOperation?.category || null;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    setBackendStatus(DEFAULT_STATUS);
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
        setBackendStatus({ state: "error", label: "Offline" });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!processedImage) {
      setWipePercent(100);
      return;
    }
    if (prefersReducedMotion) {
      setWipePercent(100);
      return;
    }
    setWipePercent(0);
    const id = requestAnimationFrame(() => setWipePercent(100));
    return () => cancelAnimationFrame(id);
  }, [processedImage, prefersReducedMotion]);

  const resetAll = useCallback(() => {
    if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);
    if (processedImage) URL.revokeObjectURL(processedImage);
    setImage(null);
    setProcessedImage(null);
    setActiveGoal(null);
    setError(null);
    setProcessingTime(null);
    setWipePercent(100);
  }, [image, processedImage]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
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
    setActiveGoal(null);
    setProcessingTime(null);

    const objectUrl = URL.createObjectURL(file);
    setImage({ file, objectUrl, name: file.name, size: file.size });
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

  const processImage = async (goal) => {
    if (!image) return;
    setIsProcessing(true);
    setActiveGoal(goal);
    setError(null);
    setProcessingTime(null);

    const startTime = performance.now();

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
        let msg = "Backend gagal memproses gambar.";
        try {
          const payload = await response.json();
          if (payload?.message) msg = payload.message;
        } catch {}
        throw new Error(msg);
      }

      const blob = await response.blob();
      if (processedImage) URL.revokeObjectURL(processedImage);
      setProcessedImage(URL.createObjectURL(blob));
      setProcessingTime(Math.round(performance.now() - startTime));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!processedImage) return;
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[-:]/g, "").slice(0, 13);
    a.href = processedImage;
    a.download = `imglab-${activeGoal?.id || "result"}-${ts}.png`;
    a.click();
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const wipeStyle = {
    clipPath: `inset(0 ${100 - wipePercent}% 0 0)`
  };

  const handleStyle = {
    left: `${wipePercent}%`
  };

  const statusDot =
    backendStatus.state === "ready"
      ? "bg-success"
      : backendStatus.state === "error"
        ? "bg-error"
        : "bg-warning";

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-4 lg:px-10 pt-6 pb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="kicker">ImgLab</p>
          <h1 className="text-2xl sm:text-3xl font-semibold">Test-Strip Bench</h1>
          <p className="text-sm text-base-content/60 max-w-lg">
            Upload gambar, pilih goal, dan pantau hasil dengan wipe test-strip.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bench-inset px-3 py-2 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`}></span>
            <div className="text-xs">
              <div className="kicker">Safelight</div>
              <div className="text-base-content/70">{backendStatus.label}</div>
            </div>
          </div>
          {image && (
            <button className="btn btn-ghost btn-sm" onClick={resetAll}>
              New image
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 px-4 lg:px-10 pb-10 max-w-7xl mx-auto w-full">
        {!image ? (
          <div className="flex items-center justify-center min-h-[65vh]">
            <div
              className={`bench-panel w-full max-w-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-base-300 bg-base-100 hover:border-primary/60"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V4m0 0L8 8m4-4l4 4M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-1">Upload gambar</h2>
                  <p className="text-base-content/50 text-sm">
                    Drag and drop atau klik untuk memilih file
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="badge badge-outline badge-sm">PNG</span>
                  <span className="badge badge-outline badge-sm">JPEG</span>
                  <span className="badge badge-outline badge-sm">WebP</span>
                  <span className="badge badge-outline badge-sm">Maks 10 MB</span>
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <section className="flex flex-col gap-4">
              <div className="bench-panel overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-base-300 text-sm">
                  <div>
                    <p className="kicker">Contact sheet</p>
                    <p className="font-medium truncate max-w-[240px]">{image.name}</p>
                  </div>
                  <span className="text-base-content/40">|</span>
                  <span className="text-base-content/50">{formatBytes(image.size)}</span>
                  {processingTime && (
                    <span className="font-mono text-xs text-success">{processingTime} ms</span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {processedImage && (
                      <button className="btn btn-success btn-xs gap-1" onClick={downloadResult}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Export
                      </button>
                    )}
                    <button className="btn btn-ghost btn-xs" onClick={resetAll}>
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="bench-inset relative min-h-[360px] overflow-hidden flex items-center justify-center">
                    <img
                      src={image.objectUrl}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    {processedImage && (
                      <div className="absolute inset-0" style={wipeStyle}>
                        <img
                          src={processedImage}
                          alt="Processed result"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {!processedImage && (
                      <div className="relative z-10 flex flex-col items-center gap-2 text-base-content/60">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm">Pilih goal di kanan untuk mulai</span>
                      </div>
                    )}

                    {processedImage && (
                      <div className="absolute inset-y-0 pointer-events-none" style={handleStyle}>
                        <div className="h-full w-px bg-primary/70"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-14 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-semibold shadow-md">
                          ||
                        </div>
                      </div>
                    )}
                  </div>

                  {processedImage && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-base-content/60">
                        <span className="kicker">Test strip wipe</span>
                        <span className="font-mono">{wipePercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={wipePercent}
                        onChange={(e) => setWipePercent(Number(e.target.value))}
                        className="range range-xs range-primary"
                        aria-label="Test strip wipe"
                      />
                    </div>
                  )}
                </div>
              </div>

              {activeGoal && !isProcessing && processedImage && (
                <div className="alert alert-success shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong>{activeGoal.label}</strong> selesai diproses.
                  </span>
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-4">
              <div className="bench-panel p-5 space-y-4">
                <div>
                  <p className="kicker">Toolkit</p>
                  <h2 className="text-base font-semibold">Goal strip</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ImgLabOperations.categories.map((category) => {
                    const isActive = activeCategory === category.id;
                    return (
                      <span
                        key={category.id}
                        className={`badge badge-sm ${
                          isActive ? "badge-primary" : "badge-ghost"
                        }`}
                      >
                        {category.label}
                      </span>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2">
                  {ImgLabOperations.goals.map((goal) => {
                    const isActive = activeGoal?.id === goal.id;
                    return (
                      <button
                        key={goal.id}
                        className={`btn justify-start text-left h-auto py-3 px-4 gap-3 transition-all ${
                          isActive
                            ? "btn-primary"
                            : "btn-ghost hover:bg-base-200"
                        }`}
                        onClick={() => processImage(goal)}
                        disabled={isProcessing}
                      >
                        <span className="text-lg shrink-0">
                          {INTENT_ICONS[goal.intent] || "*"}
                        </span>
                        <div className="flex flex-col items-start min-w-0">
                          <span className="font-medium text-sm">{goal.label}</span>
                          <span
                            className={`text-xs truncate max-w-full ${
                              isActive ? "text-primary-content/70" : "opacity-50"
                            }`}
                          >
                            {goal.summary}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary">
                    <span className="loading loading-spinner loading-sm"></span>
                    Memproses gambar...
                  </div>
                )}

                {activeOperation && (
                  <div className="bench-inset p-3 text-xs text-base-content/70 space-y-1">
                    <div className="kicker">Bench notes</div>
                    <div className="flex items-center justify-between">
                      <span>Operation</span>
                      <span className="font-mono">{activeOperation.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Output</span>
                      <span className="font-mono">{activeOperation.outputMode}</span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {error && (
          <div className="mt-4 max-w-2xl mx-auto">
            <div className="alert alert-error shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>
                ✕
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
