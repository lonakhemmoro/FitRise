import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import createModal from "./modules/feedback/createModal.js";
import stringToDate from "./modules/stringToDate.js";
import supabase from "./modules/supabase.js";
import numberWithCommas from "./modules/numberWithCommas.js";

const dailyInput = document.getElementById("value-input");
const addValueBtn = document.getElementById("add-value");
const goalStartManualBtn = document.getElementById("goal-start-manual");
const goalStartRecommendedBtn = document.getElementById(
  "goal-start-recommended"
);
const exitGoalBtn = document.getElementById("goal-exit");

let userID, goalID;

let valueUnit = "";
let goalTypeID = -1;

let dailyIndex = -1;

init();
async function init() {
  addValueBtn.disabled = true;
  goalStartRecommendedBtn.disabled = true;
  goalStartManualBtn.disabledd = true;

  //Check if logged in
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    //TODO: Redirect to the login page
    return;
  }
  userID = data.user.id;

  getUnit();

  //Get the current the current goal if it's still active
  const currentDate = new Date().toLocaleDateString("en-US");
  let weekAgoDate = new Date(currentDate);
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  weekAgoDate = weekAgoDate.toLocaleDateString("en-US");

  const { data: goalData, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userID)
    .eq("goal_type_id", goalTypeID)
    .gt("date", weekAgoDate)
    .limit(1)
    .maybeSingle();

  if (goalError) {
    STATE_BACKEND_ERROR();
    return;
  }

  if (!goalData) {
    //STATE_GOAL_START
    STATE_GOAL_START();
  } else {
    //STATE_DAILY_ACTIVITY
    goalID = goalData.id;

    //TODO: Call the adaptive goal system

    const { data: dailyData, error: dailyError } = await supabase
      .from("daily_activities")
      .select("*")
      .eq("goal_id", goalID)
      .order("date", { ascending: true });
    if (dailyError) {
      STATE_BACKEND_ERROR();
      return;
    }

    STATE_DAILY_ACTIVITY_init(dailyData);
  }
  return;
}

//#region STATE DAILY ACTIVITIY
function STATE_DAILY_ACTIVITY_init(dailyArr) {
  addValueBtn.onclick = (evnt) => addValue(evnt);
  addValueBtn.disabled = false;

  const aside = document.querySelector("aside");
  createGoalPeriod(aside, dailyArr[0], dailyArr[dailyArr.length - 1]);
  createCards(aside, dailyArr);
  getTodaysDaily(aside, dailyArr);
}

function createGoalPeriod(aside, startDaily, endDaily) {
  let startDate = stringToDate(startDaily.date);
  startDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  let endDate = stringToDate(endDaily.date);
  endDate = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const goalPeriod = `Goal: ${startDate} - ${endDate}`;

  aside.innerHTML = `<h2 id="goal-period">${goalPeriod}</h2>`;
}

