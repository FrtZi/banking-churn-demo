import { CONFIG } from "../../config.js";
import { state } from "../../state.js";

/** Downloads the clients of step 1 (learning history as degraded, test clients as they are). */
export function downloadCsv() {
  const columns = Object.keys(state.data[0]); // every field of a client, in the generator's order
  const csv = [columns, ...state.data.map((r) => columns.map((k) => r[k]))].map((row) => row.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = CONFIG.data.csvFile;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
}
