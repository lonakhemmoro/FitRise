const jwt = require("jsonwebtoken");
const { ACCESS_EXPIRE } = require("../constants");

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_EXPIRE,
  });
}

module.exports = generateAccessToken;
