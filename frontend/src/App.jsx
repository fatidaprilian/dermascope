import { useState, useRef, useCallback, useEffect } from "react";
import { DermaScopeOperations } from "./utils/operations";

const CONDITION_COLORS = {
  acne: "#e0462d",       /* Vermilion Ink */
  dark_spots: "#785942", /* Umber Ink */
  wrinkles: "#2b5cb5",   /* Cobalt Ink */
  redness: "#c92464",   /* Rhodamine Ink */
  pores: "#18785a"       /* Veridian Ink */
};

const CONDITION_LABELS = {
  acne: "Jerawat",
  dark_spots: "Noda Gelap",
  wrinkles: "Kerutan",
  redness: "Kemerahan",
  pores: "Pori-pori Besar"
};

const EMPTY_CATEGORIES = [
  { id: "acne", label: "Jerawat", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "dark_spots", label: "Noda Gelap", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "wrinkles", label: "Kerutan", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "redness", label: "Kemerahan", score: 0, severity: "pending", count: 0, coverage: 0 },
  { id: "pores", label: "Pori-pori Besar", score: 0, severity: "pending", count: 0, coverage: 0 }
];

const PIPELINE_STEPS = [
  "Memvalidasi berkas foto",
  "Mendeteksi posisi wajah",
  "Mengisolasi area kulit",
  "Memetakan zona wajah",
  "Menghasilkan overlay gambar"
];

const DEFAULT_STATUS = {
  state: "checking",
  label: "Menghubungkan layanan..."
};

function parseAnalysisHeader(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Metadata analisis terganggu. Silakan coba kembali.");
  }
}

