/**
 * A custom fetch that reauthenticates and stores the JWT if it was expired.
 * @param {*} req Request object
 * @returns The fetch response (not in JSON, but as it was sent back from the server)
 */
export async function customFetch(req) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    throw "no accessToken";
  }
  if (typeof accessToken !== "string") {
    throw "accessToken not a string";
  }

  if (!req.headers.get("authorization")) {
    req.headers.append("authorization", "Bearer " + accessToken);
  }

  const newReq = new Request(req.url, {
    method: req.method,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + accessToken,
    },
    credentials: "include",
    body: req.body,
  });

  console.log(await newReq.body.json());

  //Try an initial request
  const request = await fetch(newReq).catch((err) => {
    throw "FetchFailed";
    //'Failed' as in the server is offline, not failed like 403 failed
  });

  //Check if we've a new access token, and store it if so
  let newToken = request.clone();
  newToken = await newToken.json();
  if (newToken.accessToken) {
    accessToken = newToken.accessToken;
  }

  return request;
}
