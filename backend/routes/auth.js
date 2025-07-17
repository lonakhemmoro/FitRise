const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const authenticateToken = require("../middleware/authenticateToken");
const { pool } = require("../dbPool");
const createRandomString = require("../funcs/createRandomString");
const createCtxCookie = require("../funcs/createCtxCookie");
const encryptToken = require("../funcs/encryptToken");
const generateAccessToken = require("../funcs/generateAccessToken");
const generateRefreshToken = require("../funcs/generateRefreshToken");
const decryptToken = require("../funcs/decryptToken");
const createRefreshCookie = require("../funcs/createRefreshCookie");
const CustomError = require("../utils/customError");
const onPoolFailed = require("../funcs/onPoolFailed");

router.post("/login", async (req, res, next) => {
  if (!req.body || !req.body.email || !req.body.password) {
    next(new CustomError(400, "Missing body fields", ""));
    return;
  }
  const { email, password } = req.body;

  const results = await pool
    .query("SELECT id, username, password FROM users WHERE email = ?", [email])
    .then((rows) => rows[0])
    .catch((err) => new CustomError(500, "", "", err));
  if (onPoolFailed(results, next)) return;
  if (results.length === 0) {
    next(new CustomError(404, "User not found", ""));
    return;
  }

  //TODO: bcrypt hash the password
  if (password !== results[0].password) {
    next(new CustomError(404, "User not found", ""));
    return;
  }

  //----Create the access token
  const ctx = createRandomString();
  const user = {
    id: results[0].id,
    email: results[0].email,
    username: results[0].username,
    ctx: ctx.hashedString,
  };

  //TODO: Turn on expiresIn. USE THE GENREATEACCESSTOKEN FUNCTION
  let accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //expiresIn: "15min",
  });
  //accessToken = encryptToken(accessToken);

  /*
  //----Create Refresh Token
   const count = await pool
    .query(`SELECT COUNT(*) as 'n' FROM active_refresh WHERE userID = ?`, [
      user.id,
    ])
    .then((results) => results[0][0].n)
    .catch((err) => res.sendStatus(500));

  if (count.status === 500) {
    return;
  }
  
  //TODO: look up refresh token expiry time. USE THE GENREATEREFRESHTOKEN FUNCTION
  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    username: user.username,
    sID: count + 1
  });

  pool
    .query(
      `INSERT INTO active_refresh
      VALUES (?, ?, NOW(), ?)`,
      [user.id, refreshToken, count + 1]
    )
    .catch((err) => {
      console.log(err);
    });

  //----Create Cookies
  createRefreshCookie(res, refreshToken);
  createCtxCookie(res, ctx.randomString);
  */

  res.status(200).send({ accessToken: accessToken });
});

router.post("/logout", authenticateToken, (req, res, next) => {
  //TODO: Actually logout the user

  res.cookie("tr", "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: true,
    domain: "localhost",
    httpOnly: true,
  });
  res.set(
    "Access-Control-Expose-Headers",
    "date, etag, access-control-allow-origin, access-control-allow-credentials"
  );

  res.sendStatus(200);

  if (req.cookies && req.cookies.tr) {
    let userID, sessionNum;
    let errBool = false;

    jwt.verify(
      req.cookies.tr,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          errBool = true;
          return;
        }

        userID = decoded.id;
        sessionNum = decoded.sID;
      }
    );

    if (errBool) return;

    pool
      .query("DELETE FROM active_refresh WHERE userID = ? AND sessionNum = ?", [
        userID,
        sessionNum,
      ])
      .catch((err) => console.log(err));

    pool
      .query("DELETE FROM past_refresh WHERE userID = ? AND sessionNum = ?", [
        userID,
        sessionNum,
      ])
      .catch((err) => console.log(err));
  }
});

router.get("/test", authenticateToken, (req, res, next) => {
  res.send({ msg: "nandemo-nai", accessToken: req.accessToken });
});
//#region Debug

//Give an access token that DOES NOT expire
router.get("/debug/a", (req, res) => {
  const user = {
    id: 1,
    email: "a@gmail.com",
    username: "somethingUsername",
  };

  let accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {});
  res.status(200).send({ accessToken });
});

//Give a
router.get("/a/:num", (req, res) => {
  const { num } = req.params;
  const parseNum = parseInt(num);

  const ctx = createRandomString();
  const user = {
    id: 1,
    email: "a@gmail.com",
    username: "somethingUsername",
    ctx: ctx.hashedString,
  };

  let accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: parseNum === 1 ? "1sec" : "120sec",
  });
  console.log(accessToken);
  accessToken = encryptToken(accessToken);

  createCtxCookie(res, ctx.randomString);

  res.status(200).send({ accessToken });
});

router.get("/v/:num", async (req, res) => {
  const { num } = req.params;
  console.log(num);

  const parseNum = parseInt(num);

  const userID = parseNum === 1 || parseNum === 4 ? 1 : 2;
  const count = await pool
    .query(`SELECT COUNT(*) as 'n' FROM active_refresh WHERE userID = ?`, [
      userID,
    ])
    .then((results) => results[0][0].n);
  //If it crashes, so be it

  let user;
  if (parseNum === 1 || parseNum === 4) {
    user = {
      id: 1,
      email: "a@gmail.com",
      username: "somethingUserName",
      sID: count + 1,
    };
  } else {
    user = {
      id: 2,
      email: "b@gmail.com",
      username: "somethingUserName2",
      sID: count + 1,
    };
  }

  let time;
  switch (parseNum) {
    case 1:
      time = "120";
      break;
    case 2:
      time = "120";
      break;
    case 3:
      time = "1";
      break;
    case 4:
      time = "1";
      break;
  }

  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: time + "sec",
  });

  /*
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    console.log(decoded);
  });
  */

  pushToDB(res, refreshToken, user.id);
});

function customRefresh(res, token, maxAge) {
  res.cookie("tr", token, {
    maxAge: maxAge,
    path: "/",
    sameSite: "lax",
    secure: true,
    domain: "localhost",
    httpOnly: true,
  });
  res.set(
    "Access-Control-Expose-Headers",
    "date, etag, access-control-allow-origin, access-control-allow-credentials"
  );
}

async function pushToDB(res, refreshToken, userID) {
  const count = await pool
    .query(`SELECT COUNT(*) as 'n' FROM active_refresh WHERE userID = ?`, [
      userID,
    ])
    .then((results) => results[0][0].n)
    .catch((err) => res.sendStatus(500));

  if (count.status === 500) {
    return;
  }

  pool
    .query(
      `INSERT INTO active_refresh
      VALUES (?, ?, NOW(), ?)`,
      [userID, refreshToken, count + 1]
    )
    .then(() => {
      customRefresh(res, refreshToken, 60000 * 60);

      res.sendStatus(200);
    })
    .catch((err) => {
      console.log(err);
      return res.sendStatus(500);
    });
}

//#endregion

module.exports = router;
