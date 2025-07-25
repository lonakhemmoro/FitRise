import displayErrBorder from "./displayErrBorder.js";

function removeAllErrDisplays() {
  document.querySelectorAll("p.err").forEach((element) => element.remove());

  const errTags = document.getElementsByClassName("err");
  Array.from(errTags).forEach((element) => {
    displayErrBorder(element, false);
  });
}

export default removeAllErrDisplays;
