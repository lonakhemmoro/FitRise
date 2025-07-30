import createHeader from "./modules/createHeader.js";
import {
  createPageSelector,
  setPageClick,
} from "./modules/pageSelectRelated.js";

const searchBtn = document.querySelector("form button");
searchBtn.onclick = (evnt) => searchUsers(evnt);

const dummyData = [
  {
    firstName: "Tim",
    lastName: "Patrick",
    username: "timBim",
  },
  {
    firstName: "Timbo",
    lastName: "Patrick",
    username: "timBim",
  },
  {
    firstName: null,
    lastName: "Patrick",
    username: "timBim",
  },
  {
    lastName: "",
    username: "timBim",
  },
];

init();
function init() {
  //TODO: Check if logged in
  createHeader();
  createPageSelector(20, document.querySelector(".page-buttons"));
  setPageClick(onPageSelect);
}

function searchUsers(evnt) {
  evnt.preventDefault();
  const searchValue = document.querySelector("#search-form input").value;

  const cardHolder = document.querySelector(".content");
  cardHolder.innerHTML = "";
  //TODO: Backend Call

  const data = dummyData;
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

  friendCard.innerHTML = `
  <a href="${link}">
    <p class="fc-name" ${style} title="${title}">${fullName.trim()}</p>
    <p class="fc-username" title="${username}">@${username}</p>
  </a>
  `;

  return friendCard;
}

//#region Page Select

function onPageSelect(pageNum) {
  //TODO
  console.log("Selecting Pg " + pageNum);
}
//#endregion
