const jwt = require("jsonwebtoken");
const { pool } = require("../dbPool");
const generateRefreshToken = require("./generateRefreshToken");
const createRandomString = require("./createRandomString");
const generateAccessToken = require("./generateAccessToken");
const encryptToken = require("./encryptToken");
const createCtxCookie = require("./createCtxCookie");
const createRefreshCookie = require("./createRefreshCookie");
/**
 * Handles refresh token rotation and reuse detection
 * @param {*} req
 * @param {*} accessUserID
 * @returns bool. True if the token could be refreshed, false if not
 */
async function autoRefreshToken(res, req, accessUserID) {
  if (!req.cookies.tr) {
    //console.log("No Cookies");
    return false;
  }

  const refreshToken = req.cookies.tr;

  //Step 0: Check if the accessToken and refreshToken IDs are the same
  const oldRefreshDecoded = jwt.decode(refreshToken);

  if (!oldRefreshDecoded.sID) {
    return false;
  }

  if (accessUserID !== oldRefreshDecoded.id) {
    //Compromise detected
    deleteAll(oldRefreshDecoded.id, oldRefreshDecoded.sID);
    console.log("Not the same User");
    return false;
  }

  let returnBool = false;
  //The function returns undefined if the return occurs inside the jwt.verify
  //So we'll return returnBool instead

  //Step 1: Verify that it's valid
  await jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          const decodedUser = jwt.decode(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
          );
          //Check if the token is in past refresh
          await pool
            .query(
              `SELECT token FROM past_refresh
              WHERE userID = ? AND sessionNum = ? AND token = ?`,
              [decodedUser.id, decodedUser.sID, refreshToken]
            )
            .then((rows) => rows[0])
            .then((rows) => {
              //if token is in past_refresh, user is compromised
              if (rows.length > 0) {
                console.log("In Past_Refresh Detected (Expired)");
                deleteAll(decodedUser.id, decodedUser.sID);
              }
            })
            .catch((err) => console.log(err));
        }
        returnBool = false;
        return;
      }

      console.log("A1");

      //Check if it's in active or past refresh
      const results = await pool
        .query(
          `
            SELECT token, "Active" as "which" FROM active_refresh
            WHERE userID = ? AND sessionNum = ? AND token = ?
            UNION
            SELECT token, "Past" FROM past_refresh
            WHERE userID = ? AND sessionNum = ? AND token = ?
            `,
          [
            decoded.id,
            decoded.sID,
            refreshToken,
            decoded.id,
            decoded.sID,
            refreshToken,
          ]
        )
        .then((rows) => rows[0])
        .catch((err) => {
          console.log(err);
          return false;
        });

      if (!results) {
        returnBool = false;
        return;
      }

      let inPast = false,
        inActive = false;

      results.forEach((element) => {
        if (element.which === "Active") {
          inActive = true;
        } else if (element.which === "Past") {
          inPast = true;
        }
      });

      if (inPast) {
        console.log("In Past_Refresh (Valid)");
        deleteAll(decoded.id, decoded.sID);
        returnBool = false;
        return;
      }

      if (!inActive) {
        returnBool = false;
        return;
      }

      //At this point, it's a valid refresh token by a legitimate user
      //Archive the current refreshToken
      pool
        .query(
          `
          INSERT INTO past_refresh
          VALUES (?, ?, ?)
          `,
          [decoded.id, refreshToken, decoded.sID]
        )
        .catch((err) => console.log(err));

      //Create new user object for use in token generation
      const { id, email, username, sID } = decoded;

      //Generate new accessToken
      const ctx = createRandomString();
      let accessToken = generateAccessToken({
        id,
        email,
        username,
        sID,
        ctx: ctx.hashedString,
      });
      accessToken = encryptToken(accessToken);
      req.accessToken = accessToken;

      //Generate refresh token
      //FIXME: decide how the refresh user object should be
      const newRefreshToken = generateRefreshToken({
        id,
        email,
        username,
        sID,
      });

      //create req.user for use in the following request
      req.user = { id, email, username };

      //Store the new tokens in the db
      //TODO: Change the expiry date to the actual expiry date
      pool
        .query(
          `
          UPDATE active_refresh
          SET token = ?, expiresAt = NOW()
          WHERE userID = ? AND sessionNum = ?
          `,
          [newRefreshToken, decoded.id, decoded.sID]
        )
        .catch((err) => console.log(err));

      //Create cookies
      createCtxCookie(res, ctx.randomString);
      createRefreshCookie(res, newRefreshToken);

      returnBool = true;
      return;
    }
  );
  return returnBool;
}

function deleteAll(userID, sessionNum) {
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

module.exports = autoRefreshToken;
