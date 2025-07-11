/*
OWASP JWT for Java
Create a cookie in order to circumvent token sidejacking
ctxString - The non-hashed version of the 'ctx' w/i the access token
*/
function createCtxCookie(res, ctxString) {
  const maxAge = 360000;
  //TODO: Set maxAge to that of access_expiery

  res.cookie("ctx", ctxString, {
    maxAge: maxAge,
    path: "/",
    sameSite: process.env.PRODUCTION_BUILD === "false" ? "lax" : "strict",
    secure: true,
    domain: "localhost",
    httpOnly: true,
  });
  /*
  res.set({
    "Access-Control-Allow-Origin": req.headers.origin,
    "Access-Control-Allow-Credentials": true,
  });
  */
  res.set(
    "Access-Control-Expose-Headers",
    "date, etag, access-control-allow-origin, access-control-allow-credentials"
  );
}

//TODO: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-sidejacking:~:text=Age%2C%20and-,cookie%20prefixes,-).%20Avoid%20setting%20the
//Cookie preferences

module.exports = createCtxCookie;
