import supabase from "./modules/supabase.js";
import createModal from "./modules/feedback/createModal.js";
import stringToDate from "./modules/stringToDate.js";
import { cmToFt, kgToLbs } from "./modules/unitConversions.js";
import isSameDate from "./modules/isSameDate.js";

let loggedInUserID, loggedInUserEmail;
let profileUserID; //The id of the user who's info is being displayed

let isSelfProfile; //Is this the profile of the logged-in user

init();
async function init() {
  isSelfProfile = false;

  //Check if logged in, and get the logged-in user's info
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    //TODO: Redirect to the login page
    return;
  }
  loggedInUserID = data.user.id;
  loggedInUserEmail = data.user.email;
  console.log(loggedInUserEmail);

  //Check if the url has the 'username' params
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("username");
  isSelfProfile = !username;

  //Backend search for the user
  let userData, userError;
  if (isSelfProfile) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", loggedInUserID)
      .limit(1)
      .maybeSingle();
    userData = data;
    userError = error;
  } else {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .limit(1)
      .maybeSingle();
    userData = data;
    userError = error;
  }

  if (userError) {
    onFatalError("Error loading profile. Please try again later");
    return;
  }

  if (!userData) {
    onFatalError("User does not exist");
    return;
  }

  /*If searched user has same ID as logged-in user, 
    treat page as if it's theirs */
  if (userData.id === data.user.id) {
    isSelfProfile = true;
  }
  profileUserID = userData.id;

  //Display User Data. No await
  displayBaseUserInfo(userData);
  getBadge();
  getStreak();
  getCurrentGoals();

  if (isSelfProfile) {
    init_self();
  } else {
    init_otherUser();
  }
}

function onFatalError(displayStr) {
  document.querySelector(".content").innerHTML = `
      <p>${displayStr}</p>
      `;
  createModal(displayStr, true);
}

//#region Display User Info

function displayBaseUserInfo(userData) {
  //"Base user info" as in anything found in the "users" table

  //If first/last name is empty or null
  const firstName = !userData.first_name ? "" : userData.first_name;
  const lastName = !userData.last_name ? "" : userData.last_name;
  let fullName = firstName + " " + lastName;
  fullName = fullName.trim();
  document.getElementById("user-name").textContent = fullName;

  document.getElementById(
    "user-username"
  ).textContent = `@${userData.username}`;

  const emailStr = isSelfProfile ? loggedInUserEmail : "";
  document.getElementById("user-email").textContent = emailStr;

  const age = getAge(stringToDate(userData.birthdate));
  document.getElementById("user-age").textContent = age;

  let height = cmToFt(userData.height);
  height = `${height.feet}' ${height.inches}"`;
  document.getElementById("user-height").textContent = height;

  let weight = kgToLbs(userData.weight);
  document.getElementById("user-weight").textContent = weight + " lbs";

  document.getElementById("user-points").textContent =
    userData.points.toLocaleString();
}

function getAge(birthdate) {
  //https://stackoverflow.com/questions/4060004/calculate-age-given-the-birth-date-in-the-format-yyyymmdd
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}

async function getStreak() {
  const { data: streakData, error } = await supabase
    .from("streaks")
    .select("value, last_updated")
    .eq("user_id", profileUserID)
    .single();

  if (error) {
    document.getElementById("user-streak").textContent = "N/A - Error";
    return;
  }

  //If last_updated is over 1 day old, then make streak = 0
  let dateMax = new Date();
  let lastUpdatedDate = stringToDate(streakData.last_updated.split("T")[0]);
  let isInRange = false;

  for (let i = 0; i < 2; i++) {
    if (isSameDate(dateMax, lastUpdatedDate)) {
      isInRange = true;
      break;
    }
    dateMax.setDate(dateMax.getDate() - 1);
  }

  let streak = isInRange ? streakData.value : 0;
  let dayStr = streak === 1 ? "day" : "days";

  document.getElementById("user-streak").textContent = streak + " " + dayStr;

  // We can also use the streak to know when they were last active
  //The backend isn't configured to know when a user is online

  let lastActive;
  if (isSameDate(new Date(), lastUpdatedDate)) {
    lastActive = "Today";
  } else {
    lastActive = lastUpdatedDate.toLocaleDateString("en-US");
  }
  document.getElementById("user-last-active").textContent = lastActive;
}

