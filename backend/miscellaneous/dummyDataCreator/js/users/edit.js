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

button.onclick = () => editUser();

createNav(nav);

async function editUser() {
  const value = document.getElementById("user-id").value;
  const a = JSON.stringify({
    email: emailInput.value,
    password: passwordInput.value,
    username: usernameInput.value,
    birthdate: birthdateInput.value,
    gender: genderInput.value,
    weight: weightInput.value,
    height: heightInput.value,
    points: pointsInput.value,
  });

  await fetch(`http://localhost:${serverPort}/debug/users/${value}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: a,
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

const userIDField = document.getElementById("user-id");
userIDField.onchange = (evnt) => onChange(evnt);

async function onChange(evnt) {
  const value = evnt.target.value;

  let result;
  //GET information
  await fetch(`http://localhost:${serverPort}/debug/users/${value}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (res.status === 500) {
        document.querySelector(
          "#status-space"
        ).innerHTML = `<p>Internal Server Error</p>`;
      }
      return res.json();
    })
    .then((res) => {
      result = res.user;
    });

  emailInput.value = result.email;
  passwordInput.value = result.password;
  usernameInput.value = result.username;
  birthdateInput.value = result.birthdate.substring(0, 10);
  genderInput.value = result.gender;
  weightInput.value = result.weight;
  heightInput.value = result.height;
  pointsInput.value = result.points;
}
