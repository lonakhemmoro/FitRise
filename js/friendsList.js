import createHeader from "./modules/createHeader.js";
import {
  createPageSelector,
  setPageClick,
} from "./modules/pageSelectRelated.js";
import stringToDate from "./modules/stringToDate.js";

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

createHeader();
init();
const pageSelectorHolder = document.querySelector(".page-buttons");
createPageSelector(20, pageSelectorHolder);
setPageClick(onPageSelect);

function init() {
  //TODO: Check if logged in

  const cardHolder = document.querySelector(".content");

  //TODO: Backend Call

  const data = dummyDate0;
  data.forEach((elem) => {
    const a = createFriendCard(elem, cardHolder);
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

  friendCard.innerHTML = `<a href="${link}">
    <p class="fc-name" ${style} title="${title}">${fullName.trim()}</p>
    <p class="fc-username" title="${username}">@${username}</p>
            <p>Friend Since: ${convertedDate}</p>
          </a>`;

  /* Template
  <div class="friend-card card">
    <a href="index.html">
      <p class="fc-name">FirstName LastName</p>
      <p class="fc-username">@username</p>
      <p>Friend Since: 05-20-2002</p>
    </a>
  </div>
  */

  return friendCard;
}

//#region Page Select

function onPageSelect(pageNum) {
  //TODO
  console.log("Selecting Pg " + pageNum);
}
//#endregion
