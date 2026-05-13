
  const activeCategories = [
    { id: "skin-analysis", label: "Skin analysis" }
  ];

  const activeGoals = [
    {
      id: "skin-health-analysis",
      label: "Analisis kondisi kulit",
      summary: "Deteksi jerawat, noda gelap, kerutan, kemerahan, dan pori dari satu foto wajah.",
      operationId: "facial-skin-analysis",
      intent: "Analisis Kulit"
    }
  ];

  const activeOperations = [
    {
      id: "facial-skin-analysis",
      category: "skin-analysis",
      label: "Facial skin analysis",
      description: "Detects visible facial skin-condition signals and returns an overlay plus structured scores.",
      outputMode: "overlay",
      parameters: []
    }
  ];

  function byId(id) {
    return activeOperations.find((operation) => operation.id === id) || null;
  }

  function goalById(id) {
    return activeGoals.find((goal) => goal.id === id) || null;
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
    categories: activeCategories,
    goals: activeGoals,
    operations: activeOperations,
    byId,
    goalById,
    defaultsFor,
    validateParameters
  };
