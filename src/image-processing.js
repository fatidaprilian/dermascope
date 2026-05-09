(function attachImageProcessing(root) {
  "use strict";

  function matFromCanvas(cv, canvas) {
    return cv.imread(canvas);
  }

  function makeGray(cv, src) {
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    return gray;
  }

  function showMat(cv, canvas, mat) {
    canvas.width = mat.cols;
    canvas.height = mat.rows;
    cv.imshow(canvas.id, mat);
  }

  function applyOperation(cv, sourceCanvas, outputCanvas, operation, parameters) {
    const start = performance.now();
    const src = matFromCanvas(cv, sourceCanvas);
    const dst = new cv.Mat();
    const warnings = [];

    try {
      switch (operation.id) {
        case "gaussian-blur": {
          const size = new cv.Size(parameters.kernelSize, parameters.kernelSize);
          cv.GaussianBlur(src, dst, size, parameters.sigma, parameters.sigma, cv.BORDER_DEFAULT);
          break;
        }
        case "median-filter":
          cv.medianBlur(src, dst, parameters.kernelSize);
          break;
        case "bilateral-filter":
          {
            const rgb = new cv.Mat();
            const filtered = new cv.Mat();
            cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
            cv.bilateralFilter(rgb, filtered, parameters.diameter, parameters.sigmaColor, parameters.sigmaSpace, cv.BORDER_DEFAULT);
            cv.cvtColor(filtered, dst, cv.COLOR_RGB2RGBA);
            rgb.delete();
            filtered.delete();
          }
          break;
        case "grayscale": {
          const gray = makeGray(cv, src);
          cv.cvtColor(gray, dst, cv.COLOR_GRAY2RGBA);
          gray.delete();
          warnings.push({ code: "OUTPUT_GRAYSCALE", message: "Hasil dibuat grayscale." });
          break;
        }
        case "histogram-equalization": {
          const gray = makeGray(cv, src);
          const equalized = new cv.Mat();
          cv.equalizeHist(gray, equalized);
          cv.cvtColor(equalized, dst, cv.COLOR_GRAY2RGBA);
          gray.delete();
          equalized.delete();
          warnings.push({ code: "OUTPUT_GRAYSCALE", message: "Histogram equalization memakai output grayscale di MVP." });
          break;
        }
        case "brightness-contrast":
          src.convertTo(dst, -1, parameters.contrast, parameters.brightness);
          break;
        case "gamma-correction": {
          const table = new cv.Mat(1, 256, cv.CV_8U);
          const gamma = Math.max(0.01, parameters.gamma);
          for (let i = 0; i < 256; i += 1) {
            table.ucharPtr(0, i)[0] = Math.min(255, Math.round(255 * Math.pow(i / 255, 1 / gamma)));
          }
          cv.LUT(src, table, dst);
          table.delete();
          break;
        }
        case "sharpen": {
          const blur = new cv.Mat();
          const size = new cv.Size(parameters.radius, parameters.radius);
          cv.GaussianBlur(src, blur, size, 0, 0, cv.BORDER_DEFAULT);
          cv.addWeighted(src, 1 + parameters.amount, blur, -parameters.amount, 0, dst);
          blur.delete();
          break;
        }
        case "canny-edge": {
          const gray = makeGray(cv, src);
          const edges = new cv.Mat();
          cv.Canny(gray, edges, parameters.threshold1, parameters.threshold2, Number(parameters.apertureSize), false);
          cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA);
          gray.delete();
          edges.delete();
          warnings.push({ code: "OUTPUT_GRAYSCALE", message: "Canny menghasilkan peta tepi." });
          break;
        }
        case "otsu-threshold": {
          const gray = makeGray(cv, src);
          const binary = new cv.Mat();
          const mode = parameters.invert ? cv.THRESH_BINARY_INV : cv.THRESH_BINARY;
          cv.threshold(gray, binary, 0, 255, mode + cv.THRESH_OTSU);
          cv.cvtColor(binary, dst, cv.COLOR_GRAY2RGBA);
          gray.delete();
          binary.delete();
          warnings.push({ code: "OUTPUT_GRAYSCALE", message: "Otsu menghasilkan output biner." });
          break;
        }
        case "adaptive-threshold": {
          const gray = makeGray(cv, src);
          const binary = new cv.Mat();
          const method = parameters.method === "mean" ? cv.ADAPTIVE_THRESH_MEAN_C : cv.ADAPTIVE_THRESH_GAUSSIAN_C;
          cv.adaptiveThreshold(gray, binary, 255, method, cv.THRESH_BINARY, parameters.blockSize, parameters.constant);
          cv.cvtColor(binary, dst, cv.COLOR_GRAY2RGBA);
          gray.delete();
          binary.delete();
          warnings.push({ code: "OUTPUT_GRAYSCALE", message: "Adaptive threshold menghasilkan output biner." });
          break;
        }
        case "resize-bilinear":
        case "resize-bicubic":
        case "resize-lanczos": {
          const interpolation = {
            "resize-bilinear": cv.INTER_LINEAR,
            "resize-bicubic": cv.INTER_CUBIC,
            "resize-lanczos": cv.INTER_LANCZOS4
          }[operation.id];
          const target = new cv.Size(
            Math.max(1, Math.round(src.cols * parameters.scale)),
            Math.max(1, Math.round(src.rows * parameters.scale))
          );
          cv.resize(src, dst, target, 0, 0, interpolation);
          break;
        }
        case "dilation":
        case "erosion":
        case "opening":
        case "closing": {
          const kernel = cv.Mat.ones(parameters.kernelSize, parameters.kernelSize, cv.CV_8U);
          const anchor = new cv.Point(-1, -1);
          if (operation.id === "dilation") {
            cv.dilate(src, dst, kernel, anchor, parameters.iterations, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
          }
          if (operation.id === "erosion") {
            cv.erode(src, dst, kernel, anchor, parameters.iterations, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
          }
          if (operation.id === "opening") {
            cv.morphologyEx(src, dst, cv.MORPH_OPEN, kernel, anchor, parameters.iterations, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
          }
          if (operation.id === "closing") {
            cv.morphologyEx(src, dst, cv.MORPH_CLOSE, kernel, anchor, parameters.iterations, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
          }
          kernel.delete();
          break;
        }
        default:
          throw new Error("UNKNOWN_OPERATION");
      }

      showMat(cv, outputCanvas, dst);
      return {
        width: dst.cols,
        height: dst.rows,
        outputMode: operation.outputMode,
        processingTimeMs: Math.max(1, Math.round(performance.now() - start)),
        warnings
      };
    } finally {
      src.delete();
      dst.delete();
    }
  }

  root.ImgLabProcessing = {
    applyOperation
  };
})(typeof window !== "undefined" ? window : globalThis);
