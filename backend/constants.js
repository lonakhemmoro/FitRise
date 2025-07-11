const { randomBytes, createHash } = require("crypto");

/*
const CIPHER_KEY = randomBytes(32);
const CIPHER_IV = randomBytes(16);
*/
const CIPHER_KEY = randomBytes(32).toString("hex").substring(0, 32);
const CIPHER_IV = randomBytes(16).toString("hex").substring(0, 16);
//TODO: Put in .env

const ACCESS_EXPIRE = "90sec";
const REFRESH_EXPIRE = "60sec";

module.exports = { CIPHER_KEY, CIPHER_IV, ACCESS_EXPIRE, REFRESH_EXPIRE };
