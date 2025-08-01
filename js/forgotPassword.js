import displayErrTag from "./modules/feedback/displayErrTag.js";
import displayErrBorder from "./modules/feedback/displayErrBorder.js";
import removeAllErrDisplays from "./modules/feedback/removeAllErrDisplays.js";
import createModal from "./modules/feedback/createModal.js";
import supabase from "./modules/supabase.js";

const resetPasswordBtn = document.querySelector(".container button");
resetPasswordBtn.onclick = (evnt) => resetPassword(evnt);

const redirectString = "newPassword.html";
//TODO: Change string to the github pages version whenever we get that made

async function resetPassword(evnt) {
  evnt.preventDefault();

  const emailInput = document.getElementById("email");
  const email = emailInput.value.trim();
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

  //Backend
  resetPasswordBtn.disabed = true;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectString,
  });

  console.log(data);
  if (error) {
    console.log(error);
    console.log(error.code);
    createModal("Unexpected Error!! Please Try Again Later!", true);
  } else {
    createModal("Email sent! Please check your inbox!");
  }
  resetPasswordBtn.disabed = false;
}
