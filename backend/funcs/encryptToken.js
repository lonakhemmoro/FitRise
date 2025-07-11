const { createCipheriv } = require("crypto");
const { CIPHER_KEY, CIPHER_IV } = require("../constants.js");

function encryptToken(token) {
  const msg = token;

  const cipher = createCipheriv("aes-256-cbc", CIPHER_KEY, CIPHER_IV);
  return cipher.update(msg, "utf-8", "hex") + cipher.final("hex");
}

module.exports = encryptToken;
