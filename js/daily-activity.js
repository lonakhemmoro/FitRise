//TODO: Remove main.js and goals.js from the html

import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import createModal from "./modules/feedback/createModal.js";
import stringToDate from "./modules/stringToDate.js";

const dailyInput = document.getElementById("value-input");
const addValueBtn = document.getElementById("add-value");
const goalStartManualBtn = document.getElementById("goal-start-manual");
const goalStartRecommendedBtn = document.getElementById(
  "goal-start-recommended"
);
const exitGoalBtn = document.getElementById("goal-exit");

let valueUnit = "";
let goalTypeID = -1;

let dailyIndex = -1;

const dummyData = {
  goal: {
    value: 19,
    date: "2025-07-26",
  },
  daily: [
    {
      date: "2025-07-26",
      value: 10,
    },
    {
      date: "2025-07-27",
      value: 12,
    },
    {
      date: "2025-07-28",
      value: 2,
    },
    {
      date: "2025-07-29",
      value: 0,
    },
  ],
};

init();
async function init() {
  addValueBtn.disabled = true;

  //TODO: Check if logged in

  getUnit();

  //TODO: backend call
  //If you want to look at the different screens/states change status
  const response = { status: 200 }; //fake backend call

  //Change page state based on backend response
  const { status: responseStatus } = response;

  if (responseStatus === 200) {
    STATE_DAILY_ACTIVITY_init(dummyData);
  } else if (responseStatus === 404) {
    STATE_GOAL_START();
  } else if (responseStatus === 500 || responseStatus === 0) {
    STATE_BACKEND_ERROR();
  }
}

//#region STATE DAILY ACTIVITIY
function STATE_DAILY_ACTIVITY_init(responseBody) {
  addValueBtn.onclick = (evnt) => addValue(evnt);
  addValueBtn.disabled = false;

  const { goal, daily } = responseBody;

  const aside = document.querySelector("aside");
  createGoalPeriod(aside, goal);
  createCards(aside, goal.value, daily);
  getTodaysDaily(goal.value, daily);
}

function createGoalPeriod(aside, goalData) {
  const startDate = stringToDate(goalData.date);
  const endDate = stringToDate(goalData.date);
  endDate.setDate(endDate.getDate() + 3);
  const goalPeriod = `Goal: ${monthName(
    startDate.getMonth()
  )} ${startDate.getDate()} - ${monthName(
    endDate.getMonth()
  )} ${endDate.getDate()}`;

  aside.innerHTML = `<h2 id="goal-period">${goalPeriod}</h2>`;
}

function createCards(aside, goalValue, dailyActsArr) {
  const goalValueStr = numberWithCommas(goalValue);
  dailyActsArr.forEach((element) => {
    const date = stringToDate(element.date);
    const month = monthName(date.getMonth());
    const day = date.getDate();
    const value = numberWithCommas(element.value);

    aside.innerHTML += `
    <div class="daily-card">
      <p>${month} ${day}</p>
      <p>${value} / ${goalValueStr} ${valueUnit}</p>
    </div>
    `;
  });
}

function getTodaysDaily(goalValue, dailyActsArr) {
  const currDate = new Date().getDate();
  for (let i = 0; i < dailyActsArr.length; i++) {
    const dailyDate = stringToDate(dailyActsArr[i].date).getDate();
    if (currDate === dailyDate) {
      dailyIndex = i;
      break;
    }
  }

  const todaysValue = dailyIndex > -1 ? dailyActsArr[dailyIndex].value : 0;

  const todaysValueTextArea = document.getElementById("todays-value");
  todaysValueTextArea.innerText = `${todaysValue} / ${numberWithCommas(
    goalValue
  )} ${valueUnit}`;
  todaysValueTextArea.classList.remove("skeleton-text");
}

async function addValue(evnt) {
  evnt.preventDefault();
  displayErrBorder(dailyInput, false);

  const value = parseInt(dailyInput.value);
  if (Number.isNaN(value) || value < 0) {
    displayErrBorder(dailyInput, true);
    return;
  } else if (value === 0) {
    return;
  }

  addValueBtn.disabled = true;

  //TODO: Call backend

  //Error handle
  /*
  If backend can't be reached
      createModal("Can't connect to server. Please try again later", true);
  */

  createModal("Successfully logged!");
  //Display changes without actually calling the backend
  hopefulUpdate(value);

  addValueBtn.disabled = false;
}

