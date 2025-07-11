const { randomBytes, createHash } = require("crypto");

/**
 * @returns "{randomString, hashedString }
 */
function createRandomString() {
  const randomString = randomBytes(64).toString("hex");
  const hashedString = createHash("sha512").update(randomString).digest("hex");
  return { randomString, hashedString };
}

module.exports = createRandomString;
