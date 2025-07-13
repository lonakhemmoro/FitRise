const express = require("express");
const router = express.Router();
const { pool } = require("../dbPool");
/*
const generateAccessToken = require("../funcs/generateAccessToken");
const generateRefreshToken = require("../funcs/generateRefreshToken");
const createRefreshCookie = require("../funcs/createRefreshCookie");
const createCtxCookie = require("../funcs/createCtxCookie");
*/

//#region /
router.post("/", async (req, res) => {
  if (!req.body) return res.sendStatus(400);

  const {
    email,
    password,
    username,
    firstName,
    lastName,
    birthdate,
    height,
    weight,
  } = req.body;

  if (!email || !password || !username || !birthdate || !height || !weight) {
    return res.sendStatus(400);
  }

  //Email validation
  const regexp = /\w*@\w*\.\w+/;
  if (email.indexOf(" ") != -1 || !regexp.test(email)) {
    return res.sendStatus(400);
  }

  const emailResults = await pool
    .query("SELECT email FROM users WHERE email = ?", [email])
    .then((rows) => rows[0])
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
  if (emailResults.status === 500) {
    return;
  }

  if (emailResults.length > 0) {
    return res.status(409).send({ err: { code: "EMAIL_CONFLICT" } });
  }

  //Username validation
  const usernameResults = await pool
    .query("SELECT username FROM users WHERE username = ?", [username])
    .then((rows) => rows[0])
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
  if (usernameResults.status === 500) {
    return;
  }

  if (usernameResults.length > 0) {
    return res.status(409).send({ err: { code: "USERNAME_CONFLICT" } });
  }

  let isValid = registrationValidation(password, birthdate, height, weight);
  if (!isValid) return res.sendStatus(400);

  //TODO: bcrypt hash the password

  const register = await pool
    .query(
      `
    INSERT INTO users
    VALUES (DEFAULT, ?, ?, ?, ?, NULL, ?, ?, NULL, 0, ?, ?)
    `,
      [
        email,
        password,
        username,
        birthdate,
        weight,
        height,
        firstName,
        lastName,
      ]
    )
    .catch((err) => {
      console.log(err);
      return res.sendStatus(500);
    });
  if (register.status === 500) return;

  return res.sendStatus(201);
});

/**
 * Validates registration-related fields and returns 400 an invalid is found
 * @returns (bool) false if any are invalid
 */
function registrationValidation(password, birthdate, height, weight) {
  if (password.trim().length < 8) {
    return false;
  }

  let testBirthdate = new Date(birthdate);
  if (!testBirthdate instanceof Date || isNaN(testBirthdate.valueOf())) {
    return false;
  }

  if (Number.isNaN(weight) || Number.isNaN(height)) return false;
  if (weight < 0 || height < 0) return false;

  return true;
}

function pee() {
  const str = "2025-05-32";
  const date = new Date(str);
  console.log(date);
}
pee();
/*
function clientValidate(
  email,
  password,
  username,
  firstName,
  lastName,
  height,
  weight,
  bdMonth,
  bdDays,
  bdYears
) {
  let isValid = true;
  //Email
  const regexp = /\w*@\w*\.\w+/;
  if (email.indexOf(" ") != -1 || !regexp.test(email)) {
    isValid = false;
    //console.log("email fail");
    displayErrBorder(emailInput);
    displayErrTag(emailInput, "Please provide a valid email");
  }

  //Password
  if (password.length < 8) {
    isValid = false;
    //console.log("password fail");
    displayErrBorder(passwordInput);
    displayErrBorder(passwordInput.nextElementSibling);
  }

  //Username
  if (username.indexOf(" ") != -1 || username.length === 0) {
    isValid = false;
    //console.log("username fail");
    displayErrBorder(usernameInput);
    displayErrTag(usernameInput, "Please provide a valid username");
  }

  //TODO: Firstname
  //TODO: Lastname

  //Height
  if (height <= 0 || Number.isNaN(height)) {
    isValid = false;
    const heightDiv = document.getElementById("height-section");
    let metricEnabled = heightDiv.children.lenght === 1;
    if (metricEnabled) {
      displayErrBorder(document.getElementById("height-cm"));
    } else {
      displayErrBorder(document.getElementById("height-feet"));
      displayErrBorder(document.getElementById("height-inch"));
    }
    displayErrTag(heightDiv.parentElement, "Please provide a valid height");
  }

  //Weight
  if (weight <= 0 || Number.isNaN(weight)) {
    isValid = false;

    displayErrBorder(weightInput);
    displayErrTag(
      document.getElementById("weight"),
      "Please provide a valid weight"
    );
  }

  //Birthday
  let bdErr = false;
  if (Number.isNaN(bdMonth)) {
    bdErr = true;
    let monthSelect = document.getElementById("bd-months");
    displayErrBorder(monthSelect);
  }
  if (Number.isNaN(bdDays)) {
    bdErr = true;
    let daySelect = document.getElementById("bd-days");
    displayErrBorder(daySelect);
  }
  if (Number.isNaN(bdYears)) {
    bdErr = true;
    let yearSelect = document.getElementById("bd-years");
    displayErrBorder(yearSelect);
  }
  if (bdErr) {
    isValid = false;

    displayErrTag(birthdateDiv, "Please provide a valid date");
  }

  return isValid;
}
  */

module.exports = router;
