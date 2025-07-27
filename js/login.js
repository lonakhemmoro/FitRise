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

  //TODO: Check if the user is already logged-in
  /*
    //Error handle
    //If server couldn't be reached
    createModal("Server could not be reached. Please try again later.", true);
    */
}

async function login(evnt) {
  evnt.preventDefault();

  const emailInput = document.getElementById("email");
  const email = emailInput.value.trim();
  const passwordInput = document.getElementById("password");
  const password = passwordInput.value;

  removeAllErrDisplays();

  //Validate email
  const regexp = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
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

  //TODO: Call new backend to login
  /*
   //loginButton.disabled = true;
  //Login Request

  //Error handle
  //if user doesn't exist or password wrong
  createModal("Wrong email or password", true);
  //If server couldn't be reached
  createModal("Server could not be reached. Please try again later.", true);

  // Redirect after successful login
  if (successfulLogin)
    localStorage.setItem("loggedIn", "true");
    window.location.href = "index.html";
    return;
  }
    */

  localStorage.setItem("loggedIn", "true");
  window.location.href = "index.html";
  loginButton.disabled = false;
}