function createCards(aside, dailyArr) {
  dailyArr.forEach((element) => {
    let date = stringToDate(element.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const value = numberWithCommas(element.value);
    const goalValue = numberWithCommas(element.adjusted_goal_value);

    aside.innerHTML += `
    <div class="daily-card">
      <p>${date}</p>
      <p>${value} / ${goalValue} ${valueUnit}</p>
    </div>
    `;
  });
}

function isSameDate(dateOne, dateTwo) {
  return (
    dateOne.getFullYear() === dateTwo.getFullYear() &&
    dateOne.getMonth() === dateTwo.getMonth() &&
    dateOne.getDate() === dateTwo.getDate()
  );
}

function getTodaysDaily(aside, dailyActsArr) {
  const today = new Date();
  dailyIndex = -1; // reset index

  for (let i = 0; i < dailyActsArr.length; i++) {
    const dailyDate = stringToDate(dailyActsArr[i].date);
    if (isSameDate(dailyDate, today)) {
      dailyIndex = i;
      break;
    }
  }

  // If no entry found, create a new one for today
  if (dailyIndex === -1) {
    const newDateStr = today.toISOString().split("T")[0];
    const newDailyObj = { date: newDateStr, value: 0, adjusted_goal_value: 0 };
    dailyActsArr.push(newDailyObj);

    // Add a new card to the UI
    createCards(aside, [newDailyObj]);

    dailyIndex = dailyActsArr.length - 1;
  }

  const { value: todaysValue, adjusted_goal_value: todaysGoalValue } =
    dailyActsArr[dailyIndex];

  const todaysValueTextArea = document.getElementById("todays-value");
  todaysValueTextArea.innerText = `${numberWithCommas(
    todaysValue
  )} / ${numberWithCommas(todaysGoalValue)} ${valueUnit}`;
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

  //Get the previous value for today's daily entry

  addValueBtn.disabled = true;

  //Update Streak. SQL Function
  const { error: streakErr } = await supabase.rpc("update_streak");
  if (streakErr) {
    //Do not reveal the actual reason for error
    createModal("Error logging activity. Please try again later", true);
    addValueBtn.disabled = false;
    return;
  }
  //Update today's value in the database
  const { error: updateErr } = await supabase.rpc("update_daily_entry", {
    offset_value: value,
    goal_id_arg: goalID,
    tz: getTimezone(),
  });
  if (updateErr) {
    createModal("Error logging activity. Please try again later", true);
    addValueBtn.disabled = false;
    return;
  }

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
async function STATE_GOAL_START() {
  //Update the status of the previous goal
  const { error: statusUpdateErr } = await supabase.rpc("update_prev_goal", {
    goal_type: goalTypeID,
  });
  if (statusUpdateErr) {
    STATE_BACKEND_ERROR();
    return;
  }

  //Get the previous goal, so we can get the recommended value
  const { data: prevGoal, error: prevGoalErr } = await supabase
    .from("goals")
    .select("id, value, adjusted_by")
    .eq("user_id", userID)
    .eq("goal_type_id", goalTypeID)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  //If prevGoalErr, nothing happens. It's fine. We just won't have the recommended value.
  //Get and Display recommended value
  if (!prevGoalErr) {
    const recommendedValue = getRecommendedValue(prevGoal);
    const goalRecommendedHTML = document.getElementById(
      "goal-recommended-value"
    );
    goalRecommendedHTML.innerText = `${numberWithCommas(
      recommendedValue
    )} ${valueUnit}`;
    goalRecommendedHTML.classList.remove("skeleton-text");
    goalStartRecommendedBtn.onclick = (evnt) =>
      createNewGoal(evnt, true, recommendedValue);
    goalStartRecommendedBtn.disabled = false;
  } else {
    document.getElementById(
      "goal-recommended-value"
    ).innerText = `N/A - Error obtaining recommended goal value`;
  }

  goalStartManualBtn.onclick = (evnt) => createNewGoal(evnt, false, {});
  exitGoalBtn.onclick = () => closeGoalBox();

  document.querySelector("aside").innerHTML = "";
  document.querySelector("main").innerHTML = "";
  document.getElementById("goal-create").classList.remove("closed");

  const startGoalBtn = document.createElement("button");
  startGoalBtn.innerText = "Start New Goal";
  startGoalBtn.classList.add("cta-button");
  startGoalBtn.onclick = () => openGoalBox();
  document.querySelector("main").appendChild(startGoalBtn);
}

async function createNewGoal(evnt, isRecommendedValue, recommendedValue) {
  evnt.preventDefault();

  let newGoalValue;
  if (isRecommendedValue) {
    newGoalValue = recommendedValue;
  } else {
    const input = document.getElementById("goal-manual-input");
    const inputNum = parseInt(input.value);
    displayErrBorder(input, false);
    //Validate
    if (Number.isNaN(inputNum) || inputNum <= 0) {
      displayErrBorder(input, true);
      return;
    }
    newGoalValue = inputNum;
  }

  goalStartManualBtn.disabled = true;
  goalStartRecommendedBtn.disabled = true;

  //Call  backend
  const { error } = await supabase.rpc("create_goal", {
    goal_type: goalTypeID,
    goal_value: newGoalValue,
    tz: getTimezone(),
  });
  //On error, just display a modal
  if (error) {
    createModal("Error creating new goal. Please try again later", true);
    goalStartManualBtn.disabled = false;
    goalStartRecommendedBtn.disabled = false;
    return;
  }

  //Reload the page if goal creation successful
  window.location.reload();

  //TODO: Remove when we enable the backend
  //goalStartManualBtn.disabled = false;
  //goalStartRecommendedBtn.disabled = false;
}

function closeGoalBox() {
  const goalContainer = document.getElementById("goal-create");
  goalContainer.classList.add("closed");
}

function openGoalBox() {
  const goalContainer = document.getElementById("goal-create");
  goalContainer.classList.remove("closed");
}

function getRecommendedValue(goalData) {
  let recommendedValue;

  //If goalData == null, means this is the user's first time on this goalType
  if (!goalData) {
    if (goalTypeID === 1)
      recommendedValue = 11; //Recommended daily water intake for women
    else if (goalTypeID === 2) recommendedValue = 8;
    else recommendedValue = 10000; //Recomended amnt of steps for adults
  } else {
    //Get the last goal value and multiple it by its adjusted value
    recommendedValue = goalData.value * goalData.adjusted_by;
  }
  return recommendedValue;
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
  addValueBtn.innerText = "Add " + valueUnit;
}

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

//#endregion
