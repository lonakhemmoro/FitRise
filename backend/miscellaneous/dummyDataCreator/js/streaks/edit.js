import { createNav } from "../exports/header.js";
import { serverPort } from "../exports/serverport.js";

const nav = document.getElementById("header-space");

const goalTypeInput = document.getElementById("goal-id");
const userIDInput = document.getElementById("user-id");
const streakValueInput = document.getElementById("streak");

const button = document.querySelector("button");
const statusSpace = document.getElementById("status-space");

button.onclick = () => editStreak();

createNav(nav);

async function editStreak() {
  await fetch(`http://localhost:${serverPort}/debug/streaks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userID: userIDInput.value,
      goalTypeID: goalTypeInput.value,
      value: streakValueInput.value,
    }),
  }).then((res) => {
    if (res.status === 500) {
      document.querySelector(
        "#status-space"
      ).innerHTML = `<p>Internal Server Error</p>`;
    }

    if (res.status === 200) {
      document.querySelector(
        "#status-space"
      ).innerHTML = `<p>Successfully updated</p>`;
    }
  });
}

userIDInput.onchange = () => onChange();
goalTypeInput.onchange = () => onChange();

async function onChange() {
  let result;
  //GET information
  await fetch(
    `http://localhost:${serverPort}/users/${userIDInput.value}/streaks/${goalTypeInput.value}}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  )
    .then((res) => {
      if (res.status === 500) {
        document.querySelector(
          "#status-space"
        ).innerHTML = `<p>Internal Server Error</p>`;
      }
      return res.json();
    })
    .then((res) => {
      result = res;
    });

  if (result.length === 0) {
    streakValueInput.value = "";
    return;
  }

  streakValueInput.value = result[0].value;
}