async function getBadge() {
  const { data: badgeData, error: badgeError } = await supabase
    .from("user_rewards")
    .select("date_awarded, ...rewards!inner(*)")
    .eq("user_id", profileUserID)
    .order("rewards(id)", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (badgeError) {
    document.getElementById("user-badge").textContent = "N/A - Error";
    return;
  }

  let badgeStr = !badgeData ? "No Badges Yet" : badgeData.name;
  document.getElementById("user-badge").textContent = badgeStr;
}

async function getCurrentGoals() {
  //Get the user's goals that were made w/i the past week
  let weekAgoDate = new Date();
  weekAgoDate.setDate(weekAgoDate.getDate() - 7);
  weekAgoDate = weekAgoDate.toLocaleDateString("en-US");

  for (let i = 1; i < 4; i++) {
    let goalStr, goalUnit;
    if (i === 1) {
      goalStr = "water";
      goalUnit = "cups";
    } else if (i === 2) {
      goalStr = "sleep";
      goalUnit = "hrs";
    } else {
      goalStr = "steps";
      goalUnit = "steps";
    }

    const { data, error } = await supabase
      .from("goals")
      .select("value, adjusted_by")
      .eq("user_id", profileUserID)
      .eq("goal_type_id", i)
      .gt("date", weekAgoDate)
      .limit(1)
      .maybeSingle();

    if (error) {
      document.getElementById("goal-" + goalStr).textContent = "N/A - Error";
      continue;
    } else if (!data) {
      document.getElementById("goal-" + goalStr).textContent = "N/A";
      continue;
    }

    const goalValue = Math.round(data.value * data.adjusted_by);
    document.getElementById("goal-" + goalStr).textContent =
      goalValue + " " + goalUnit;
  }
}

//#endregion

//#region STATE self
async function init_self() {
  const editProfileButton = document.getElementById("edit-profile");
  //Open the "edit user" page in a new tab
  editProfileButton.onclick = () => {
    window.open("editUser.html", "_blank").focus();
  };
}
//#endregion

//#region STATE otherUser

async function init_otherUser() {
  let whichIsTrue = 0;
  try {
    //Check if they're your friend
    if (await isFriend()) whichIsTrue = 1;

    //Check if they've sent a friend request
    if (whichIsTrue === 0) {
      // Didn't do (whichIsTrue === 0 && isRequestIncoming())
      // Because it still processes the second even if whichIsTrue is false
      if (await isRequestIncoming()) whichIsTrue = 2;
    }

    //Check if you've sent a friend request
    if (whichIsTrue === 0) {
      if (await isRequestOutgoing()) whichIsTrue = 3;
    }
  } catch (error) {
    //Go to error fatal state
    console.log(error);
    onFatalError("Error loading profile. Please try again later");
    return;
  }

  //Alter the button based on which is true
  alterButton(whichIsTrue);
}

async function isFriend() {
  const { data, error } = await supabase
    .from("friends")
    .select("*")
    .or(
      `and(user_id.eq.${loggedInUserID}, friend_id.eq.${profileUserID}), and(user_id.eq.${profileUserID}, friend_id.eq.${loggedInUserID})`
    )
    .maybeSingle();

  if (error) throw error;

  if (data) return true;
  else return false;
}

async function isRequestIncoming() {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("user_id", profileUserID)
    .eq("receiver_id", loggedInUserID)
    .maybeSingle();

  if (error) throw error;

  if (data) return true;
  else return false;
}

async function isRequestOutgoing() {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("user_id", loggedInUserID)
    .eq("receiver_id", profileUserID)
    .maybeSingle();

  if (error) throw error;

  if (data) return true;
  else return false;
}

function alterButton(whichIsTrue) {
  //Delete any buttons that were there previously
  const buttonHolder = document.getElementById("button-holder");
  buttonHolder
    .querySelectorAll("button")
    .forEach((element) => element.remove());

  if (whichIsTrue === 1) {
    buttonHolder.innerHTML =
      "<button class='btn-delete'>Delete Friend</button>";
    const btn = buttonHolder.querySelector("button");
    btn.onclick = async (evnt) => removeFriend(evnt);
  } else if (whichIsTrue === 2) {
    buttonHolder.innerHTML = `
    <button class="btn-accept">Accept Request</button>
    <button class="btn-delete">Reject Request</button>
    `;
    const arr = buttonHolder.querySelectorAll("button");
    const btnAccept = arr[0];
    const btnReject = arr[1];

    btnAccept.onclick = async (evnt) => acceptFriendRequest(evnt, btnReject);
    btnReject.onclick = async (evnt) => rejectFriendRequest(evnt, btnAccept);
  } else if (whichIsTrue === 3) {
    buttonHolder.innerHTML =
      "<button class='btn-delete'>Cancel Friend Request</button>";
    const btn = buttonHolder.querySelector("button");
    btn.onclick = async (evnt) => rejectFriendRequest(evnt);
  } else if (whichIsTrue === 0) {
    buttonHolder.innerHTML = "<button>Send Friend Request</button>";
    const btn = buttonHolder.querySelector("button");
    btn.onclick = async (evnt) => sendFriendRequest(evnt);
  }
}

async function sendFriendRequest(evnt) {
  evnt.target.disabled = true;

  const { error } = await supabase
    .from("friend_requests")
    .insert({ user_id: loggedInUserID, receiver_id: profileUserID });

  if (error) {
    createModal("Error sending friend request. Please try again later", true);
    evnt.target.disabled = false;
  } else {
    //hopeful update
    alterButton(3);
  }
}

async function acceptFriendRequest(evnt, siblingBtn) {
  evnt.target.disabled = true;
  siblingBtn.disabled = true;

  const { error } = await supabase.rpc("accept_friend_request", {
    sender_id: profileUserID,
  });

  if (error) {
    createModal(
      "Problem accepting friend request. Please try again later.",
      true
    );
    evnt.target.disabled = false;
    siblingBtn.disabled = false;
  } else {
    alterButton(1);
  }
}

//Also used for canceling requests you sent
async function rejectFriendRequest(evnt, siblingBtn) {
  evnt.target.disabled = true;
  if (siblingBtn) siblingBtn.disabled = true;

  //sender_id is misleading. Whether rejecting or cancelinng, always put profileUserID
  const { error } = await supabase.rpc("reject_friend_request", {
    sender_id: profileUserID,
  });

  if (error) {
    createModal(
      "Problem declining friend request. Please try again later.",
      true
    );
    evnt.target.disabled = false;
    if (siblingBtn) siblingBtn.disabled = false;
  } else {
    alterButton(0);
  }
}

async function removeFriend(evnt) {
  evnt.target.disabled = true;

  //According to the supabase docs, delete doesn't return 'error'
  const response = await supabase
    .from("friends")
    .delete()
    .or(
      `and(user_id.eq.${loggedInUserID}, friend_id.eq.${profileUserID}), and(user_id.eq.${profileUserID}, friend_id.eq.${loggedInUserID})`
    );

  //hopeful update
  alterButton(0);
}

//#endregion
