import { BASE_URL } from "./modules/baseUrl.js";
import { ftToCm, lbsToKg } from "./modules/unitConversions.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const weightInput = document.getElementById("weight-num");

const birthdateDiv = document.getElementById("birthdate");

const createButton = document.getElementById("cta");

function init() {
  //Populate birthdate days and years select elements
  const selectDay = document.getElementById("bd-days");
  for (let i = 1; i <= 31; i++) {
    selectDay.innerHTML += `<option value="${i}">${i}</option>`;
  }

  const selectYear = document.getElementById("bd-years");
  for (let i = 2025; i >= 1906; i--) {
    selectYear.innerHTML += `<option value="${i}">${i}</option>`;
  }
}
init();

//#region Height buttons
const feetBtn = document.getElementById("height-feet-btn");
const cmBtn = document.getElementById("height-cm-btn");
let isFeetEnabled = true;

feetBtn.onclick = () => {
  isFeetEnabled = true;
  heightAlter();
};
cmBtn.onclick = () => {
  isFeetEnabled = false;
  heightAlter();
};

function heightAlter() {
  const heightDiv = document.getElementById("height-section");
  let string = "";
  if (isFeetEnabled) {
    string = `
    <input
          type="number"
          id="height-feet"
          name="height-feet"
          placeholder="Feet"
          min="1"
        />
        <input
          type="number"
          id="height-inch"
          name="height-inch"
          placeholder="Inches"
          min="1"
        />
    `;
  } else {
    string = `
    <input type="number" id="height-cm" placeholder="Centimeters" min="1"/>
    `;
  }

  heightDiv.innerHTML = string;

  cmBtn.disabled = !isFeetEnabled;
  feetBtn.disabled = isFeetEnabled;
}
//#endregion

//#region Weight buttons
const poundBtn = document.getElementById("weight-lb-btn");
const kmBtn = document.getElementById("weight-km-btn");

poundBtn.onclick = () => weightAlter(true);
kmBtn.onclick = () => weightAlter(false);

let isLbsEnabled = true;

function weightAlter(isPoundEnabled) {
  isLbsEnabled = isPoundEnabled;
  const weightInputElem = document.getElementById("weight-num");

  if (isPoundEnabled) {
    weightInputElem.placeholder = "Pounds(lbs)";
  } else {
    weightInputElem.placeholder = "Kilograms(kg)";
  }
  poundBtn.disabled = isPoundEnabled;
  kmBtn.disabled = !isPoundEnabled;
}

//#endregion

createButton.onclick = () => createAccount();
async function createAccount() {
  removeAllErrDisplays();

  let email = emailInput.value.trim();
  let password = passwordInput.value.trim();
  let username = usernameInput.value.trim();
  let firstName = firstNameInput.value.trim();
  let lastName = lastNameInput.value.trim();

  let bdMonth = parseInt(document.getElementById("bd-months").value);
  let bdDays = parseInt(document.getElementById("bd-days").value);
  let bdYears = parseInt(document.getElementById("bd-years").value);

  //Convert height to cm
  let height = 0;
  if (isFeetEnabled) {
    let feet = parseInt(document.getElementById("height-feet").value);
    let inches = parseFloat(document.getElementById("height-inch").value);
    height = ftToCm(feet, inches);
  } else {
    height = parseFloat(document.getElementById("height-cm"));
  }

  //Convert weight to kg
  let weight = isLbsEnabled
    ? lbsToKg(parseFloat(weightInput.value))
    : parseFloat(weightInput.value);

  //Validate
  let isValid = clientValidate(
    email,
    password,
    username,
    firstName,
    lastName,
    height,
    weight,
    bdMonth,
    bdDays,
    bdYears
  );
  if (!isValid) return;

  //Send Request
  let bdString =
    document.getElementById("bd-years").value +
    "-" +
    document.getElementById("bd-months").value +
    "-" +
    document.getElementById("bd-days").value;

  createButton.disabled = true;

  const req = new Request(BASE_URL + "/users", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
      username,
      firstName,
      lastName,
      birthdate: bdString,
      height,
      weight,
    }),
  });
  const request = await fetch(req).catch((err) =>
    displayErrModal("Server could not be reached. Please try again later.")
  );
  if (request.status === 409) {
    const responseBody = await request.json();
    if (responseBody.err.code === "EMAIL_CONFLICT") {
      displayErrBorder(emailInput);
      displayErrTag(emailInput, "Given email already has an account");
    } else if (responseBody.err.code === "USERNAME_CONFLICT") {
      displayErrBorder(usernameInput);
      displayErrTag(usernameInput, "Account with username already exists");
    }
  } else if (request.status === 400) {
    displayErrModal("TODO: 400 Error");
  } else if (request.status === 500) {
    displayErrModal("Internal server error. Please try again later.");
  }

  if (request.status === 201) {
    //Auto login the user, and redirect to dashboard page
    await fetch(BASE_URL + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then((res) => res.json())
      .then((res) => {
        localStorage.setItem("accessToken", res.accessToken);
      })
      .catch((err) => {});

    window.location.href = "index.html";
  }

  createButton.disabled = false;
}

