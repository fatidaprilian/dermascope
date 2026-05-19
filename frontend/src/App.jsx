import { useState, useRef, useCallback, useEffect } from "react";
import { DermaScopeOperations } from "./utils/operations";

const CONDITION_COLORS = {
  acne: "#ff5a1f",
  dark_spots: "#8a4d00",
  wrinkles: "#007b8f",
  redness: "#d1007f",
  pores: "#617a1f"
};

const CONDITION_LABELS = {
  acne: "Jerawat",
  dark_spots: "Noda gelap",
  wrinkles: "Kerutan",
  redness: "Kemerahan",
  pores: "Pori besar"
};

const EMPTY_CATEGORIES = [
  { id: "acne", label: "Jerawat", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "dark_spots", label: "Noda gelap", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "wrinkles", label: "Kerutan", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "redness", label: "Kemerahan", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "pores", label: "Pori besar", score: 0, severity: "pending", count: 0, coverage: 0 }
];

const PIPELINE_STEPS = [
  "Validasi file",
  "Deteksi wajah",
  "Isolasi area kulit",
  "Pemetaan zona",
  "Overlay dan skor"
];

const DEFAULT_STATUS = {
  state: "checking",
  label: "Menguji layanan"
};

function parseAnalysisHeader(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Metadata analisis rusak. Coba proses ulang foto.");
  }
}

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
  const requestRef = useRef(null);

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
        setBackendStatus({ state: "ready", label: `Siap ukur${engine}` });
      })
      .catch(() => {
        if (!alive) return;
        setBackendStatus({ state: "error", label: "Layanan offline" });
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
    requestRef.current = null;
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
      setError("File terlalu besar. Batas maksimal 10 MB.");
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
      acceptImageFile(file);
    } else {
      setError("Pilih file gambar yang valid.");
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
    const requestId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now());
    requestRef.current = requestId;
    setIsProcessing(true);
    setError(null);
    setProcessingTime(null);

    try {
      const operation = DermaScopeOperations.byId(goal.operationId);
      if (!operation) {
        throw new Error("Alat analisis tidak ditemukan.");
      }
      const defaults = DermaScopeOperations.defaultsFor(operation);

      const formData = new FormData();
      formData.append("file", image.file);
      formData.append("goal_id", goal.id);
      formData.append("parameters", JSON.stringify(defaults));

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        let msg = "Layanan analisis tidak dapat memproses gambar ini.";
        try {
          const payload = await response.json();
          if (payload?.message) msg = payload.message;
        } catch {
          // Keep the safe generic message when the backend returns non-JSON.
        }
        throw new Error(msg);
      }

      const blob = await response.blob();
      if (requestRef.current !== requestId) return;
      const elapsedHeader =
        response.headers.get("X-DermaScope-Processing-Time") ||
        response.headers.get("X-Processing-Time-Ms");
      const analysisHeader = response.headers.get("X-DermaScope-Analysis");
      const parsedAnalysis = parseAnalysisHeader(analysisHeader);
      const elapsedMs = Number(elapsedHeader);
      const nextProcessedImage = URL.createObjectURL(blob);
      if (processedImage) URL.revokeObjectURL(processedImage);
      setProcessedImage(nextProcessedImage);
      setAnalysis(parsedAnalysis);
      setProcessingTime(Number.isFinite(elapsedMs) && elapsedMs > 0 ? Math.round(elapsedMs) : null);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Analisis gagal.");
    } finally {
      if (requestRef.current === requestId) setIsProcessing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const primaryGoal = DermaScopeOperations.goals[0];
  const canAnalyze = image && backendStatus.state === "ready" && !isProcessing;
  const visibleCategories = analysis?.categories || EMPTY_CATEGORIES;
  const statusClass =
    backendStatus.state === "ready"
      ? "is-ready"
      : backendStatus.state === "error"
        ? "is-error"
        : "is-pending";
  const stageStatus = isProcessing
    ? "Menginspeksi area wajah..."
    : processedImage
      ? "Peta kontur sudah siap."
      : image
        ? "Foto siap ditelusuri."
        : "Belum ada foto.";

  return (
    <div className="min-h-screen derma-shell text-base-content" aria-busy={isProcessing}>
      <header className="survey-masthead">
        <div className="brand-block">
          <div className="product-mark" aria-hidden="true">DS</div>
          <div>
            <p className="kicker">DermaScope / Face Signal Survey</p>
            <h1>Peta kontur sinyal kulit wajah</h1>
          </div>
        </div>

        <div className="status-cluster" aria-live="polite">
          <div className={`status-pill ${statusClass}`}>
            <span className="status-light"></span>
            <span>{backendStatus.label}</span>
          </div>
          <div className="privacy-pill">Satu foto per sesi. Tidak ada riwayat tersimpan.</div>
        </div>
      </header>

      <main className={`survey-main ${image ? "has-image" : "is-intake"}`}>
        <section className={image ? "map-workbench" : "acquisition-layout"}>
          {!image ? (
            <>
              <div className="intake-copy">
                <p className="kicker">STN-00 / Akuisisi foto</p>
                <h2>Satu wajah, dibaca sebagai permukaan sinyal.</h2>
                <p>
                  DermaScope menelusuri jerawat, noda gelap, kerutan, kemerahan, dan pori besar dari foto yang jelas,
                  lalu mengembalikannya sebagai overlay, skor, dan sektor wajah.
                </p>

                <div className="intake-facts" aria-label="Ringkasan batas analisis">
                  <span>PNG, JPEG, WebP</span>
                  <span>Maks 10 MB</span>
                  <span>Tanpa arsip foto</span>
                </div>

                <div className="condition-legend" aria-label="Legenda kondisi">
                  {Object.entries(CONDITION_COLORS).map(([id, color]) => (
                    <span key={id}>
                      <i className={`condition-marker marker-${id}`} style={{ backgroundColor: color }}></i>
                      {CONDITION_LABELS[id]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="acquisition-ledger">
                <div className="source-tabs" aria-label="Pilih sumber foto">
                  <button
                    type="button"
                    className={inputMode === "upload" ? "active" : ""}
                    onClick={() => {
                      stopCamera();
                      setInputMode("upload");
                    }}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className={inputMode === "camera" ? "active" : ""}
                    onClick={() => setInputMode("camera")}
                  >
                    Kamera
                  </button>
                </div>

                {inputMode === "upload" ? (
                  <div
                    className={`source-station ${isDragOver ? "is-dragging" : ""}`}
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
                    <span className="upload-symbol" aria-hidden="true">+</span>
                    <div>
                      <h2>Plot foto wajah</h2>
                      <p>Gunakan foto depan dengan pencahayaan rata agar kontur sinyal lebih terbaca.</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                    />
                  </div>
                ) : (
                  <div className="camera-ledger">
                    <div className="camera-preview">
                      <video ref={videoRef} playsInline muted aria-label="Preview kamera wajah"></video>
                      {!isCameraActive && (
                        <div className="camera-empty">
                          <span>Kamera belum aktif</span>
                          <small>Hadapkan wajah ke kamera dengan cahaya yang stabil.</small>
                        </div>
                      )}
                    </div>
                    <div className="camera-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={startCamera}
                        disabled={isCameraStarting || isCameraActive}
                      >
                        {isCameraStarting ? "Membuka..." : "Aktifkan"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
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
            </>
          ) : (
            <>
              <div className="map-panel">
                <div className="stage-header">
                  <div className="stage-meta">
                    <p className="kicker">MAP-01 / Permukaan wajah</p>
                    <h2>{image.name}</h2>
                    <span>{stageStatus}</span>
                  </div>
                  <div className="stage-stats">
                    <span>{formatBytes(image.size)}</span>
                    {processingTime && <span>{processingTime} ms</span>}
                  </div>
                  <div className="stage-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => processImage(primaryGoal)}
                      disabled={!canAnalyze}
                    >
                      {isProcessing ? "Menganalisis..." : analysis ? "Analisis ulang" : "Mulai analisis"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={resetAll}>
                      Foto baru
                    </button>
                  </div>
                </div>

                <div className={`face-frame ${processedImage ? "has-overlay" : ""}`}>
                  <img src={image.objectUrl} alt="Foto wajah original" className="face-image" />
                  {processedImage && (
                    <img src={processedImage} alt="Overlay hasil analisis" className="face-image overlay-image" />
                  )}
                  {!processedImage && (
                    <div className="stage-empty">
                      {isProcessing ? "Menelusuri kontur sinyal..." : "Mulai analisis untuk membuka overlay."}
                    </div>
                  )}
                </div>
              </div>

              {analysis?.warning && (
                <div className="alert alert-warning evidence-alert">
                  <span>{analysis.warning}</span>
                </div>
              )}

              {analysis && (
                <div className="zone-band" aria-label="Breakdown zona wajah">
                  {analysis.zones.map((zone) => (
                    <div key={zone.id} className="zone-record">
                      <span>{zone.label}</span>
                      <strong>{zone.score}</strong>
                      <small>{zone.dominantConcern}</small>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="evidence-register">
          <section className="register-panel score-panel">
            <p className="kicker">SCORE STATION</p>
            <div className="score-value">
              <span>{analysis?.overallScore ?? "--"}</span>
              <small>/100</small>
            </div>
            <p>
              Skor berasal dari sinyal visual pada foto. Hasil ini adalah pemetaan citra, bukan diagnosis medis.
            </p>
          </section>

          <section className="register-panel condition-panel">
            <div className="panel-title-row">
              <div>
                <p className="kicker">Layer sinyal</p>
                <h2>Simbol yang terbaca</h2>
              </div>
              <span>{analysis ? "Terpetakan" : "Menunggu"}</span>
            </div>

            <div className="condition-list">
              {visibleCategories.map((category) => {
                const score = analysis ? category.score : 0;
                return (
                  <div
                    key={category.id}
                    className="condition-row"
                    style={{ "--signal-color": CONDITION_COLORS[category.id] }}
                  >
                    <i
                      className={`condition-marker marker-${category.id}`}
                      style={{ backgroundColor: CONDITION_COLORS[category.id] }}
                    ></i>
                    <div className="condition-copy">
                      <strong>{category.label}</strong>
                      <span>
                        {analysis ? `${category.coverage}% area, ${category.count} titik` : "Belum dipetakan"}
                      </span>
                      <div className="condition-meter" aria-hidden="true">
                        <span style={{ width: `${Math.max(0, Math.min(100, score))}%` }}></span>
                      </div>
                    </div>
                    <b>{analysis ? category.score : "--"}</b>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="register-panel process-panel">
            <p className="kicker">Traverse</p>
            <ol>
              {PIPELINE_STEPS.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </aside>

        {error && (
          <div className="error-region" role="alert" aria-live="assertive">
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
