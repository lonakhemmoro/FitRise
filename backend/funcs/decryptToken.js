const { createDecipheriv } = require("crypto");
const { CIPHER_KEY, CIPHER_IV } = require("../constants.js");

function decryptToken(encryptedToken) {
  const decipher = createDecipheriv("aes-256-cbc", CIPHER_KEY, CIPHER_IV);
  return (
    decipher.update(encryptedToken, "hex", "utf-8") + decipher.final("utf-8")
  );
}

module.exports = decryptToken;
