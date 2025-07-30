import createHeader from "./modules/createHeader.js";
import {
  createPageSelector,
  setPageClick,
} from "./modules/pageSelectRelated.js";
import stringToDate from "./modules/stringToDate.js";

//FriendsList
const dummyDate0 = [
  {
    firstName: "Tim",
    lastName: "Patrick",
    date: "2025-07-30",
    username: "timBim",
  },
  {
    firstName: "Tim",
    lastName: "Patrick",
    date: "2025-07-30",
    username: "timBim",
  },
  {
    firstName: null,
    lastName: "Patrick",
    date: "2025-07-30",
    username: "timBim",
  },
  {
    lastName: "Patrick",
    date: "2025-07-30",
    username: "timBim",
  },
  {
    lastName: "",
    date: "2025-07-30",
    username: "timBim",
  },
];

//Friend Requests
const dummyData1 = [
  {
    firstName: "Tim",
    lastName: "Patrick",
    date: "2025-07-30",
    username: "timBim",
    source: "incoming",
  },
  {
    firstName: "Tim",
    lastName: "Patrick",
    date: "2025-07-30",
    username: "timBim",
    source: "incoming",
  },
  {
    firstName: null,
    lastName: "Patrick",
    date: "2025-07-30",
    username: "timBim",
    source: "outgoing",
  },
];

createHeader();
init();
const pageSelectorHolder = document.querySelector(".page-buttons");
createPageSelector(20, pageSelectorHolder);
setPageClick(onPageSelect);

function init() {
  //TODO: Check if logged in

  const cardHolder = document.querySelector(".content");

  //TODO: Backend Call

  const data = dummyData1;
  data.forEach((elem) => {
    const a = createFriendCard(elem);
    cardHolder.appendChild(a);
  });
}

function createFriendCard(friendData) {
  const friendCard = document.createElement("div");
  friendCard.classList.add(...["friend-card", "card"]);

  const { username } = friendData;
  const link = "index.html?username=" + username; //TODO: place holder url

  //Account for if the first and/or last names are NULL
  const fName = !friendData.firstName ? "" : friendData.firstName;
  const lName = !friendData.lastName ? "" : friendData.lastName;

  let fullName, style, title;
  if (!fName && !lName) {
    style = 'style="color:transparent"';
    fullName = "a";
    title = "";
  } else {
    style = "";
    fullName = fName + " " + lName;
    title = fullName;
  }

  //Format the date from supabase's YYYY-MM-DD to American MM-DD-YYYY
  //https://stackoverflow.com/questions/3552461/how-do-i-format-a-date-in-javascript
  const date = stringToDate(friendData.date);
  const convertedDate = date.toLocaleDateString("en-US");

  friendCard.innerHTML = `
  <a href="${link}">
    <p class="fc-name" ${style} title="${title}">${fullName.trim()}</p>
    <p class="fc-username" title="${username}">@${username}</p>
    <p>Friend Since: ${convertedDate}</p>
  </a>
  <div></div>`;

  //Friend Request Specific-code
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

  return friendCard;
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

function onPageSelect(pageNum) {
  //TODO
  console.log("Selecting Pg " + pageNum);
}
//#endregion
