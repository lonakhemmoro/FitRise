/**
 * Creates an error p tag and makes it the sibling of the provided input
 * @param {*} inputTag
 * @param {*} message
 */
function displayErrTag(inputTag, message) {
  const errTag = document.createElement("p");
  errTag.classList.add("err");
  errTag.innerText = message;

  inputTag.insertAdjacentElement("afterend", errTag);
}

export default displayErrTag;
