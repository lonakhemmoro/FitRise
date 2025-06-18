function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Please fill in both fields.');
    return;
  }

  // Redirect after successful login
  window.location.href = "index.html";
}
//main javascript file for the web application
