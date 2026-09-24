export const APP_LEVELS = ["none", "dropping", "stable", "active"]; // ordered by engagement

/** The signals the model may use. `num` = integer value, `bool` = 0/1, `ord` = ordered levels. */
export const FEATURES = [
  { key: "assets", label: "Assets change (12 m)", type: "num", unit: "%" },
  { key: "contact", label: "Months since last advisor contact", short: "Last contact", type: "num", unit: " months" },
  { key: "advisor", label: "Advisor changed this year", short: "Advisor changed", type: "bool" },
  { key: "complaint", label: "Complaint (last 3 m)", short: "Complaint", type: "bool" },
  { key: "app", label: "App usage", type: "ord", levels: APP_LEVELS },
  { key: "products", label: "Products held", short: "Products", type: "num", unit: "" },
  { key: "tenure", label: "Client since (years)", short: "Tenure", type: "num", unit: " yrs" },
  { key: "age", label: "Age", type: "num", unit: "" },
];

/** The signal with this key. */
export const featureByKey = (key) => FEATURES.find((f) => f.key === key);

/** Numeric value of a signal for the tree (ordered levels become their rank). */
export const valueOf = (row, feature) =>
  feature.type === "ord" ? feature.levels.indexOf(row[feature.key]) : row[feature.key];
