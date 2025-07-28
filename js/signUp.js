import { ftToCm, lbsToKg } from "./modules/unitConversions.js";
import displayErrTag from "./modules/feedback/displayErrTag.js";
import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import removeAllErrDisplays from "./modules/feedback/removeAllErrDisplays.js";
import createModal from "./modules/feedback/createModal.js";
import supabase from "./modules/supabase.js";

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

  let bdMonth = document.getElementById("bd-months").value;
  let bdDay = document.getElementById("bd-days").value;
  let bdYear = document.getElementById("bd-years").value;
  let bdDate = new Date(
    parseInt(bdYear),
    parseInt(bdMonth) - 1,
    parseInt(bdDay),
    0,
    0,
    0,
    0
  );

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

  let bdString = bdYear + "-" + bdMonth + "-" + bdDay;

  //Send Request
  createButton.disabled = true;
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        username: username,
        birthdate: bdString,
        weight: weight,
        height: height,
      },
    },
  });

  if (error) {
    await backendErrorHandler(error);
    createButton.disabled = false;
    return;
  }

  //successful login
  if (data.session && data.user) {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
    console.log("SUCCSS");
  } else {
    //unknown error that didn't appear in the error variable
    createModal("Unexpected Error!! Please Contact Support", true);
    console.log("Failed");
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
  bdDate
) {
  let isValid = true;
  //Email
  const regexp = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
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
 *
 * @param {*} usernameString
 * @returns {boolean}
 */
async function isUsernameConflict(usernameString) {
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("username", usernameString.trim());

  if (error) throw error;

  return data.length > 0;
}

async function backendErrorHandler(error) {
  const err = error.code;

  if (err === "user_already_exists") {
    displayErrBorder(emailInput);
    displayErrTag(emailInput, "An account with this email already exists");
  } else if (err === "unexpected_failure") {
    //May be a username conflict due to the username field being UNIQUE in the db
    let usernameConflict = false;
    try {
      usernameConflict = await isUsernameConflict(usernameInput.value.trim());
      if (usernameConflict) {
        displayErrBorder(usernameInput);
        displayErrTag(
          usernameInput,
          "Account with this username already exists"
        );
      }
    } catch (err) {
      console.log(err);
      createModal("Unexpected Error!! Please Try Again Later!", true);
      return;
    }

    if (!usernameConflict) {
      console.log(error);
      console.log(err.code);
      createModal("Unexpected Error!! Please Try Again Later!", true);
    }
  } else {
    console.log(error);
    console.log(error.code);
    createModal("Unexpected Error!! Please Try Again Later!", true);
  }
}
