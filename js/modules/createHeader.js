/**
 * Load the header and place it at the beginning of the page
 */
async function createHeader() {
  const body = document.querySelector("body");
  const bodyFirstChild = body.firstElementChild;
  const headerNode = document.createElement("div");
  headerNode.id = "header-placeholder";

  try {
    await fetch("header.html")
      .then((response) => response.text())
      .then((data) => {
        headerNode.innerHTML = data;
      })
      .catch((err) => {
        throw err;
      });

    const btn = headerNode.querySelector("button");
    btn.onclick = () => logout();
  } catch (err) {
    console.log("Header loading error");
    console.log(err);
    return;
  }

  if (bodyFirstChild) {
    body.insertBefore(headerNode, bodyFirstChild);
  } else {
    body.innerHTML += headerNode;
  }
}

async function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

export default createHeader;
