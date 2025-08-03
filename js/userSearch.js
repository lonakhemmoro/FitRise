import createHeader from "./modules/createHeader.js";
import {
  createPageSelector,
  deletePageButtons,
  setPageClick,
} from "./modules/pageSelectRelated.js";
import supabase from "./modules/supabase.js";
import createModal from "./modules/feedback/createModal.js";

const contentHolder = document.querySelector(".content");

let searchValue = "";
const searchBtn = document.querySelector("form button");
searchBtn.onclick = (evnt) => newUserSearch(evnt);

createHeader();

async function newUserSearch(evnt) {
  evnt.preventDefault();

  contentHolder.classList.add("load");

  searchValue = document.querySelector("#search-form input").value.trim();
  if (searchValue === "") {
    contentHolder.innerHTML = "<p>No users found.</p>";
    contentHolder.classList.remove("load");
    deletePageButtons();
    return;
  }

  //Get any users whose name starts with the search string
  const { data, count, error } = await supabase
    .from("users")
    .select("id, username, first_name, last_name", {
      count: "exact",
      head: false,
    })
    .like("username", `${searchValue}%`)
    .range(0, 5);

  if (error) {
    contentHolder.classList.remove("load");
    deletePageButtons();
    onError(error);
    return;
  }

  if (count === 0) {
    contentHolder.innerHTML =
      "<p>No users found. Make sure the search has the correct casing.</p>";
    contentHolder.classList.remove("load");
    deletePageButtons();
    return;
  }

  createPageSelector(count, document.querySelector(".page-buttons"));
  setPageClick(onPageSelect);

  //Display contents to user
  contentHolder.innerHTML = "";
  data.forEach((element) => {
    const a = createUserCard(element);
    contentHolder.appendChild(a);
  });

  contentHolder.classList.remove("load");
}

function createUserCard(userData) {
  const friendCard = document.createElement("div");
  friendCard.classList.add(...["friend-card", "card"]);

  const { username, first_name, last_name } = userData;

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

  friendCard.innerHTML = `
  <a href="${link}">
    <p class="fc-name" ${style} title="${title}">${fullName.trim()}</p>
    <p class="fc-username" title="${username}">@${username}</p>
  </a>
  `;

  return friendCard;
}

async function onPageSelect(pageNum) {
  contentHolder.classList.add("load");

  const rangeMin = 6 * (pageNum - 1);
  const rangeMax = 6 * pageNum - 1;

  const { data, error } = await supabase
    .from("users")
    .select("id, username, first_name, last_name")
    .like("username", `${searchValue}%`)
    .range(rangeMin, rangeMax);

  if (error) {
    contentHolder.classList.remove("load");
    onError(error);
    return;
  }

  //Display contents to user
  contentHolder.innerHTML = "";
  data.forEach((element) => {
    const a = createUserCard(element);
    contentHolder.appendChild(a);
  });

  contentHolder.classList.remove("load");
}

function onError(err) {
  console.log(err);
  const str = "An error has occured. Please try again later.";
  contentHolder.innerHTML = `<p>${str}</p>`;
  createModal(str, true);
}
