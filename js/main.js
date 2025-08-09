import supabase from "./modules/supabase.js";
import numberWithCommas from "./modules/numberWithCommas.js";
import stringToDate from "./modules/stringToDate.js";
import isSameDate from "./modules/isSameDate.js";

// DOM elements
const getStartedBtn = document.querySelector(".hero button");
const pointsDisplay = document.getElementById("points");
const badgesDisplay = document.getElementById("badges");
const streakDisplay = document.getElementById("streak");
const messageDisplay = document.getElementById("message");

// Set initial values
let points = parseInt(localStorage.getItem("points")) || 1200;
let badges = parseInt(localStorage.getItem("badges")) || 4;
let streak = parseInt(localStorage.getItem("streak")) || 3;

// Define badge unlock thresholds
const badgeThresholds = [1500, 2000, 3000, 5000];

async function logout() {
  const { error } = await supabase.auth.signOut();
  //Disregard any error and continue
  localStorage.clear();
  window.location.href = "login.html";
}

// Add points and update dashboard
function getStarted_old() {
  points += 100;
  pointsDisplay.textContent = `Points: ${points}`;
  localStorage.setItem("points", points);
  // Badge logic
  if (badgeThresholds.includes(points)) {
    badges++;
    badgesDisplay.textContent = `Badges: ${badges}`;
    localStorage.setItem("badges", badges);
    messageDisplay.textContent = `🎉 Congrats! You unlocked a new badge!`;
  } else {
    messageDisplay.textContent = `You've earned 100 points!`;
  }

  // Streak update
  streak++;
  streakDisplay.textContent = `Streak: ${streak} Days`;
  localStorage.setItem("streak", streak);
}

function getStarted() {
  const loggedIn = localStorage.getItem("loggedIn");
  window.location.href = loggedIn ? "goals.html" : "signUp.html";
}

init();
async function init() {
  //Needs to be put here or else you can't access the header's elements
  // Load the header content
  await fetch("header.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("header-placeholder").innerHTML = data;

      // Now that header is loaded, attach the nav toggle event
      const navToggle = document.getElementById("navToggle");
      const mainNav = document.getElementById("mainNav");
      if (navToggle && mainNav) {
        navToggle.addEventListener("click", function () {
          mainNav.classList.toggle("open");
        });
      }
    });
  //Give logout button functionality
  document.getElementById("logoutBtn").onclick = () => logout();

  // Check if the user is logged in
  // Every page uses main.js but every page also separately checks if the user is logged in
  // So only run if we're on the home page
  if (window.location.pathname.includes("index.html")) {
    //Give getStarted button functionality
    getStartedBtn.onclick = () => getStarted();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      //!data.user means you aren't logged in
      //If error, just treat as not logged in

      const holderDiv = document.createElement("div");
      holderDiv.id = "login-holder";
      holderDiv.innerHTML = `
    <button id="signup-btn" class="header-btn">Sign Up</button>
    <button id="login-btn" class="header-btn">Login</button>
    `;
      const logoutBtn = document.getElementById("logoutBtn");
      logoutBtn.replaceWith(holderDiv);

      //Give the buttons functionality
      holderDiv.querySelector("#signup-btn").onclick = () => {
        window.location.href = "signUp.html";
      };
      holderDiv.querySelector("#login-btn").onclick = () => {
        window.location.href = "login.html";
      };
      return;
    }

    const userID = data.user.id;

    //Get goals
    let goalArr = await getGoals(userID);
    //Get rewards
    let rewardsArr = await getRewards(userID);
    //Get streak
    let streakStr = await getStreak(userID);

    displayTodayCard(goalArr, streakStr, rewardsArr.length);
    displayRewardsCard(rewardsArr);
    displayProgressCard(goalArr);
  }
}

//#region Backend Queries
async function getStreak(userID) {
  const { data, error } = await supabase
    .from("streaks")
    .select("value, last_updated")
    .eq("user_id", userID)
    .single();

  if (error) {
    return "N/A - Error";
  }

  //If last_updated is over 1 day old, then make streak = 0
  let dateMax = new Date();
  let lastUpdatedDate = stringToDate(data.last_updated.split("T")[0]);
  let isInRange = false;

  for (let i = 0; i < 2; i++) {
    if (isSameDate(dateMax, lastUpdatedDate)) {
      isInRange = true;
      break;
    }
    dateMax.setDate(dateMax.getDate() - 1);
  }

  let streak = isInRange ? data.value : 0;
  let dayStr = streak === 1 ? "day" : "days";

  return numberWithCommas(streak) + " " + dayStr;
}

