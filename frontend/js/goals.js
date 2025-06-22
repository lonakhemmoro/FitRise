document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;
  
    // 🏃 Steps Page
    if (path.includes("steps.html")) {
      let steps = parseInt(localStorage.getItem("steps")) || 0;
      document.getElementById("stepsCount").textContent = steps;
    }
  
    // 💧 Water Page
    if (path.includes("water.html")) {
      let water = parseInt(localStorage.getItem("water"));
      document.getElementById("waterCount").textContent = water;
    }
  
    // 💤 Sleep Page
    if (path.includes("sleep.html")) {
      let sleep = parseFloat(localStorage.getItem("sleep"));
      document.getElementById("sleepCount").textContent = sleep;
    }
  });

function updateSteps() {
    let steps = parseInt(localStorage.getItem("steps")) || 0;
    steps += 500;
    localStorage.setItem("steps", steps);
    document.getElementById("stepsCount").textContent = steps;
    alert(`Steps updated to ${steps}`);
}

function updateWater() {
    let water = parseInt(localStorage.getItem("water")) || 0;
    water += 1;
    localStorage.setItem("water", water);
    document.getElementById("waterCount").textContent = water;
    alert(`Water intake updated to ${water} cups`);
}

function updateSleep() {
    let sleep = parseFloat(localStorage.getItem("sleep")) || 0;
    sleep += 0.5;
    localStorage.setItem("sleep", sleep);
    alert(`Sleep updated to ${sleep} hours`);
    document.getElementById("sleepCount").textContent = sleep;
}
  
  