const CustomError = require("../utils/customError");

/*A function that exists so my error checking of database queries can be one-line instead of 4*/
/**
 * Designed for error checking database queries
 * @param {CustomError} requestResult The pool request
 * @param {*} next The Express next() function from the endpoint parameters
 * @returns {Boolean} True if there was an error. False otherwise
 */
function onPoolFailed(requestResult, next) {
  if (requestResult.status) {
    //console.log("wow");
    next(requestResult);
    return true;
  }
  return false;
}

module.exports = onPoolFailed;
