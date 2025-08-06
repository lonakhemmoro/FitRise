document.addEventListener("DOMContentLoaded", function () {
  // Load header
  fetch("header.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("header-placeholder").innerHTML = data;

      // Now that header is loaded, attach the nav toggle event
      const navToggle = document.getElementById("navToggle");
      const mainNav = document.getElementById("mainNav");
      if (navToggle && mainNav) {
        navToggle.addEventListener("click", function () {
          mainNav.classList.toggle("open");
        });
      }
    });
});

const getStartedBtn = document.querySelector(".hero button");
const pointsDisplay = document.getElementById("points");
const badgesDisplay = document.getElementById("badges");
const streakDisplay = document.getElementById("streak");
const messageDisplay = document.getElementById("message");

// Set initial values
let points = parseInt(localStorage.getItem("points")) || 1200;
let badges = parseInt(localStorage.getItem("badges")) || 4;
let streak = parseInt(localStorage.getItem("streak")) || 3;

// Define badge unlock thresholds
const badgeThresholds = [1500, 2000, 3000, 5000];

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill in both fields.");
    return;
  }

  localStorage.setItem("loggedIn", "true");
  // Redirect after successful login
  window.location.href = "index.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Add points and update dashboard
function getStarted_old() {
  points += 100;
  pointsDisplay.textContent = `Points: ${points}`;
  localStorage.setItem("points", points);
  // Badge logic
  if (badgeThresholds.includes(points)) {
    badges++;
    badgesDisplay.textContent = `Badges: ${badges}`;
    localStorage.setItem("badges", badges);
    messageDisplay.textContent = `🎉 Congrats! You unlocked a new badge!`;
  } else {
    messageDisplay.textContent = `You've earned 100 points!`;
  }

  // Streak update
  streak++;
  streakDisplay.textContent = `Streak: ${streak} Days`;
  localStorage.setItem("streak", streak);
}

function getStarted() {
  window.location.href = "signUp.html";
}
