const jwt = require("jsonwebtoken");
const { REFRESH_EXPIRE } = require("../constants");

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRE,
  });
}

module.exports = generateRefreshToken;
