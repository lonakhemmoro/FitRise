import { createNav } from "../exports/header.js";
import { serverPort } from "../exports/serverport.js";

const nav = document.getElementById("header-space");

//const goalTypeInput = document.getElementById("goal-id");
const userIDInput = document.getElementById("user-id");
const streakValueInput = document.getElementById("streak");

const button = document.querySelector("button");

button.onclick = () => createStreak();

createNav(nav);

async function createStreak() {
  await fetch(`http://localhost:${serverPort}/debug/streaks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userID: userIDInput.value,
      //goalTypeID: goalTypeInput.value,
      value: streakValueInput.value,
    }),
  }).then((res) => {
    if (res.status === 500) {
      document.querySelector(
        "#status-space"
      ).innerHTML = `<p>Internal Server Error</p>`;
    }

    if (res.status === 201) {
      document.querySelector(
        "#status-space"
      ).innerHTML = `<p>Successfully created</p>`;
    }
  });
}
