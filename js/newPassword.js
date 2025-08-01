import displayErrTag from "./modules/feedback/displayErrTag.js";
import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import removeAllErrDisplays from "./modules/feedback/removeAllErrDisplays.js";
import createModal from "./modules/feedback/createModal.js";
import supabase from "./modules/supabase.js";

const changePasswordBtn = document.querySelector(".container button");

init();
async function init() {
  const params = new URLSearchParams(window.location.hash.slice());

  //Check if the user's email link expired
  if (params.has("error_code", "otp_expired")) {
    document.querySelector(".login-box.reset-ps").innerHTML = `
    <p>Your password recovery link has expired. Please go to 
    <a href="login.html">Login</a>
     and select "Forgot Password" to create a new one.</p>
    `;
    return;
  }

  //Check if the user got here via email link or not
  //Checks if the user either typed in url, or clicked the email link and refreshed
  //Either way, give them feedback
  const keyCheckArr = [
    "#access_token",
    "expires_at",
    "expires_in",
    "refresh_token",
    "token_type",
    "type",
  ];

  let isValid = true;
  for (let i = 0; i < 6; i++) {
    if (!params.has(keyCheckArr[i])) {
      isValid = false;
      break;
    }
  }

  if (!isValid) {
    document.querySelector(".login-box.reset-ps").innerHTML = `
    <p>To change your password, please select "Forgot Password" on the 
    <a href="login.html">Login</a> page.
    <p>If you followed the email but refreshed the page, please select 
    "Forgot Password" on the <a href="login.html">Login</a> page as well.`;
  }

  //Give the button functionality after passing the checks
  changePasswordBtn.onclick = (evnt) => changePassword(evnt);
}

async function changePassword(evnt) {
  evnt.preventDefault();
  const passwordP = document.querySelector("#new-password + p");
  passwordP.classList.remove("err");
  removeAllErrDisplays();

  const newPasswordInput = document.getElementById("new-password");
  const newPassword = newPasswordInput.value;
  const confirmPasswordInput = document.getElementById("confirm-password");
  const confirmPassword = confirmPasswordInput.value;

  //Validate
  if (newPassword.length < 8) {
    displayErrBorder(newPasswordInput);
    displayErrBorder(passwordP);
    return;
  }
  if (confirmPassword !== newPassword) {
    displayErrBorder(confirmPasswordInput, true);
    displayErrTag(confirmPasswordInput, "Passwords do not match");
    return;
  }

  //Backend
  changePasswordBtn.disabled = true;
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    if ((error.code = "same_password")) {
      displayErrBorder(confirmPasswordInput, true);
      displayErrTag(
        confirmPasswordInput,
        "New password should not be the same as the old password"
      );
    } else {
      console.log(error);
      console.log(error.code);
      createModal("Unexpected Error!! Please Try Again Later!", true);
    }
    changePasswordBtn.disabled = false;
    return;
  } else if (!data.user) {
    createModal("Unexpected Error!! Please Try Again Later!", true);
    console.log("Alert to devs To check the backend logs");
    changePasswordBtn.disabled = false;
    return;
  }

  //Redirect on Success
  //Supabase auto logs you in on password reset
  localStorage.setItem("loggedIn", "true");
  window.location.href = "index.html";
}
