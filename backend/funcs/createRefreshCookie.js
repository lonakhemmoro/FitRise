const { REFRESH_EXPIRE } = require("../constants");

function createRefreshCookie(res, token) {
  const maxAge = 360000;

  res.cookie("tr", token, {
    maxAge: maxAge,
    path: "/",
    //sameSite: "None",
    sameSite: "lax",
    secure: true,
    //domain: "127.0.0.1", Doesn't work with insomnia, as well as browser(?)
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

module.exports = createRefreshCookie;
