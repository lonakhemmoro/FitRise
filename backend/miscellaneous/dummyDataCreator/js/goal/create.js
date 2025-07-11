import { createNav } from "../exports/header.js";
import { serverPort } from "../exports/serverport.js";

const goalHolder = document.getElementById("goal-holder");
const createButton = document.getElementById("new-goal-button");

const nav = document.getElementById("header-space");
createNav(nav);
createNewGoal(); //init

function createNewGoal() {
  const a = `
    <div class="goal">
        <label for="start">Goal Start Date:</label>
        <input type="date" id="start" />
        <div>
          <span>Goal End Date:</span>
          <span class="goal-end-date">03/12/19</span>
        </div>

        <label for="goal-value">Goal Value:</label>
        <input type="number" id="goal-value" />
        <label for="goal-status">Goal Status:</label>
        <select name="goal-status" id="goal-status">
        <option value="active">Active</option>
        <option value="fail">Failed</option>
        <option value="complete">Complete</option>
        </select>

        <div class="daily">
          <span>Day 1: </span> <span> Same day as goal date</span>
          <br />
          <label for="value">DailyActivity value: </label
          ><input type="number" id="value" />
        </div>
        <div class="daily">
          <span>Day 2: </span> <span> Same day as goal date</span>
          <br />
          <label for="value">DailyActivity value: </label
          ><input type="number" id="value" />
        </div>
        <div class="daily">
          <span>Day 3: </span> <span> Same day as goal date</span>
          <br />
          <label for="value">DailyActivity value: </label
          ><input type="number" id="value" />
        </div>
        <div class="daily">
          <span>Day 4: </span> <span> Same day as goal date</span>
          <br />
          <label for="value">DailyActivity value: </label
          ><input type="number" id="value" />
        </div>
        <button onclick="deleteGoal(evnt)">Delete goal</button>
        <hr />
      </div>
      `;

  const newHTML = elementFromHTML(a);

  newHTML.querySelector("button").onclick = (evnt) => deleteGoal(evnt);
  const dateInput = newHTML.querySelector("input");
  dateInput.onchange = (evnt) => onDateChange(evnt);

  goalHolder.append(newHTML);
  //goalHolder.innerHTML += a;
  //reConfigure();
}

function elementFromHTML(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function deleteGoal(evnt) {
  evnt.target.parentElement.remove();
}

function onDateChange(evnt) {
  //console.log("L");
  //console.log(evnt.target.parentElement);

  const newDateValue = evnt.target.value;

  const goalDiv = evnt.target.parentElement;
  const dailies = goalDiv.querySelectorAll(".daily");

  const endDate = new Date(newDateValue);
  const goalLength = 4;
  endDate.setDate(endDate.getDate() + 1 + goalLength);
  goalDiv.querySelectorAll(".goal-end-date")[0].innerHTML = endDate.toString();

  for (let index = 0; index < dailies.length; index++) {
    const span = dailies[index].querySelectorAll("span")[1];
    const date = new Date(newDateValue);
    date.setDate(date.getDate() + 1 + 1 * index);
    span.innerHTML = date.toDateString();
  }
}

createButton.onclick = () => {
  createNewGoal();
};

const finalizeButton = document.getElementById("send-server");
finalizeButton.onclick = () => finalize();
function finalize() {
  const arr = goalHolder.querySelectorAll(".goal");

  /*
 Element strucutre of gigaArr
 { goal: {date, value, status}, daily: [{date, value}, {date, value}]  }
 */
  const gigaArr = [];

  arr.forEach((element) => {
    const dateInput = element.querySelector("input");

    if (dateInput.value !== "") {
      let goalObj = {
        date: dateInput.value,
        value: parseInt(element.querySelector("#goal-value").value),
        status: element.querySelector("#goal-status").value,
      };

      let dailyArr = [];

      const dailies = element.querySelectorAll(".daily");
      let i = 0;
      dailies.forEach((element) => {
        const date = new Date(dateInput.value);
        date.setDate(date.getDate() + 1 + 1 * i);
        const string =
          date.getFullYear() +
          "-" +
          (date.getMonth() + 1) +
          "-" +
          date.getDate();
        i++;

        const value = element.querySelector("input").value;
        if (value !== "") {
          const obj = { date: string, value: value };
          dailyArr.push(obj);
        }
      });
      gigaArr.push({ goal: goalObj, daily: dailyArr });
    }
  });
  console.log(gigaArr);

  const userID = document.querySelector("input#user").value;
  const goalTypeID = document.querySelector("select#goal-id").value;

  //TODO: Send to server

  fetch(`http://localhost:${serverPort}/debug/dailyactivity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goalArr: gigaArr,
      userID,
      goalTypeID,
    }),
  }).then((res) => {
    if (res.status === 400) {
      setStatusSpace("UserID must be set");
    } else if (res.status === 201) {
      setStatusSpace("Successfully created");
    } else if (res.status === 500) {
      setStatusSpace("Error occured with creating one or more goals");
    }
  });
  /*
    .then((res) => {
      if (res.status !== 201) {
        throw "";
        return;
      }
      return res.json();
    })
    .then((res) => {
      localStorage.setItem("accessToken", res.accessToken);
      localStorage.setItem("refreshToken", res.refreshToken);
    })
    .catch((err) => console.log("Reauthentication failed"));
    */
}

function setStatusSpace(str) {
  document.querySelector("#status-space").innerHTML = `<p>${str}</p>`;
}
