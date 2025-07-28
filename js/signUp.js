import { ftToCm, lbsToKg } from "./modules/unitConversions.js";
import displayErrTag from "./modules/feedback/displayErrTag.js";
import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import removeAllErrDisplays from "./modules/feedback/removeAllErrDisplays.js";
import createModal from "./modules/feedback/createModal.js";

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
const kgBtn = document.getElementById("weight-kg-btn");

poundBtn.onclick = () => weightAlter(true);
kgBtn.onclick = () => weightAlter(false);

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
  kgBtn.disabled = !isPoundEnabled;
}

//#endregion

createButton.onclick = (evnt) => createAccount(evnt);
async function createAccount(evnt) {
  evnt.preventDefault();
  document.querySelector("#password + p").classList.remove("err");
  removeAllErrDisplays();

  let email = emailInput.value.trim();
  let password = passwordInput.value.trim();
  let username = usernameInput.value.trim();
  let firstName = firstNameInput.value.trim();
  let lastName = lastNameInput.value.trim();

  let bdString = `${document.getElementById("bd-months").value} ${
    document.getElementById("bd-days").value
  } ${document.getElementById("bd-years").value} 00:00:00`;
  let bdDate = new Date(bdString);
  console.log(bdDate);

  //Convert height to cm
  let height = 0;
  if (isFeetEnabled) {
    let feet = parseInt(document.getElementById("height-feet").value);
    let inches = parseFloat(document.getElementById("height-inch").value);
    height = ftToCm(feet, inches);
  } else {
    height = parseFloat(document.getElementById("height-cm").value);
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
    bdDate
  );
  if (!isValid) return;

  //Send Request
  createButton.disabled = true;

  /*TODO: Turn back on
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
  const request = await fetch(req).catch((err) => {
    displayErrModal("Server could not be reached. Please try again later.");
    return { status: undefined };
  });

  if (!request.status) {
    createButton.disabled = false;
    return;
  }

  if (request.status === 400) {
    const response = await request.json();
    if (response.title.toLowerCase() === "field errors")
      serverFeedbackDisplay(response.errorFields);
    else {
      displayErrModal("Request body error");
    }
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
    */

  //TODO: Remove after turning backend back on
  localStorage.setItem("loggedIn", "true");
  window.location.href = "index.html";

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
  bdDate
) {
  let isValid = true;
  //Email
  const regexp = /\w*@\w*\.\w+/;
  if (email.indexOf(" ") != -1 || !regexp.test(email)) {
    isValid = false;
    displayErrBorder(emailInput);
    displayErrTag(emailInput, "Please provide a valid email");
  }

  //Password
  if (password.length < 8) {
    isValid = false;
    displayErrBorder(passwordInput);
    displayErrBorder(passwordInput.nextElementSibling);
  }

  //Username
  if (username.indexOf(" ") != -1 || username.length === 0) {
    isValid = false;
    displayErrBorder(usernameInput);
    displayErrTag(usernameInput, "Please provide a valid username");
  }

  /*FIXME: Potential Fixme
    Right now in the db the first and last name fields are Nullable,
    so validation isn't required unless we want it to be */

  //Height
  if (height <= 0 || Number.isNaN(height)) {
    isValid = false;
    const heightDiv = document.getElementById("height-section");
    try {
      displayErrBorder(document.getElementById("height-cm"));
    } catch (err) {}
    try {
      displayErrBorder(document.getElementById("height-feet"));
      displayErrBorder(document.getElementById("height-inch"));
    } catch (err) {}
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
  //https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
  if (!(bdDate instanceof Date && !isNaN(bdDate))) {
    isValid = false;
    displayErrBorder(document.getElementById("bd-months"));
    displayErrBorder(document.getElementById("bd-days"));
    displayErrBorder(document.getElementById("bd-years"));
    displayErrTag(birthdateDiv, "Please provide a valid date");
  }

  return isValid;
}

/**
 * Display errors
 * @param {Array} serverResponseArray
 */
function serverFeedbackDisplay(serverResponseArray) {
  serverResponseArray.forEach((element) => {
    const field = element.field.toLowerCase();
    if (field === "email") {
      if (element.details.toLowerCase() === "email_invalid") {
        displayErrBorder(emailInput);
        displayErrTag(emailInput, "Please provide a valid email");
      } else if (element.details.toLowerCase() === "email_conflict") {
        displayErrBorder(emailInput);
        displayErrTag(emailInput, "An account with this email already exists");
      }
    }

    if (field === "password") {
      displayErrBorder(passwordInput);
      displayErrBorder(passwordInput.nextElementSibling);
    }

    if (field === "birthdate") {
      displayErrBorder(monthSelect);
      displayErrBorder(daySelect);
      displayErrBorder(yearSelect);
      displayErrTag(birthdateDiv, "Please provide a valid date");
    }

    if (field === "weight") {
      displayErrBorder(weightInput);
      displayErrTag(
        document.getElementById("weight"),
        "Please provide a valid weight"
      );
    }

    if (field === "height") {
      displayErrBorder(document.getElementById("height-cm"));
      displayErrBorder(document.getElementById("height-feet"));
      displayErrBorder(document.getElementById("height-inch"));
      const heightDiv = document.getElementById("height-section");
      displayErrTag(heightDiv.parentElement, "Please provide a valid height");
    }

    if (field === "username") {
      if (element.details.toLowerCase() === "username_invalid") {
        displayErrBorder(usernameInput);
        displayErrTag(usernameInput, "Please provide a valid username");
      } else if (element.details.toLowerCase() === "username_conflict") {
        displayErrBorder(usernameInput);
        displayErrTag(
          usernameInput,
          "Account with this username already exists"
        );
      }
    }
  });
}
