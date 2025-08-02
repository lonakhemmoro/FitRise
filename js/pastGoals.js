import numberWithCommas from "./modules/numberWithCommas.js";
import {
  createPageSelector,
  deletePageButtons,
  setPageClick,
} from "./modules/pageSelectRelated.js";
import stringToDate from "./modules/stringToDate.js";
import supabase from "./modules/supabase.js";
import createHeader from "./modules/createHeader.js";
import createModal from "./modules/feedback/createModal.js";

/*
const dummyData0 = [
  {
    daily_activities: [
      { date: "2025-07-26", value: 0 },
      { date: "2025-07-27", value: 1000 },
      { date: "2025-07-28", value: 95212 },
      { date: "2025-07-29", value: 2 },
    ],
    date: "2025-07-26",
    id: 13,
    status: "active",
    value: 2000,
  },
];
*/
let userID = "";
let supabaseQuery;
let rangeMin = 0,
  rangeMax = 0;
let valueUnit = "";

const contentHolder = document.querySelector(".content-holder");

init();
async function init() {
  createHeader();
  //TODO: Check if logged in

  const { data, error } = await supabase.auth.getSession();
  userID = data.session.user.id;
  if (error) {
    console.log("Init Error");
    onError();
  }

  await newQueryInit();
  document.querySelector("form").onchange = async () => newQueryInit();
}

function createGoalCard(goalElement) {
  const { daily_activities: dailyArr } = goalElement;

  const goalCard = document.createElement("goal-card");
  goalCard.classList.add("goal-card");
  goalCard.innerHTML = `
    <div class="goal-card">
        <p class="goal-period"></p>
        <div class="daily-holder-parent">
        </div>
    <div>
    `;

  /*Template
    <div class="goal-card">
          <p class="goal-period">Month Day - Month Day 2025</p>
          <div class="daily-holder-parent">
            <p class="goal-status">Status: Failed</p>
            <div class="daily-holder">
              <p>July 1</p>
              <p>9000/9000 steps</p>
            </div>
            <div class="daily-holder">
              <p>July 2</p>
              <p>9000/9000 steps</p>
            </div>
            <div class="daily-holder">
              <p>July 3</p>
              <p>9000/9000 steps</p>
            </div>
            <div class="daily-holder">
              <p>July 4</p>
              <p>9000/9000 steps</p>
            </div>
          </div>
        </div>
    */

  goalCard.querySelector(".goal-period").innerText = getGoalPeriod(
    goalElement.date
  );

  const dailyHolderParent = goalCard.querySelector(".daily-holder-parent");

  let statusString = "";
  if (goalElement.status === "fail") {
    statusString = "Failed";
  } else if (goalElement.status === "complete") {
    statusString = "Completed";
  } else if (goalElement.status === "active") {
    statusString = "Active";
  }
  dailyHolderParent.innerHTML += `<p class="goal-status">Status: ${statusString}</p>`;

  const dailyOptions = {
    month: "long",
    day: "numeric",
  };
  dailyArr.forEach((element) => {
    let dateStr = stringToDate(element.date);
    dateStr = dateStr.toLocaleDateString("en-US", dailyOptions);
    dailyHolderParent.innerHTML += `
    <div class="daily-holder">
        <p>${dateStr}</p>
        <p>${numberWithCommas(element.value)} / ${numberWithCommas(
      goalElement.value
    )} ${valueUnit}</p>
    </div>
    `;
  });

  document.querySelector(".content-holder").appendChild(goalCard);
}

function getGoalPeriod(goalDate) {
  const startDate = stringToDate(goalDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);

  const endOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const startOptions = {
    month: "long",
    day: "numeric",
  };
  const startDateStr = startDate.toLocaleDateString("en-US", startOptions);
  const endDateStr = endDate.toLocaleDateString("en-US", endOptions);
  return startDateStr + " - " + endDateStr;
}

//Returns the query with dynamic filtering to later be used with the backend
function getSupabaseQuery(
  goalType,
  completeStatus,
  startDate,
  endDate,
  isInitial
) {
  let supabaseQuery;

  if (isInitial) {
    supabaseQuery = supabase
      .from("goals")
      .select("date, value, status, id, daily_activities!inner(value, date) ", {
        count: "exact",
        head: false,
      })
      .eq("user_id", userID)
      .eq("goal_type_id", goalType);
  } else {
    supabaseQuery = supabase
      .from("goals")
      .select("date, value, status, id, daily_activities!inner(value, date) ")
      .eq("user_id", userID)
      .eq("goal_type_id", goalType);
  }

  if (completeStatus !== "all") {
    supabaseQuery = supabaseQuery.eq("status", completeStatus);
  }

  if (startDate) {
    supabaseQuery = supabaseQuery.gte("date", startDate);
  }

  if (endDate) {
    supabaseQuery = supabaseQuery.lte("date", endDate);
  }

  supabaseQuery = supabaseQuery.order("id", { ascending: true });

  return supabaseQuery;
}

//#region Page Button

//Query the next set of data
async function onPageSelect(num) {
  //Num is the current page position
  rangeMin = 6 * (num - 1);
  rangeMax = 6 * num - 1;

  const { data, error } = await supabaseQuery.range(rangeMin, rangeMax);

  if (error) {
    console.log("OnPageSelect Error");
    console.log(error);
    onError();
    return;
  }

  contentHolder.innerHTML = "";
  data.forEach((element) => {
    createGoalCard(element);
  });
}

//Called on load, or when a new filter is selected. Also remakes the page buttons
async function newQueryInit() {
  const goalType = document.getElementById("goal-type").value;
  const completeStatus = document.getElementById("completion-status").value;
  const startDate = document.getElementById("from-date").value;
  const endDate = document.getElementById("to-date").value;

  if (goalType === "1") {
    valueUnit = "cups";
  } else if (goalType === "2") {
    valueUnit = "hours";
  } else {
    valueUnit = "steps";
  }

  let initSupabaseQuery = getSupabaseQuery(
    goalType,
    completeStatus,
    startDate,
    endDate,
    true
  );
  supabaseQuery = getSupabaseQuery(
    goalType,
    completeStatus,
    startDate,
    endDate,
    false
  );

  //Query Backend
  const { data, count, error } = await initSupabaseQuery.range(0, 5);

  if (error) {
    console.log(error);
    onError();
    return;
  }

  if (count === 0) {
    if (document.querySelector(".page-ph").innerHTML !== "") {
      deletePageButtons();
    }
    contentHolder.innerHTML = `<p>You have no goals to display.</p>`;
    return;
  } else {
    createPageSelector(count, document.querySelector(".page-ph"));
    setPageClick(onPageSelect, true);
  }

  //Populate the first page with data
  contentHolder.innerHTML = "";
  data.forEach((element) => {
    createGoalCard(element);
  });
}
//#endregion

function onError() {
  contentHolder.innerHTML = `<p>An error has occured. Please try again later.</p>`;
  createModal("An error has occured. Please try again later.", true);
}
