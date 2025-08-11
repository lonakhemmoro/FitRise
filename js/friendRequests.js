import {
  createPageSelector,
  setPageClick,
} from "./modules/pageSelectRelated.js";
import supabase from "./modules/supabase.js";
import createModal from "./modules/feedback/createModal.js";

let userID = "";
const contentHolder = document.querySelector(".content");

//Outgoing Count
let outgoingCount = 0;
//Incoming Count
let incomingCount = 0;
//User cards per page
const perPage = 6;
//Page Count for outgoing requests
let pageCountOut = 0; // = Math.ceil(oc / perPage);

init();
async function init() {
  const { data: dataS, error: errorS } = await supabase.auth.getUser();
  if (!dataS.user) {
    window.location.href = "login.html";
    return;
  }
  userID = dataS.user.id;
  if (errorS) {
    console.log("Init Error");
    onError(errorS);
    return;
  }

  try {
    //Get the number of outgoing requests
    const { count: countO, error: errorO } = await supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userID);

    if (errorO) throw errorO;
    outgoingCount = countO;

    //Get the number of the user's incoming friend requests
    const { count: countI, error: errorI } = await supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userID);

    if (errorI) throw errorI;
    incomingCount = countI;
  } catch (error) {
    onError(error);
    return;
  }

  const total = incomingCount + outgoingCount;
  if (total === 0) {
    contentHolder.innerHTML =
      "No friend requests. Add some users to change that!";
    return;
  }

  pageCountOut = Math.ceil(outgoingCount / perPage);
  const pageCountIn = Math.ceil(incomingCount / perPage);
  const totalPages = pageCountIn + pageCountOut;

  createPageSelector(
    totalPages * perPage,
    document.querySelector(".page-buttons")
  );
  setPageClick(onPageSelect);

  onPageSelect(1);
}

async function onPageSelect(pageNum) {
  //Is it an outgoing-request page or an incoming one?
  const isOutgoingRequest = pageNum < pageCountOut + 1;

  //Get the range for the query's limit filter
  const pagePos = isOutgoingRequest ? pageNum : pageNum - pageCountOut;
  const minRange = perPage * (pagePos - 1);
  const maxRange = perPage * pagePos - 1;

  let columnStr, selectStr;
  if (isOutgoingRequest) {
    columnStr = "user_id";
    selectStr =
      "receiver_id, users!friend_requests_receiver_id_fkey(username, first_name, last_name)";
  } else {
    columnStr = "receiver_id";
    selectStr =
      "user_id, users!friend_requests_user_id_fkey(username, first_name, last_name)";
  }

  contentHolder.classList.add("load");

  const { data, error } = await supabase
    .from("friend_requests")
    .select(selectStr)
    .eq(columnStr, userID)
    .range(minRange, maxRange);

  if (error) {
    onError(error);
    return;
  }

  //Create cards
  contentHolder.innerHTML = "";
  data.forEach((element) => {
    const a = createFriendCard(element, isOutgoingRequest);
    contentHolder.appendChild(a);
  });

  contentHolder.classList.remove("load");
}

function createFriendCard(userData, isOutgoingRequest) {
  const friendCard = document.createElement("div");
  friendCard.classList.add(...["friend-card", "card"]);

  const id = isOutgoingRequest ? userData.receiver_id : userData.user_id;
  const { username, first_name, last_name } = userData.users;

  const link = "profile.html?username=" + username;

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

  const sourceStr = isOutgoingRequest ? "Outgoing Request" : "Incoming Request";
  friendCard.innerHTML = `
  <a href="${link}">
    <p class="fc-name" ${style} title="${title}">${fullName.trim()}</p>
    <p class="fc-username" title="${username}">@${username}</p>
    <p>${sourceStr}</p>
  </a>
  `;

  if (isOutgoingRequest) {
    friendCard.innerHTML += `
    <div>
      <button class="material-symbols-outlined fc-r">close</button>
    </div>
    `;

    const rejectBtn = friendCard.querySelector("div button.fc-r");
    rejectBtn.onclick = async (evnt) => rejectRequest(id, evnt);
  } else {
    friendCard.innerHTML += `
    <div>
      <button class="material-symbols-outlined fc-a">check</button>
      <button class="material-symbols-outlined fc-r">close</button>
    </div>
    `;

    const rejectBtn = friendCard.querySelector("div button.fc-r");
    rejectBtn.onclick = async (evnt) => rejectRequest(id, evnt);
    const acceptBtn = friendCard.querySelector("div button.fc-a");
    acceptBtn.onclick = async (evnt) => acceptRequest(id, evnt);
  }

  return friendCard;
}

function acceptRequest(id, evnt) {
  //Hopeful update delete the HTML element
  //Call the backend, no await
  const parent = evnt.target.parentElement.parentElement;
  parent.remove();

  //Call backend function that handles accepting friend requests
  supabase
    .rpc("accept_friend_request", { sender_id: id })
    .then((data) => data.error)
    .then((err) => {
      if (err) {
        createModal(
          "Problem accepting friend request. Please try again later.",
          true
        );
        console.log(err);
      }
    });
}

function rejectRequest(id, evnt) {
  //Hopeful update delete the HTML element
  //Call the backend, no await
  const parent = evnt.target.parentElement.parentElement;
  parent.remove();

  //Call backend function that handles rejecting friend requests
  supabase
    .rpc("reject_friend_request", { sender_id: id })
    .then((data) => data.error)
    .then((err) => {
      if (err) {
        createModal(
          "Problem declining friend request. Please try again later.",
          true
        );
        console.log(err);
      }
    });
}

function onError(err) {
  console.log(err);
  const str = "An error has occured. Please try again later.";
  contentHolder.innerHTML = `<p>${str}</p>`;
  createModal(str, true);
  contentHolder.classList.remove("load");
}
