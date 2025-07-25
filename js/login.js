import displayErrTag from "./modules/feedback/displayErrTag.js";
import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import removeAllErrDisplays from "./modules/feedback/removeAllErrDisplays.js";
import createModal from "./modules/feedback/createModal.js";
import createHeader from "./modules/createHeader.js";

const loginButton = document.querySelector("button");
loginButton.onclick = (evnt) => login(evnt);

init();
async function init() {
  createHeader();

  //Check if the user is already logged-in
  /*
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return;

  const requstOptions = new Request(BASE_URL + "/logged-in", {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + accessToken,
    },
    credentials: "include",
  });
  await fetch(requstOptions)
    .then((res) => res.json())
    .then((res) => {
      if (res) {
        window.location.href = "index.html";
      }
    })
    .catch((err) => {});
    */
}

async function login(evnt) {
  evnt.preventDefault();

  const emailInput = document.getElementById("email");
  const email = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("password");
  const password = document.getElementById("password").value;

  removeAllErrDisplays();

  //Validate email
  const regexp = /\w*@\w*\.\w+/;
  if (email.length === 0) {
    displayErrBorder(emailInput, true);
    displayErrTag(emailInput, "Please provide your email");
    return;
  } else if (email.indexOf(" ") != -1 || !regexp.test(email)) {
    displayErrBorder(emailInput, true);
    displayErrTag(emailInput, "Please provide a valid email");
    return;
  }

  //Validate password
  if (password.length === 0) {
    displayErrBorder(passwordInput, true);
    displayErrTag(passwordInput, "Please provide your password");
    return;
  }

  /* TODO: Turn back on
  //Login
  const requstOptions = new Request(BASE_URL + "/auth/login", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  loginButton.disabled = true;
  const request = await fetch(requstOptions).catch((err) => {
    displayErrModal("Server could not be reached. Please try again later.");
    return { status: undefined };
  });
  if (!request.status) {
    loginButton.disabled = false;
    return;
  }

  if (request.status === 404) {
    displayErrModal("User does not exist");
  } else if (request.status === 500) {
    displayErrModal("Internal server error. Please try again later.");
  } else if (request.status === 200) {
    const { accessToken } = await request.json();
    localStorage.setItem("accessToken", accessToken);

    // Redirect after successful login
    //localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
    return;
  }
    */

  localStorage.setItem("loggedIn", "true");
  window.location.href = "index.html";
  loginButton.disabled = false;
}