function hopefulUpdate(offsetValue) {
  const todaysValueTag = document.getElementById("todays-value");
  let dailyValue = todaysValueTag.innerText.substring(
    0,
    todaysValueTag.innerText.indexOf("/")
  );

  let goalValue = todaysValueTag.innerText
    .substring(todaysValueTag.innerText.indexOf("/") + 1)
    .trim();

  //remove the commas if there are any
  const regex = /,/g;
  dailyValue = dailyValue.replaceAll(regex, "");

  dailyValue = parseInt(dailyValue) + parseInt(offsetValue);

  const newString = `${numberWithCommas(dailyValue)} / ${goalValue}`;
  todaysValueTag.innerText = newString;

  let todaysCard = document.querySelectorAll(".daily-card")[dailyIndex];
  todaysCard.children[1].innerText = newString;
}
//#endregion

//#region STATE GOAL START
function STATE_GOAL_START() {
  goalStartManualBtn.onclick = () => createNewGoal(false);
  goalStartRecommendedBtn.onclick = () => createNewGoal(true);
  exitGoalBtn.onclick = () => closeGoalBox();

  document.querySelector("aside").innerHTML = "";
  document.querySelector("main").innerHTML = "";
  document.getElementById("goal-create").classList.remove("closed");

  const startGoalBtn = document.createElement("button");
  startGoalBtn.innerText = "Start New Goal";
  startGoalBtn.classList.add("cta-button");
  startGoalBtn.onclick = () => openGoalBox();
  document.querySelector("main").appendChild(startGoalBtn);

  //Get the recommended value and display it
  const recommendedValue = numberWithCommas(10999);
  document.getElementById(
    "goal-recommended-value"
  ).innerText = `${recommendedValue} ${valueUnit}`;
}

function createNewGoal(isRecommendedValue) {
  //Validate
  const input = document.getElementById("goal-manual-input");
  const inputNum = parseInt(input.value);
  displayErrBorder(input, false);
  if (!isRecommendedValue) {
    if (Number.isNaN(inputNum) || inputNum <= 0) {
      displayErrBorder(input, true);
    }
  }

  goalStartManualBtn.disabled = true;
  goalStartRecommendedBtn.disabled = true;

  //TODO: Call the backend
  console.log("Yipee");
  //TODO: Reload the page if goal creation successful
  //window.location.reload();

  //TODO: Remove when we enable the backend
  goalStartManualBtn.disabled = false;
  goalStartRecommendedBtn.disabled = false;
}

function closeGoalBox() {
  const goalContainer = document.getElementById("goal-create");
  goalContainer.classList.add("closed");
}

function openGoalBox() {
  const goalContainer = document.getElementById("goal-create");
  goalContainer.classList.remove("closed");
}
//#endregion

//#region STATE BACKEND ERROR
function STATE_BACKEND_ERROR() {
  const content = document.querySelector(".content");
  content.classList.add("fatal");
  content.innerHTML = `<p>Could not connect to server. Please try again later.</p>`;
}
//#endregion

//#region Other
function getUnit() {
  const path = window.location.pathname;
  let documentTitle, title;
  if (path.includes("steps")) {
    valueUnit = "steps";
    goalTypeID = 3;
    title = "🏃 Step Goal";
    documentTitle = "Steps";
  } else if (path.includes("water")) {
    //valueUnit = "liters";
    valueUnit = "cups";
    goalTypeID = 1;
    title = "💧 Water Intake";
    documentTitle = "Water Intake";
  } else if (path.includes("sleep")) {
    valueUnit = "hours";
    goalTypeID = 2;
    title = "🛌 Sleep";
    documentTitle = "Sleep";
  }

  document.querySelector(".content h2").innerText = title;
  document.title = documentTitle + " - FitRise";
}

function numberWithCommas(x) {
  //https://stackoverflow.com/questions/2901102/how-to-format-a-number-with-commas-as-thousands-separators
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function monthName(number) {
  //JS counts months starting from 0 (Jan == 0)
  let actualNumber = number + 1;
  switch (actualNumber) {
    case 1:
      return "Jan";
    case 2:
      return "Feb";
    case 3:
      return "Mar";
    case 4:
      return "Apr";
    case 5:
      return "May";
    case 6:
      return "June";
    case 7:
      return "July";
    case 8:
      return "Aug";
    case 9:
      return "Sept";
    case 10:
      return "Oct";
    case 11:
      return "Nov";
    case 12:
      return "Dec";
    default:
      return "Not a month";
  }
}

//#endregion
