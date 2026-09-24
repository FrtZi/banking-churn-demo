/** The 8 clients of the in-room paper game (same signals as the slides). */
// prettier-ignore
export const GAME = [
  { id: "A", name: "Marc, 58",   age: 58, tenure: 22, products: 3, assets: -35, contact: 9,  advisor: 1, complaint: 0, app: "none",     churn: 1 },
  { id: "B", name: "Sophie, 41", age: 41, tenure: 6,  products: 4, assets: 8,   contact: 1,  advisor: 0, complaint: 0, app: "active",   churn: 0 },
  { id: "C", name: "Jean, 67",   age: 67, tenure: 30, products: 3, assets: -40, contact: 0,  advisor: 0, complaint: 0, app: "none",     churn: 0 },
  { id: "D", name: "Laura, 35",  age: 35, tenure: 2,  products: 1, assets: 0,   contact: 11, advisor: 0, complaint: 0, app: "dropping", churn: 1 },
  { id: "E", name: "Paul, 52",   age: 52, tenure: 15, products: 3, assets: 2,   contact: 3,  advisor: 0, complaint: 0, app: "stable",   churn: 1 },
  { id: "F", name: "Nadia, 46",  age: 46, tenure: 9,  products: 2, assets: -15, contact: 6,  advisor: 0, complaint: 1, app: "stable",   churn: 1 },
  { id: "G", name: "Thomas, 29", age: 29, tenure: 1,  products: 1, assets: 20,  contact: 4,  advisor: 0, complaint: 0, app: "active",   churn: 0 },
  { id: "H", name: "Elena, 73",  age: 73, tenure: 25, products: 2, assets: -10, contact: 5,  advisor: 0, complaint: 0, app: "none",     churn: 0 },
];

/** Typical rules proposed by a room after the game ("Load an example"), in the format of rules.js. */
export const ROOM_EXAMPLE = [
  [
    { key: "assets", op: "le", value: -20 },
    { key: "contact", op: "ge", value: 6 },
  ],
  [{ key: "complaint", op: "is", value: 1 }],
  [
    { key: "advisor", op: "is", value: 1 },
    { key: "contact", op: "ge", value: 6 },
  ],
];
