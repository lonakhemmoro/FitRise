import { cmToFt, ftToCm, kgToLbs, lbsToKg } from "./modules/unitConversions.js";
import displayErrTag from "./modules/feedback/displayErrTag.js";
import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import removeAllErrDisplays from "./modules/feedback/removeAllErrDisplays.js";
import createModal from "./modules/feedback/createModal.js";
import supabase from "./modules/supabase.js";

const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const weightInput = document.getElementById("weight-num");

const cancelBtn = document.getElementById("cancel-btn");
const submitBtn = document.getElementById("submit-btn");

let firstNameOriginal,
  lastNameOriginal,
  weightKGOriginal,
  weightLBsOriginal,
  heightFtOriginal,
  heightInOriginal,
  heightCmOriginal;

let userID;

init();
async function init() {
  //Check if logged in and get userID
  const { data, error } = await supabase.auth.getUser();
  if (!data.user) {
    window.location.href = "login.html";
    return;
  }
  if (error) {
    document.querySelector("main").innerHTML =
      "Error preparing for profile updating. Please try again later.";
    createModal(
      "Error preparing for profile updating. Please try again later.",
      true
    );
    return;
  }

  userID = data.user.id;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("first_name, last_name, height, weight")
    .eq("id", userID)
    .single();
  if (userError) {
    document.querySelector("main").innerHTML =
      "Error preparing for profile updating. Please try again later.";
    createModal(
      "Error preparing for profile updating. Please try again later.",
      true
    );
    return;
  }

  //Record what the original values were
  firstNameOriginal = userData.first_name;
  lastNameOriginal = userData.last_name;
  heightCmOriginal = userData.height;
  const convertedHeight = cmToFt(heightCmOriginal);
  heightFtOriginal = convertedHeight.feet;
  heightInOriginal = convertedHeight.inches;
  weightKGOriginal = userData.weight;
  weightLBsOriginal = kgToLbs(weightKGOriginal);

  //Give inputs a place holder
  firstNameInput.placeholder = firstNameOriginal;
  lastNameInput.placeholder = lastNameOriginal;
  document.getElementById("height-feet").placeholder =
    heightFtOriginal + "(ft)";
  document.getElementById("height-inch").placeholder =
    heightInOriginal + "(in)";
  document.getElementById("weight-num").placeholder =
    weightLBsOriginal + "(lbs)";

  //Give buttons functionality
  cancelBtn.onclick = () => {
    window.location.href = "profile.html";
  };
  submitBtn.onclick = async (evnt) => updateProfile(evnt);
}

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
          placeholder="${heightFtOriginal}(ft)"
          min="1"
        />
        <input
          type="number"
          id="height-inch"
          name="height-inch"
          placeholder="${heightInOriginal}(in)"
          min="1"
        />
    `;
  } else {
    string = `
    <input type="number" id="height-cm" placeholder="${heightCmOriginal}(cm)" min="1"/>
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
    weightInputElem.placeholder = `${weightLBsOriginal}(lbs)`;
  } else {
    weightInputElem.placeholder = `${weightKGOriginal}(kg)`;
  }
  poundBtn.disabled = isPoundEnabled;
  kgBtn.disabled = !isPoundEnabled;
}

//#endregion

async function updateProfile(evnt) {
  evnt.preventDefault();

  removeAllErrDisplays();

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

  const updateObj = createQuery(height, weight);

  //Send Request
  cancelBtn.disabled = true;
  submitBtn.disabled = true;

  const { error } = await supabase
    .from("users")
    .update(updateObj)
    .eq("id", userID);

  if (error) {
    createModal("Could not update profile. Try again later", true);
    cancelBtn.disabled = false;
    submitBtn.disabled = false;
    return;
  }

  //successful update
  window.location.href = "profile.html";
}

//Creates the obj used in the update query
function createQuery(height, weight) {
  let updateObj = {};

  const firstName = firstNameInput.value.trim();
  if (firstName !== "" && firstNameOriginal !== firstName) {
    updateObj.first_name = firstName;
  }

  const lastName = lastNameInput.value.trim();
  if (lastName !== "" && lastNameOriginal !== lastName) {
    updateObj.last_name = lastName;
  }

  //Check Height
  if (height <= 0 || Number.isNaN(height)) {
    /*treat as if the input were empty*/
  } else if (heightCmOriginal !== height) {
    updateObj.height = height;
  }

  //Check Weight
  if (weight <= 0 || Number.isNaN(weight)) {
    /*treat as if the input were empty*/
  } else if (weightKGOriginal !== weight) {
    updateObj.weight = weight;
  }

  return updateObj;
}