/**
 * Validates user fields
 * @returns (bool) false if any field isn't valid
 */
function clientValidate(
  email,
  password,
  username,
  firstName,
  lastName,
  height,
  weight,
  bdMonth,
  bdDays,
  bdYears
) {
  let isValid = true;
  //Email
  const regexp = /\w*@\w*\.\w+/;
  if (email.indexOf(" ") != -1 || !regexp.test(email)) {
    isValid = false;
    //console.log("email fail");
    displayErrBorder(emailInput);
    displayErrTag(emailInput, "Please provide a valid email");
  }

  //Password
  if (password.length < 8) {
    isValid = false;
    //console.log("password fail");
    displayErrBorder(passwordInput);
    displayErrBorder(passwordInput.nextElementSibling);
  }

  //Username
  if (username.indexOf(" ") != -1 || username.length === 0) {
    isValid = false;
    //console.log("username fail");
    displayErrBorder(usernameInput);
    displayErrTag(usernameInput, "Please provide a valid username");
  }

  //TODO: Firstname
  //TODO: Lastname

  //Height
  if (height <= 0 || Number.isNaN(height)) {
    isValid = false;
    const heightDiv = document.getElementById("height-section");
    let metricEnabled = heightDiv.children.lenght === 1;
    if (metricEnabled) {
      displayErrBorder(document.getElementById("height-cm"));
    } else {
      displayErrBorder(document.getElementById("height-feet"));
      displayErrBorder(document.getElementById("height-inch"));
    }
    displayErrTag(heightDiv.parentElement, "Please provide a valid height");
  }

  //Weight
  if (weight <= 0 || Number.isNaN(weight)) {
    isValid = false;

    displayErrBorder(weightInput);
    displayErrTag(
      document.getElementById("weight"),
      "Please provide a valid weight"
    );
  }

  //Birthday
  let bdErr = false;
  if (Number.isNaN(bdMonth)) {
    bdErr = true;
    let monthSelect = document.getElementById("bd-months");
    displayErrBorder(monthSelect);
  }
  if (Number.isNaN(bdDays)) {
    bdErr = true;
    let daySelect = document.getElementById("bd-days");
    displayErrBorder(daySelect);
  }
  if (Number.isNaN(bdYears)) {
    bdErr = true;
    let yearSelect = document.getElementById("bd-years");
    displayErrBorder(yearSelect);
  }
  if (bdErr) {
    isValid = false;

    displayErrTag(birthdateDiv, "Please provide a valid date");
  }

  return isValid;
}

//#region Error Visuals

/**
 * Only to be used with children of 'sign-up-field' divs.
 * Displays an error tag underneath a 'sign-up-field' class element
 * @param {*} tag Child tag of the 'sign-up-field' to make an error for
 * @param {*} str What you want the error to display
 */
function displayErrTag(tag, str) {
  const parent = tag.parentNode;
  const errTag = document.createElement("p");
  errTag.classList.add("err");
  errTag.innerText = str;
  parent.appendChild(errTag);
}

/**
 * Displays the error red border around the given element
 * @param {*} tag
 * @param {*} enabled (bool) enable or disable the border
 */
function displayErrBorder(tag, enabled = true) {
  if (enabled) {
    tag.classList.add("err");
  } else {
    tag.classList.remove("err");
  }
}

/**
 * Only to be used with children of 'sign-up-field' divs.
 * Remove an error tag on a 'sign-up-field' class element
 * @param {*} tag Child tag of the 'sign-up-field' to remove the error for
 */
function removeErrTag(tag) {
  const parent = tag.parentNode;
  const errTag = parent.lastElementChild;
  if (errTag.classList.contains("err")) {
    parent.removeChild(errTag);
  }
}

function removeAllErrDisplays() {
  document.querySelector("#password + p").classList.remove("err");
  document.querySelectorAll("p.err").forEach((element) => element.remove());

  const errTags = document.getElementsByClassName("err");
  Array.from(errTags).forEach((element) => {
    displayErrBorder(element, false);
  });
}

/**
 * Displays the bottom viewport error modal
 * @param {string} str The string the modal should display
 */
function displayErrModal(str) {
  const errContainer = document.querySelector(".err-container");
  const pTag = errContainer.querySelector(".err-modal p");
  pTag.innerText = str;

  errContainer.classList.remove("closed");
}

function closeErrModal() {
  const errContainer = document.querySelector(".err-container");
  //console.log(errContainer);
  errContainer.classList.add("closed");
}
const errModalBtn = document.querySelector(".err-modal button");
errModalBtn.onclick = () => closeErrModal();

//#endregion
