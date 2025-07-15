const express = require("express");
const router = express.Router();
const { pool } = require("../dbPool");
const CustomError = require("../utils/customError");

//#region /
router.post("/", async (req, res, next) => {
  if (!req.body) {
    const err = new CustomError(400, "Missing request body", "");
    next(err);
    return;
  }

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
    const err = new CustomError(400, "Missing required fields", "");
    next(err);
    return;
  }

  let errorFields = registrationValidation(
    email,
    password,
    birthdate,
    height,
    weight
  );

  if (errorFields.length === 0 || errorFields[0].field !== "email") {
    const emailResults = await pool
      .query("SELECT email FROM users WHERE email = ?", [email])
      .then((rows) => rows[0])
      .catch((err) => new CustomError(500, "", "", err));

    if (emailResults.status) {
      next(emailResults);
      return;
    }

    if (emailResults.length > 0) {
      errorFields.push({ field: "email", details: "email_conflict" });
    }
  }

  //Username validation

  if (username.indexOf(" ") === -1 && username.length > 0) {
    const usernameResults = await pool
      .query("SELECT username FROM users WHERE username = ?", [username])
      .then((rows) => rows[0])
      .catch((err) => new CustomError(500, "", "", err));
    if (usernameResults.status) {
      next(usernameResults);
      return;
    }

    if (usernameResults.length > 0) {
      errorFields.push({ field: "username", details: "username_conflict" });
    }
  } else {
    errorFields.push({ field: "username", details: "username_invalid" });
  }

  //Send errors
  if (errorFields.length > 0) {
    const err = new CustomError(400, "Field errors", "");
    err.setErrors(errorFields);
    next(err);
    return;
  }

  //Register the user

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
    .catch((err) => new CustomError(500, "", "", err));
  if (register.status === 500) {
    next(err);
    return;
  }

  return res.sendStatus(201);
});

/**
 * @param {*} email
 * @param {*} password
 * @param {*} birthdate
 * @param {*} height
 * @param {*} weight
 * @returns {Array} An array of error fields and details
 */
function registrationValidation(email, password, birthdate, height, weight) {
  let arr = [];

  const regexp = /\w*@\w*\.\w+/;
  if (email.indexOf(" ") != -1 || !regexp.test(email)) {
    arr.push({ field: "email", details: "email_invalid" });
  }

  if (password.trim().length < 8) {
    arr.push({ field: "password", details: "password_length_below_8" });
  }

  let testBirthdate = new Date(birthdate);
  if (!testBirthdate instanceof Date || isNaN(testBirthdate.valueOf())) {
    arr.push({ field: "birthdate", details: "date_invalid " });
  }

  if (Number.isNaN(weight) || weight < 0) {
    arr.push({ field: "weight", details: "number_invalid" });
  }
  if (Number.isNaN(height) || height < 0) {
    arr.push({ field: "height", details: "number_invalid" });
  }

  return arr;
}

module.exports = router;