function App() {
  const [image, setImage] = useState(null);
  const [preprocessedImage, setPreprocessedImage] = useState(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [preprocessWarning, setPreprocessWarning] = useState(null);
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

  /* Active Plate Alignment Toggles & Hovers */
  const [activePlates, setActivePlates] = useState({
    acne: true,
    dark_spots: true,
    wrinkles: true,
    redness: true,
    pores: true
  });
  const [hoveredPlate, setHoveredPlate] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(null);
  const preprocessRequestRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Connection failed");
        return response.json();
      })
      .then((data) => {
        if (!alive) return;
        const engine = data?.engine ? ` (${data.engine})` : "";
        setBackendStatus({ state: "ready", label: `Laci tekan siap${engine}` });
      })
      .catch(() => {
        if (!alive) return;
        setBackendStatus({ state: "error", label: "Laci tekan offline" });
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
    if (preprocessedImage) URL.revokeObjectURL(preprocessedImage);
    if (processedImage) URL.revokeObjectURL(processedImage);
    if (fileInputRef.current) fileInputRef.current.value = "";
    requestRef.current = null;
    preprocessRequestRef.current = null;
    stopCamera();
    setImage(null);
    setPreprocessedImage(null);
    setIsPreprocessing(false);
    setPreprocessWarning(null);
    setProcessedImage(null);
    setAnalysis(null);
    setError(null);
    setProcessingTime(null);
    setActivePlates({
      acne: true,
      dark_spots: true,
      wrinkles: true,
      redness: true,
      pores: true
    });
    setHoveredPlate(null);
  }, [image, preprocessedImage, processedImage, stopCamera]);

  const preprocessImage = useCallback(async (file) => {
    const requestId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now());
    preprocessRequestRef.current = requestId;
    setIsPreprocessing(true);
    setPreprocessWarning(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/preprocess", {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        let msg = "Deteksi lempeng wajah awal gagal. Menggunakan lembar dasar.";
        try {
          const payload = await response.json();
          if (payload?.message) msg = payload.message;
        } catch {
          // Fallback
        }
        throw new Error(msg);
      }

      const blob = await response.blob();
      if (preprocessRequestRef.current !== requestId) return;
      const warnings = response.headers.get("X-DermaScope-Warnings");
      const parsedWarnings = warnings ? JSON.parse(warnings) : [];
      const nextPreprocessedImage = URL.createObjectURL(blob);
      setPreprocessedImage((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextPreprocessedImage;
      });
      setPreprocessWarning(parsedWarnings[0] || null);
    } catch (err) {
      if (preprocessRequestRef.current !== requestId) return;
      setPreprocessWarning(err instanceof Error ? err.message : "Deteksi awal lempeng wajah gagal.");
    } finally {
      if (preprocessRequestRef.current === requestId) setIsPreprocessing(false);
    }
  }, []);

  const acceptImageFile = useCallback((file) => {
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Format lempeng tidak didukung. Gunakan PNG, JPEG, atau WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran lempeng melebihi batas. Maksimal 10 MB.");
      return;
    }

    if (image?.objectUrl) URL.revokeObjectURL(image.objectUrl);
    if (preprocessedImage) URL.revokeObjectURL(preprocessedImage);
    if (processedImage) URL.revokeObjectURL(processedImage);

    setError(null);
    setPreprocessedImage(null);
    setPreprocessWarning(null);
    setProcessedImage(null);
    setAnalysis(null);
    setProcessingTime(null);

    const objectUrl = URL.createObjectURL(file);
    setImage({ file, objectUrl, name: file.name, size: file.size });
    void preprocessImage(file);
  }, [image, preprocessedImage, processedImage, preprocessImage]);

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
      setError("Pilih berkas citra wajah yang sah.");
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Modul kamera tidak didukung oleh peramban ini.");
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
      setError("Kamera gagal diaktifkan. Periksa hak izin kamera.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  const captureCameraPhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Modul laci kamera belum siap.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Gagal merekam data lembar kamera.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    if (!blob) {
      setError("Gagal menyusun lembar kamera.");
      return;
    }
    const file = new File([blob], `kamera-cetak-${Date.now()}.jpg`, { type: "image/jpeg" });
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
        throw new Error("Lembaga analisis laci cetak tidak ditemukan.");
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
        let msg = "Mesin cetak gagal memetakan lempeng wajah ini.";
        try {
          const payload = await response.json();
          if (payload?.message) msg = payload.message;
        } catch {
          // Fallback
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
      setError(err instanceof Error ? err.message : "Analisis gambar gagal.");
    } finally {
      if (requestRef.current === requestId) setIsProcessing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const togglePlate = (plateId) => {
    setActivePlates((prev) => ({
      ...prev,
      [plateId]: !prev[plateId]
    }));
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
    ? "Menganalisis kondisi kulit wajah..."
    : processedImage
      ? "Analisis selesai. Lapisan deteksi siap ditampilkan."
      : isPreprocessing
        ? "Mendeteksi posisi wajah..."
        : preprocessedImage
          ? "Deteksi wajah berhasil."
          : image
            ? "Foto siap dianalisis."
            : "Belum ada foto wajah.";

  const visibleImage = processedImage || preprocessedImage || image?.objectUrl;
  const visibleImageAlt = processedImage
    ? "Hasil analisis kulit wajah"
    : preprocessedImage
      ? "Hasil deteksi area wajah"
      : "Foto wajah asli";

  /* Determine CSS overlays based on active aligned plate toggles */
  const activePlatesCount = Object.values(activePlates).filter(Boolean).length;
  const isAnyPlateActive = activePlatesCount > 0;
  
  /* Create special filter values for print registration sheet alignment */
  const overlayStyle = {
    opacity: isAnyPlateActive ? (processedImage ? 0.92 : 1) : 0,
    mixBlendMode: "multiply",
    filter: hoveredPlate 
      ? `contrast(1.4) saturate(1.2) drop-shadow(0px 0px 4px ${CONDITION_COLORS[hoveredPlate]})`
      : `contrast(1.2) saturate(1.1)`,
    transition: "opacity 200ms ease-out, filter 200ms ease-out"
  };

  return (
    <div className="min-h-screen derma-shell text-base-content" aria-busy={isProcessing}>
      {/* Press Bed Header */}
      <header className="survey-masthead">
        <div className="brand-block">
          <div className="product-mark" aria-hidden="true">DS</div>
          <div>
            <p className="kicker">DermaScope / Analisis Kulit Wajah</p>
            <h1 className="font-serif">Pemetaan Sinyal Kondisi Kulit Wajah</h1>
          </div>
        </div>

        <div className="status-cluster" aria-live="polite">
          <div className={`status-pill ${statusClass}`}>
            <span className="status-light"></span>
            <span>{backendStatus.label}</span>
          </div>
          <div className="privacy-pill">Satu foto per sesi analisis. Tanpa pengarsipan berkas.</div>
        </div>
      </header>

      {/* Main Printmaker Press Bed Layout */}
      <main className={`survey-main ${image ? "has-image" : "is-intake"}`}>
        <section className={image ? "map-workbench" : "acquisition-layout"}>
          {!image ? (
            <>
              {/* Intake Station: Left Info Board */}
              <div className="intake-copy">
                <div>
                  <p className="kicker">STN-00 / Ambil Foto Wajah</p>
                  <h2 className="font-serif leading-none">Analisis kondisi kulit wajah Anda dari satu foto.</h2>
                  <p>
                    DermaScope memetakan jerawat, noda gelap, kerutan, kemerahan, dan pori-pori besar dari 
                    satu foto wajah secara instan tanpa menyimpan data Anda di server kami.
                  </p>
                </div>

                <div className="intake-facts" aria-label="Batas lembar cetak">
                  <span>Format PNG, JPEG, WebP</span>
                  <span>Ukuran Berkas Maks 10 MB</span>
                  <span>Bukan Diagnosis Medis</span>
                </div>

                {/* Color bar legend showing accessible shapes and labels */}
                <div className="condition-legend" aria-label="Legenda Piringan Warna">
                  {Object.keys(CONDITION_COLORS).map((id) => (
                    <span key={id} className="gap-2">
                      <i className={`condition-marker marker-${id}`} aria-hidden="true"></i>
                      <span>{CONDITION_LABELS[id]}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Intake Station: Right Upload/Camera selector */}
              <div className="acquisition-ledger">
                <div className="source-tabs" aria-label="Pilih mekanisme lempeng">
                  <button
                    type="button"
                    className={inputMode === "upload" ? "active" : ""}
                    onClick={() => {
                      stopCamera();
                      setInputMode("upload");
                    }}
                  >
                    Unggah Foto
                  </button>
                  <button
                    type="button"
                    className={inputMode === "camera" ? "active" : ""}
                    onClick={() => setInputMode("camera")}
                  >
                    Gunakan Kamera
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
                      <h2>Pilih atau Seret Foto Wajah</h2>
                      <p>Gunakan foto menghadap ke depan dengan pencahayaan merata untuk hasil analisis terbaik.</p>
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
                          <span>Kamera Belum Aktif</span>
                          <small>Hadapkan wajah tegak ke kamera dengan pencahayaan yang cukup.</small>
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
                        {isCameraStarting ? "Membuka..." : "Aktifkan Kamera"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={captureCameraPhoto}
                        disabled={!isCameraActive}
                      >
                        Ambil Foto Wajah
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={stopCamera}
                        disabled={!isCameraActive}
                      >
                        Matikan Kamera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Key Print Compile Stage */}
              <div className="map-panel">
                <div className="stage-header">
                  <div className="stage-meta">
                    <p className="kicker">MAP-01 / Analisis Gambar</p>
                    <h2 className="font-serif font-bold text-lg">{image.name}</h2>
                    <span>{stageStatus}</span>
                  </div>
                  <div className="stage-stats">
                    <span>{formatBytes(image.size)}</span>
                    {processingTime && <span>Waktu: {processingTime} ms</span>}
                  </div>
                  <div className="stage-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => processImage(primaryGoal)}
                      disabled={!canAnalyze}
                    >
                      {isProcessing ? "Menganalisis..." : analysis ? "Analisis Ulang" : "Mulai Analisis"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={resetAll}>
                      Foto Baru
                    </button>
                  </div>
                </div>

                {/* Base Plate Photo Frame with mechanical border markings */}
                <div className="face-frame">
                  {/* Base original/preprocessed image */}
                  {visibleImage && (
                    <img 
                      src={preprocessedImage || image.objectUrl} 
                      alt="Base plate photo" 
                      className="face-image"
                    />
                  )}
                  
                  {/* Overlay separation image compiled from backend, subject to plate toggles */}
                  {processedImage && (
                    <img 
                      src={processedImage} 
                      alt={visibleImageAlt} 
                      className="face-image overlay-image" 
                      style={overlayStyle}
                    />
                  )}

                  {!processedImage && !preprocessedImage && (
                    <div className="stage-empty">
                      {isPreprocessing
                        ? "Mendeteksi area wajah..."
                        : isProcessing
                          ? "Menganalisis sebaran kondisi kulit..."
                          : "Tekan tombol Mulai Analisis untuk melihat peta deteksi."}
                    </div>
                  )}

                  {/* Mechanical alignment overlay target markers (visible on hover) */}
                  {hoveredPlate && analysis && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                      style={{ border: `2px dashed ${CONDITION_COLORS[hoveredPlate]}` }}
                    >
                      <div className="absolute top-4 left-4 font-mono text-[0.62rem] px-2 py-0.5 border"
                           style={{ color: CONDITION_COLORS[hoveredPlate], borderColor: CONDITION_COLORS[hoveredPlate], backgroundColor: "rgba(10,11,11,0.85)" }}>
                        FOKUS: {hoveredPlate.toUpperCase()}
                      </div>
                      <div className="w-16 h-16 border-2 border-full rounded-full" style={{ borderColor: CONDITION_COLORS[hoveredPlate], borderStyle: "dotted" }}></div>
                    </div>
                  )}
                </div>
              </div>

              {preprocessWarning && !analysis && (
                <div className="alert alert-warning evidence-alert font-mono text-xs">
                  <span>{preprocessWarning}</span>
                </div>
              )}

              {analysis?.warning && (
                <div className="alert alert-warning evidence-alert font-mono text-xs">
                  <span>{analysis.warning}</span>
                </div>
              )}

              {/* Zone Calibration Readout Blocks */}
              {analysis && (
                <div className="zone-band" aria-label="Kalibrasi Sektor Wajah">
                  {analysis.zones.map((zone) => (
                    <div key={zone.id} className="zone-record">
                      <span>{zone.label}</span>
                      <strong>{zone.score}</strong>
                      <small>{zone.dominantConcern || "SEMBURAN RATA"}</small>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* Aside Margin Calibration & Separation Plates */}
        <aside className="evidence-register">
          {/* Main print compile score block */}
          <section className="register-panel score-panel">
            <p className="kicker">DERMA SCORE / SKOR KESEHATAN KULIT</p>
            <div className="score-value">
              <span>{analysis?.overallScore ?? "--"}</span>
              <small>/100</small>
            </div>
            <p>
              Skor dihitung berdasarkan deteksi sinyal visual pada foto wajah. Hasil ini merupakan analisis gambar dan bukan diagnosis medis resmi.
            </p>
          </section>

          {/* Interactive Separation Plates Checklist */}
          <section className="register-panel condition-panel">
            <div className="panel-title-row">
              <div>
                <p className="kicker">Filter Lapisan Sinyal</p>
                <h2 className="font-serif">Kategori Deteksi</h2>
              </div>
              <span>{analysis ? "Terdeteksi" : "Menunggu"}</span>
            </div>

            <div className="condition-list">
              {visibleCategories.map((category, index) => {
                const score = analysis ? category.score : 0;
                const isChecked = activePlates[category.id];
                const isHovered = hoveredPlate === category.id;
                
                return (
                  <div
                    key={category.id}
                    className="condition-row cursor-pointer"
                    style={{ 
                      "--signal-color": CONDITION_COLORS[category.id],
                      opacity: isChecked ? 1 : 0.45,
                      borderColor: isHovered ? "var(--line-hard)" : "var(--line-soft)",
                      transform: isHovered ? "translateY(-1px)" : "none",
                      animationDelay: `${index * 40}ms`
                    }}
                    onClick={() => togglePlate(category.id)}
                    onMouseEnter={() => setHoveredPlate(category.id)}
                    onMouseLeave={() => setHoveredPlate(null)}
                  >
                    {/* Accessibly distinct marker shape */}
                    <i className={`condition-marker marker-${category.id}`} aria-hidden="true"></i>
                    
                    <div className="condition-copy">
                      <strong className="flex items-center gap-2">
                        {category.label}
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} /* Handled by parent div onClick */
                          className="checkbox checkbox-xs"
                          aria-label={`Toggle plate ${category.label}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </strong>
                      <span>
                        {analysis ? `Cakupan ${category.coverage}%, ${category.count} titik` : "Menunggu analisis"}
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

          {/* Press Run Pipeline Progress */}
          <section className="register-panel process-panel">
            <p className="kicker">Proses Penyusunan</p>
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
                Tutup Peringatan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