async function getRewards(userID) {
  const { data, error } = await supabase
    .from("user_rewards")
    .select("date_awarded, ...rewards!inner(*)")
    .eq("user_id", userID)
    .order("rewards(id)", { ascending: true });
  if (error) {
    return [];
  } else {
    return data;
  }
}

async function getGoals(userID) {
  //Get today's daily activities if there are any
  const goalDataArr = [];
  const todayDate = new Date().toLocaleDateString("en-US");

  for (let i = 1; i < 4; i++) {
    const { data, error } = await supabase
      .from("daily_activities")
      .select("value, adjusted_goal_value")
      .eq("user_id", userID)
      .eq("goal_type_id", i)
      .lte("date", todayDate)
      .order("date", { ascending: false })
      .limit(2);

    if (error || data.length === 0) {
      continue;
    }

    let obj = {
      goalType: i,
      goalChange: 0,
      dailyValue: 0,
      adjustedGoalValue: 0,
    };

    //If it's the first day of the goal
    if (data.length === 1) {
      obj.dailyValue = data[0].value;
      obj.adjustedGoalValue = data[0].adjusted_goal_value;
      obj.goalChange = 0;

      //push obj
      goalDataArr.push(obj);
      continue;
    }

    obj.dailyValue = data[0].value;
    obj.adjustedGoalValue = data[0].adjusted_goal_value;

    const todayAdjustedGoalValue = data[0].adjusted_goal_value;
    const yesterdayAdjustedGoalValue = data[1].adjusted_goal_value;
    if (yesterdayAdjustedGoalValue !== todayAdjustedGoalValue) {
      obj.goalChange = todayAdjustedGoalValue - yesterdayAdjustedGoalValue;
    }

    goalDataArr.push(obj);
  }

  return goalDataArr;
}
//#endregion

//#region DisplayCards

function displayTodayCard(goalDataArr, streakStr, rewardCount) {
  const todayCard = document.querySelector(".card.today");
  todayCard.innerHTML = "<h2>Today</h2>";
  goalDataArr.forEach((element) => {
    const { unit, goalType } = getUnit(element.goalType);

    todayCard.innerHTML += `
    <p>${goalType}: ${numberWithCommas(
      element.dailyValue
    )} / ${numberWithCommas(element.adjustedGoalValue)} ${unit}</p>
    `;
  });

  todayCard.innerHTML += `<p id="points">Points: ${streakStr}</p>`;
  todayCard.innerHTML += `<p>Badges: ${rewardCount}`;
}

function displayRewardsCard(rewardsArr) {
  const rewardsCard = document.querySelector(".card.rewards");

  rewardsCard.innerHTML = "<h2>Rewards</h2>";
  if (rewardsArr.length === 0) {
    rewardsCard.innerHTML += `<p>No Rewards Yet</p>`;
  } else {
    rewardsArr.forEach((element) => {
      rewardsCard.innerHTML += `
    <p>${numberWithCommas(element.points)} pts - ${element.name}</p>
    `;
    });
  }
}

function displayProgressCard(goalDataArr) {
  const progressCard = document.querySelector(".card.progress");
  progressCard.innerHTML = "<h2>Progress</h2>";

  goalDataArr.forEach((element) => {
    if (element.goalChange !== 0) {
      const { goalType } = getUnit(element.goalType);
      const sign = element.goalChange > 1 ? "+" : "";
      //Don't need "-" because that will come from element.goalChange if it is negative
      progressCard.innerHTML += `<p>Goal Change: ${goalType} Goal ${sign}${element.goalChange}`;
    }
  });

  if (goalDataArr.length === 0) {
    progressCard.innerHTML += `<p>You have no active goals currently</p>`;
  }
}

function getUnit(num) {
  let unit, goalType;
  if (num == 1) {
    unit = "cups";
    goalType = "Water Intake";
  } else if (num == 2) {
    unit = "hours";
    goalType = "Sleep";
  } else if (num == 3) {
    unit = "steps";
    goalType = "Steps";
  }
  return { unit, goalType };
}

//#endregion
