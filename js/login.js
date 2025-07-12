function init() {
  //TODO: Call backend to see if the user is already logged-in
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  //Validate email
  const regexp = /\w*@\w*\.\w+/;
  if (!regexp.test(email)) {
    alert("Please put in an email address");
    return;
  }

  //TODO: Call the backend to login
  //localStorage.setItem("accessToken", accessToken)

  localStorage.setItem("loggedIn", "true");
  // Redirect after successful login
  window.location.href = "index.html";
}
