

  const categories = [
    { id: "restoration", label: "Restoration" },
    { id: "enhancement", label: "Enhancement" },
    { id: "edge-segmentation", label: "Edges & Threshold" },
    { id: "upscaling", label: "Upscaling" },
    { id: "morphology", label: "Morphology" }
  ];

  const goals = [
    {
      id: "clean-noise",
      label: "Kurangi noise",
      summary: "Untuk foto yang terlihat kasar atau berbintik.",
      operationId: "bilateral-filter",
      intent: "Restorasi"
    },
    {
      id: "remove-specks",
      label: "Hapus bintik",
      summary: "Untuk noise titik hitam/putih seperti salt-and-pepper.",
      operationId: "median-filter",
      intent: "Restorasi"
    },
    {
      id: "make-clear",
      label: "Perjelas detail",
      summary: "Untuk membuat tepi dan tekstur lebih tegas.",
      operationId: "sharpen",
      intent: "Enhancement"
    },
    {
      id: "fix-tone",
      label: "Perbaiki kontras",
      summary: "Untuk gambar yang datar atau kurang kontras.",
      operationId: "histogram-equalization",
      intent: "Enhancement"
    },
    {
      id: "adjust-light",
      label: "Atur terang",
      summary: "Untuk mengubah brightness dan contrast langsung.",
      operationId: "brightness-contrast",
      intent: "Enhancement"
    },
    {
      id: "find-edges",
      label: "Cari tepi",
      summary: "Untuk melihat batas objek dan struktur utama.",
      operationId: "canny-edge",
      intent: "Analysis"
    },
    {
      id: "scan-document",
      label: "Buat hitam-putih",
      summary: "Untuk dokumen atau gambar dengan pencahayaan tidak rata.",
      operationId: "adaptive-threshold",
      intent: "Threshold"
    },
    {
      id: "enlarge",
      label: "Besarkan gambar",
      summary: "Untuk menaikkan resolusi dengan interpolasi bicubic.",
      operationId: "resize-bicubic",
      intent: "Upscaling"
    },
    {
      id: "clean-shape",
      label: "Rapikan bentuk",
      summary: "Untuk menutup celah kecil pada area foreground.",
      operationId: "closing",
      intent: "Morphology"
    }
  ];

  const operations = [
    {
      id: "gaussian-blur",
      category: "restoration",
      label: "Gaussian blur",
      description: "Reduces mild noise with a weighted blur. Larger kernels smooth more detail.",
      outputMode: "color",
      parameters: [
        { id: "kernelSize", label: "Kernel size", type: "number", min: 3, max: 31, step: 2, defaultValue: 5, odd: true },
        { id: "sigma", label: "Sigma", type: "number", min: 0, max: 10, step: 0.5, defaultValue: 1.5 }
      ]
    },
    {
      id: "median-filter",
      category: "restoration",
      label: "Median filter",
      description: "Removes isolated bright or dark specks while keeping stronger boundaries.",
      outputMode: "color",
      parameters: [
        { id: "kernelSize", label: "Kernel size", type: "number", min: 3, max: 15, step: 2, defaultValue: 5, odd: true }
      ]
    },
    {
      id: "bilateral-filter",
      category: "restoration",
      label: "Bilateral filter",
      description: "Smooths color noise while preserving edges better than a normal blur.",
      outputMode: "color",
      parameters: [
        { id: "diameter", label: "Diameter", type: "number", min: 3, max: 15, step: 2, defaultValue: 7, odd: true },
        { id: "sigmaColor", label: "Sigma color", type: "number", min: 10, max: 150, step: 5, defaultValue: 75 },
        { id: "sigmaSpace", label: "Sigma space", type: "number", min: 10, max: 150, step: 5, defaultValue: 75 }
      ]
    },
    {
      id: "grayscale",
      category: "enhancement",
      label: "Grayscale",
      description: "Converts the image to luminance so tone and structure are easier to read.",
      outputMode: "grayscale",
      parameters: []
    },
    {
      id: "histogram-equalization",
      category: "enhancement",
      label: "Histogram equalization",
      description: "Redistributes tonal values to improve global contrast.",
      outputMode: "grayscale",
      parameters: []
    },
    {
      id: "brightness-contrast",
      category: "enhancement",
      label: "Brightness & contrast",
      description: "Changes overall lightness and tonal separation with direct controls.",
      outputMode: "color",
      parameters: [
        { id: "brightness", label: "Brightness", type: "number", min: -100, max: 100, step: 1, defaultValue: 0 },
        { id: "contrast", label: "Contrast", type: "number", min: 0.25, max: 3, step: 0.05, defaultValue: 1.2 }
      ]
    },
    {
      id: "gamma-correction",
      category: "enhancement",
      label: "Gamma correction",
      description: "Adjusts midtones without moving black and white points as much.",
      outputMode: "color",
      parameters: [
        { id: "gamma", label: "Gamma", type: "number", min: 0.2, max: 3, step: 0.05, defaultValue: 1.2 }
      ]
    },
    {
      id: "sharpen",
      category: "enhancement",
      label: "Sharpen",
      description: "Uses unsharp masking to emphasize detail around edges.",
      outputMode: "color",
      parameters: [
        { id: "amount", label: "Amount", type: "number", min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
        { id: "radius", label: "Radius", type: "number", min: 3, max: 21, step: 2, defaultValue: 5, odd: true }
      ]
    },
    {
      id: "canny-edge",
      category: "edge-segmentation",
      label: "Canny edge",
      description: "Detects strong boundaries after smoothing and hysteresis thresholding.",
      outputMode: "edge-map",
      parameters: [
        { id: "threshold1", label: "Low threshold", type: "number", min: 0, max: 255, step: 1, defaultValue: 60 },
        { id: "threshold2", label: "High threshold", type: "number", min: 0, max: 255, step: 1, defaultValue: 150 },
        { id: "apertureSize", label: "Aperture", type: "select", options: ["3", "5", "7"], defaultValue: "3" }
      ]
    },
    {
      id: "otsu-threshold",
      category: "edge-segmentation",
      label: "Otsu threshold",
      description: "Finds an automatic threshold for binary separation.",
      outputMode: "binary",
      parameters: [
        { id: "invert", label: "Invert output", type: "boolean", defaultValue: false }
      ]
    },
    {
      id: "adaptive-threshold",
      category: "edge-segmentation",
      label: "Adaptive threshold",
      description: "Builds a binary image from local neighborhoods, useful for uneven lighting.",
      outputMode: "binary",
      parameters: [
        { id: "blockSize", label: "Block size", type: "number", min: 3, max: 51, step: 2, defaultValue: 11, odd: true },
        { id: "constant", label: "Constant", type: "number", min: -20, max: 20, step: 1, defaultValue: 2 },
        { id: "method", label: "Method", type: "select", options: ["mean", "gaussian"], defaultValue: "gaussian" }
      ]
    },
    {
      id: "resize-bilinear",
      category: "upscaling",
      label: "Bilinear resize",
      description: "Fast interpolation baseline for enlarging an image.",
      outputMode: "color",
      parameters: [
        { id: "scale", label: "Scale", type: "number", min: 1, max: 4, step: 0.25, defaultValue: 2 }
      ]
    },
    {
      id: "resize-bicubic",
      category: "upscaling",
      label: "Bicubic resize",
      description: "Smoother interpolation for enlarging an image.",
      outputMode: "color",
      parameters: [
        { id: "scale", label: "Scale", type: "number", min: 1, max: 4, step: 0.25, defaultValue: 2 }
      ]
    },
    {
      id: "resize-lanczos",
      category: "upscaling",
      label: "Lanczos resize",
      description: "Sharper interpolation with more compute cost than bilinear or bicubic.",
      outputMode: "color",
      parameters: [
        { id: "scale", label: "Scale", type: "number", min: 1, max: 4, step: 0.25, defaultValue: 2 }
      ]
    },
    {
      id: "dilation",
      category: "morphology",
      label: "Dilation",
      description: "Expands bright foreground regions in binary-like images.",
      outputMode: "color",
      parameters: [
        { id: "kernelSize", label: "Kernel size", type: "number", min: 3, max: 21, step: 2, defaultValue: 5, odd: true },
        { id: "iterations", label: "Iterations", type: "number", min: 1, max: 5, step: 1, defaultValue: 1 }
      ]
    },
    {
      id: "erosion",
      category: "morphology",
      label: "Erosion",
      description: "Shrinks bright foreground regions in binary-like images.",
      outputMode: "color",
      parameters: [
        { id: "kernelSize", label: "Kernel size", type: "number", min: 3, max: 21, step: 2, defaultValue: 5, odd: true },
        { id: "iterations", label: "Iterations", type: "number", min: 1, max: 5, step: 1, defaultValue: 1 }
      ]
    },
    {
      id: "opening",
      category: "morphology",
      label: "Opening",
      description: "Erosion followed by dilation, useful for small bright noise.",
      outputMode: "color",
      parameters: [
        { id: "kernelSize", label: "Kernel size", type: "number", min: 3, max: 21, step: 2, defaultValue: 5, odd: true },
        { id: "iterations", label: "Iterations", type: "number", min: 1, max: 5, step: 1, defaultValue: 1 }
      ]
    },
    {
      id: "closing",
      category: "morphology",
      label: "Closing",
      description: "Dilation followed by erosion, useful for small gaps.",
      outputMode: "color",
      parameters: [
        { id: "kernelSize", label: "Kernel size", type: "number", min: 3, max: 21, step: 2, defaultValue: 5, odd: true },
        { id: "iterations", label: "Iterations", type: "number", min: 1, max: 5, step: 1, defaultValue: 1 }
      ]
    }
  ];

  function byId(id) {
    return operations.find((operation) => operation.id === id) || null;
  }

  function goalById(id) {
    return goals.find((goal) => goal.id === id) || null;
  }

  function defaultsFor(operation) {
    return operation.parameters.reduce((acc, parameter) => {
      acc[parameter.id] = parameter.defaultValue;
      return acc;
    }, {});
  }

  function normalizeNumber(value, parameter) {
    const raw = Number(value);
    const fallback = Number(parameter.defaultValue || 0);
    let normalized = Number.isFinite(raw) ? raw : fallback;
    if (typeof parameter.min === "number") normalized = Math.max(parameter.min, normalized);
    if (typeof parameter.max === "number") normalized = Math.min(parameter.max, normalized);
    if (parameter.odd) {
      normalized = Math.round(normalized);
      if (normalized % 2 === 0) normalized += 1;
      if (typeof parameter.max === "number" && normalized > parameter.max) normalized -= 2;
      if (typeof parameter.min === "number" && normalized < parameter.min) normalized = parameter.min;
    }
    return normalized;
  }

  function validateParameters(operation, values) {
    const normalized = {};
    const warnings = [];

    operation.parameters.forEach((parameter) => {
      const incoming = Object.prototype.hasOwnProperty.call(values, parameter.id)
        ? values[parameter.id]
        : parameter.defaultValue;

      if (parameter.type === "number") {
        const value = normalizeNumber(incoming, parameter);
        normalized[parameter.id] = value;
        if (String(incoming) !== String(value)) {
          warnings.push({
            code: "PARAMETER_CLAMPED",
            message: `${parameter.label} disesuaikan ke ${value}.`
          });
        }
      }

      if (parameter.type === "select") {
        const text = String(incoming);
        normalized[parameter.id] = parameter.options.includes(text) ? text : parameter.defaultValue;
      }

      if (parameter.type === "boolean") {
        normalized[parameter.id] = incoming === true || incoming === "true" || incoming === "on";
      }
    });

    return { values: normalized, warnings };
  }

  export const ImgLabOperations = {
    categories,
    goals,
    operations,
    byId,
    goalById,
    defaultsFor,
    validateParameters
  };
