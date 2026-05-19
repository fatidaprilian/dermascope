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
  if (!operation) return {};
  return operation.parameters.reduce((acc, parameter) => {
    acc[parameter.id] = parameter.defaultValue;
    return acc;
  }, {});
}

export const DermaScopeOperations = {
  categories: activeCategories,
  goals: activeGoals,
  operations: activeOperations,
  byId,
  goalById,
  defaultsFor
};
