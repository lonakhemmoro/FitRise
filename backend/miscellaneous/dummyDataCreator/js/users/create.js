import { createNav } from "../exports/header.js";
import { serverPort } from "../exports/serverport.js";

const nav = document.getElementById("header-space");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const birthdateInput = document.getElementById("birth");
const genderInput = document.getElementById("gender");
const weightInput = document.getElementById("weight");
const heightInput = document.getElementById("height");
const pointsInput = document.getElementById("points");

const button = document.querySelector("button");
const statusSpace = document.getElementById("status-space");

button.onclick = () => createUser();

createNav(nav);

async function createUser() {
  const a = JSON.stringify({
    email: emailInput.value,
    password: passwordInput.value,
    username: usernameInput.value,
    birthdate: birthdateInput.value === "" ? null : birthdateInput.value,
    gender: genderInput.value,
    weight: weightInput.value === "" ? null : weightInput.value,
    height: heightInput.value === "" ? null : heightInput.value,
    points: pointsInput.value,
  });

  await fetch(`http://localhost:${serverPort}/debug/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: a,
  }).then((res) => {
    if (res.status === 500) {
      document.querySelector(
        "#status-space"
      ).innerHTML = `<p>Internal Server Error</p>`;
    }

    if (res.status === 201) {
      document.querySelector(
        "#status-space"
      ).innerHTML = `<p>Successfully updated</p>`;
    }
  });
}
