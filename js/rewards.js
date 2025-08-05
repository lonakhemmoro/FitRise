import supabase from "./modules/supabase.js";
import createModal from "./modules/feedback/createModal.js";
import numberWithCommas from "./modules/numberWithCommas.js";

let userID = "";

init();
async function init() {
  //Check if logged in and get userID
  const { data, error } = await supabase.auth.getUser();
  if (!data.user) {
    //Means you aren't logged in
    console.log("not logged in");
    //TODO: figure out what to do if they're not logged in
    return;
  }

  userID = data.user.id;
  if (error) {
    onError(error);
    return;
  }

  //Badges Earned
  const { data: badgeData, error: badgeError } = await supabase
    .from("user_rewards")
    .select("date_awarded, ...rewards!inner(*)")
    .eq("user_id", userID)
    .order("rewards(id)", { ascending: true });
  if (badgeError) {
    onError(badgeError);
    return;
  }

  displayBadgesEarned(badgeData);

  //Badge Image
  if (badgeData.length > 0) {
    displayBadgePhoto(badgeData[badgeData.length - 1]);
  } else {
    displayBadgePhoto();
  }

  //Points Summary
  const {
    data: { points: userPoints },
    error: pointsError,
  } = await supabase.from("users").select("points").eq("id", userID).single();
  if (pointsError) {
    onError(pointsError);
    return;
  }
  const pointsPTag = document.getElementById("points");
  pointsPTag.innerText = numberWithCommas(userPoints);
  pointsPTag.parentElement.classList.remove("skeleton-text");

  //Your Rewards
  //Get the next badge the user will get
  const { data: nextBadgeData, error: nextBadgeError } = await supabase
    .from("rewards")
    .select("name, points")
    .gt("points", userPoints)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (nextBadgeError) {
    onError(nextBadgeError);
    return;
  }

  displayYourRewards(userPoints, nextBadgeData);
}

function displayBadgesEarned(dataArr) {
  const badgesEarnedCard =
    document.querySelector("#badges").parentElement.parentElement;
  const spanTag = badgesEarnedCard.querySelector("p span");
  spanTag.innerText = dataArr.length;
  spanTag.parentElement.classList.remove("skeleton-text");

  const ulTag = badgesEarnedCard.querySelector("ul");
  ulTag.innerHTML = "";
  dataArr.forEach((element) => {
    ulTag.innerHTML += `
        <li>${numberWithCommas(element.points)} pts - ${element.name}</li>`;
  });
}

function displayYourRewards(points, badgeData) {
  const totalPointsSpan = document.querySelector("#rewardPoints");
  totalPointsSpan.innerText = points;
  totalPointsSpan.parentElement.classList.remove("skeleton-text");

  const yourRewardsCard = totalPointsSpan.parentElement.parentElement;

  const nextBadgeP = yourRewardsCard.querySelector("p + p");
  nextBadgeP.classList.remove("skeleton-text");

  //If there are no badges left to earn
  if (!badgeData) {
    nextBadgeP.innerText = `
    You have every badge!
    `;
    yourRewardsCard.querySelector("progress").remove();
    return;
  }

  nextBadgeP.innerText = `
    Next badge: ${badgeData.name} (${numberWithCommas(badgeData.points)} pts)
    `;

  const progressTag = yourRewardsCard.querySelector("progress");
  progressTag.value = points;
  progressTag.max = badgeData.points;
}

function displayBadgePhoto(badgeData) {
  const badgeImageDiv = document.querySelector(".badge");

  //Means the query returned nothing
  if (!badgeData) {
    badgeImageDiv.remove();
    return;
  }

  let imgSourceStr;
  switch (badgeData.id) {
    case 1:
      imgSourceStr = "bronze.png";
      break;
    case 2:
      imgSourceStr = "silver.png";
      break;
    case 3:
      imgSourceStr = "gold.png";
      break;
    case 4:
      imgSourceStr = "premium.png";
      break;
    default:
      imgSourceStr = "";
  }

  //Only happens if we decided to add more badges in the future
  if (imgSourceStr === "") {
    badgeImageDiv.remove();
    return;
  }

  const earnedDate = new Date(badgeData.date_awarded);
  const dateStr = earnedDate.toLocaleDateString("en-US");

  badgeImageDiv.innerHTML = `
  <img src="images/${imgSourceStr}" alt="${badgeData.name}" class="badge-image" />
  <p>${badgeData.name} - Earned on ${dateStr}</p>
  `;
  badgeImageDiv.classList.remove("skeleton-text");
}

function onError(error) {
  console.log(error);
  document.querySelector("main").innerHTML =
    "<p>An error occurred. Please try again later.</p>";
  createModal("An error occurred. Please try again later.", true);
}
