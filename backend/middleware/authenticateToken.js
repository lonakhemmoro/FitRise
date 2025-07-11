const jwt = require("jsonwebtoken");
const autoRefreshToken = require("../funcs/autoRefreshToken");
const decryptToken = require("../funcs/decryptToken");
const { createHash } = require("crypto");

//TODO: turn this back on
/*
async function authenticateToken(req, res, next) {
  if (!req.cookies || !req.cookies.ctx) {
    return res.sendStatus(401);
  }

  const authHeader = req.headers["authorization"];
  //The && means if we've an authHeader then split it, otherwise return undefined
  let token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  //console.log(token);
  token = decryptToken(token);

  //compare the ctx in the token
  const tokenDecoded = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET);
  const hash = createHash("sha512").update(req.cookies.ctx).digest("hex");
  if (hash !== tokenDecoded.ctx) {
    console.log("00");
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("HOW");
        const accessUserID = jwt.decode(token).id;

        const refreshResult = await autoRefreshToken(res, req, accessUserID);
        console.log("RefreshSuccessful?: ", refreshResult);

        if (!refreshResult) {
          return res.sendStatus(401);
        }
      } else {
        return res.sendStatus(401);
      }
    }

    req.user = decoded;
    next();
  });
}
*/

//Doesn't do any validation. Doesn't even check if it's expired
//Just gives authenticates you
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  //The && means if we've an authHeader then split it, otherwise return undefined
  let token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  const { id, email, username, sID } = jwt.decode(
    token,
    process.env.ACCESS_TOKEN_SECRET
  );
  req.user = { id, email, username, sID };
  next();
}

module.exports = authenticateToken;
