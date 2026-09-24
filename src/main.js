// Entry point: binds every step's controls, then draws the page once. See ARCHITECTURE.md for the module map.
import { COHORTS } from "./engine/index.js";
import { linkStaticTerms } from "./ui/glossary/links.js";
import { setUpTooltip } from "./ui/glossary/tooltip.js";
import { bindNavigation, openFromHash } from "./ui/navigation.js";
import { regenerate } from "./ui/render.js";
import { bindClientsStep } from "./ui/steps/clients/bind.js";
import { bindDataStep } from "./ui/steps/data/bind.js";
import { bindMonitorStep } from "./ui/steps/monitor/bind.js";
import { bindResultsStep } from "./ui/steps/results/bind.js";
import { bindRoomStep } from "./ui/steps/room/bind.js";
import { bindTrainStep } from "./ui/steps/train/bind.js";

document.getElementById("dev-hint")?.remove(); // shown only when src/index.html is opened without a server
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = COHORTS[el.dataset.year]));
linkStaticTerms();
setUpTooltip();
bindNavigation();

bindDataStep();
bindRoomStep();
bindTrainStep();
bindResultsStep();
bindClientsStep();
bindMonitorStep();

regenerate(); // data → tree → every drawing
openFromHash();
