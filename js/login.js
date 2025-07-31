import displayErrTag from "./modules/feedback/displayErrTag.js";
import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import removeAllErrDisplays from "./modules/feedback/removeAllErrDisplays.js";
import createModal from "./modules/feedback/createModal.js";
import supabase from "./modules/supabase.js";

const loginButton = document.querySelector(".container button");
loginButton.onclick = (evnt) => login(evnt);

init();
async function init() {
  //TODO: Check if the user is already logged-in. If so, redirect them
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

  //Call backend
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    if (error.code === "invalid_credentials") {
      //Caused by wrong/no-account email or wrong password
      displayErrBorder(emailInput, true);
      displayErrBorder(passwordInput, true);
      displayErrTag(emailInput, "Incorrect email or password");
    } else {
      console.log(error.code);
      createModal("Unexpected Error!! Please Try Again Later!", true);
    }
    loginButton.disabled = false;
    return;
  } else if (!data.session || !data.user) {
    createModal("Unexpected Error!! Please Try Again Later!", true);
    alert("Alert to devs To check the backend logs");
    loginButton.disabled = false;
    return;
  }

  //Redirect on successful login
  localStorage.setItem("loggedIn", "true");
  window.location.href = "index.html";
}
