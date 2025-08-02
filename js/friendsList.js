import createHeader from "./modules/createHeader.js";
import {
  createPageSelector,
  setPageClick,
} from "./modules/pageSelectRelated.js";
import supabase from "./modules/supabase.js";
import createModal from "./modules/feedback/createModal.js";

let userID = "";
let totalCount = 0; //Total number of friends

const contentHolder = document.querySelector(".content");

createHeader();
init();

async function init() {
  //TODO: Check if logged in

  const { data: dataI, error: errorI } = await supabase.auth.getSession();
  userID = dataI.session.user.id;
  if (errorI) {
    console.log("Init Error");
    onError(errorI);
    return;
  }

  //Get the first page of friends
  let friendUserArr, friendDateArr;
  try {
    const { userArr, dateArr } = await queryBackend(0, 5, true);
    friendUserArr = userArr;
    friendDateArr = dateArr;
  } catch (error) {
    onError(error);
    return;
  }

  if (totalCount === 0) {
    contentHolder.innerHTML = `
    <p>You currently have no friends. Change that by friend requesting other users!</p>
    `;
    return;
  }
  //Create page buttons
  createPageSelector(totalCount, document.querySelector(".page-buttons"));
  setPageClick(onPageSelect, true);

  //Create friend cards
  for (let i = 0; i < friendUserArr.length; i++) {
    const a = createFriendCard(friendUserArr[i], friendDateArr[i]);
    contentHolder.appendChild(a);
  }
}

function createFriendCard(userData, dateData) {
  const friendCard = document.createElement("div");
  friendCard.classList.add(...["friend-card", "card"]);

  const { username, first_name, last_name } = userData;
  const { date: friendDate } = dateData;

  //TODO: place holder url until the friend profile page gets made
  const link = "index.html?username=" + username;

  //Account for if the user's first and last names are NULL or ""
  let fullName, style, title;
  if (!first_name && !last_name) {
    style = 'style="color:transparent"';
    fullName = "a";
    title = "";
  } else {
    style = "";
    fullName = first_name + " " + last_name;
    title = fullName;
  }

  //Convert the date from supabae's UTC to the client's local time
  const date = new Date(friendDate);
  //Format the date into American MM-DD-YYYY
  const convertedDate = date.toLocaleDateString("en-US");

  friendCard.innerHTML = `
  <a href="${link}">
    <p class="fc-name" ${style} title="${title}">${fullName.trim()}</p>
    <p class="fc-username" title="${username}">@${username}</p>
    <p>Friend Since: ${convertedDate}</p>
  </a>
  <div></div>`;

  //Friend Request Specific-code
  /*
  if (friendData.source) {
    const div = friendCard.querySelector("div");

    if (friendData.source === "incoming") {
      const acceptBtn = document.createElement("button");
      acceptBtn.innerText = "check";
      acceptBtn.classList.add(...["material-symbols-outlined", "fc-a"]);
      acceptBtn.onclick = () => acceptRequest("id placeholder"); //TODO
      div.appendChild(acceptBtn);
    }

    const rejectBtn = document.createElement("button");
    rejectBtn.innerText = "close";
    rejectBtn.classList.add(...["material-symbols-outlined", "fc-r"]);
    rejectBtn.onclick = () => rejectRequest("id placeholder"); //TODO
    div.appendChild(rejectBtn);

    const lastP = friendCard.querySelector("a").lastElementChild;
    lastP.innerText =
      friendData.source === "incoming"
        ? "Incoming Request"
        : "Outgoing Request";
  }
        */

  return friendCard;
}

async function queryBackend(minRange, maxRange, isInitial) {
  let supabaseQuery = supabase.from("friends");
  if (isInitial) {
    supabaseQuery = supabaseQuery.select("*", {
      count: "exact",
      head: false,
    });
  } else {
    supabaseQuery = supabaseQuery.select("*");
  }

  const { data, count, error } = await supabaseQuery.range(minRange, maxRange);

  if (error) {
    throw error;
  }

  totalCount = count;

  //Put the friend IDs into an array
  const dateArr = data.map((element) => {
    return element.user_id === userID
      ? { friendID: element.friend_id, date: element.date }
      : { friendID: element.user_id, date: element.date };
  });
  dateArr.sort(querySort); //Sort by id in alpha-numerically order
  const friendIDArr = dateArr.map((element) => element.friendID);

  const { data: dataU, error: errorU } = await supabase
    .from("users")
    .select("id, username, first_name, last_name")
    .in("id", friendIDArr)
    .order("id", { ascending: true });

  if (errorU) throw errorU;
  if (dataU.length !== data.length) {
    throw new Error("Length Mismatch");
  }

  return { userArr: dataU, dateArr: dateArr };
}

//Used by the queryBackend() to sort data alpha-numerically ascending
function querySort(a, b) {
  const idA = a.friendID;
  const idB = b.friendID;
  if (idA < idB) {
    return -1;
  }
  if (idA > idB) {
    return 1;
  }

  return 0; //ids are the same then
}

//#region Friend Request
function acceptRequest(userID) {
  //TODO: Backend
  console.log("accepting Request");
}

function rejectRequest(userID) {
  //TODO: Backend
  console.log("rejecting Request");
}

//#endregion

//#region Page Select

async function onPageSelect(pageNum) {
  contentHolder.classList.add("load");

  const rangeMin = 6 * (pageNum - 1);
  const rangeMax = 6 * pageNum - 1;

  let friendUserArr, friendDateArr;
  try {
    const { userArr, dateArr } = await queryBackend(rangeMin, rangeMax, true);
    friendUserArr = userArr;
    friendDateArr = dateArr;
  } catch (error) {
    onError(error);
    return;
  }

  //Create cards
  contentHolder.innerHTML = "";
  for (let i = 0; i < friendUserArr.length; i++) {
    const a = createFriendCard(friendUserArr[i], friendDateArr[i]);
    contentHolder.appendChild(a);
  }

  contentHolder.classList.remove("load");
}
//#endregion

function onError(err) {
  console.log(err);
  const str = "An error has occured. Please try again later.";
  contentHolder.innerHTML = `<p>${str}</p>`;
  createModal(str, true);
}
