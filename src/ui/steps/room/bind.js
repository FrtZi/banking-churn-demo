import { ROOM_EXAMPLE } from "../../../engine/index.js";
import { CONFIG } from "../../config.js";
import { $ } from "../../dom.js";
import { goTo } from "../../navigation.js";
import { refreshRoom } from "../../render.js";
import { emptyRoom, roomFromEngine } from "../../room-model.js";
import { state } from "../../state.js";
import { drawRoomBuilder } from "./builder.js";

const setRoom = (room) => {
  state.room = room;
  drawRoomBuilder();
  refreshRoom();
};

/** Step 2 controls (and the "edit" link of step 4). */
export function bindRoomStep() {
  const { rules, conditionsPerRule } = CONFIG.room;
  $("room-help").innerHTML =
    `A client is called if <b>any</b> rule matches. Up to ${rules} rules of 1–${conditionsPerRule} conditions.`;
  $("room-example").onclick = () => setRoom(roomFromEngine(ROOM_EXAMPLE));
  $("room-clear").onclick = () => setRoom(emptyRoom());
  $("room-missing").oninput = () => {
    state.roomMissing = $("room-missing").value.trim();
    refreshRoom();
  };
  $("room-edit").onclick = (e) => {
    e.preventDefault();
    goTo("Your rules");
  };
  drawRoomBuilder();
}
