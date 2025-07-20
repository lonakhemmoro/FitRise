/**
 * Only to be used with children of 'sign-up-field' divs.
 * Displays an error tag underneath a 'sign-up-field' class element
 * @param {*} tag Child tag of the 'sign-up-field' to make an error for
 * @param {*} str What you want the error to display
 */
function displayErrTag(tag, str) {
  const parent = tag.parentNode;
  const errTag = document.createElement("p");
  errTag.classList.add("err");
  errTag.innerText = str;
  parent.appendChild(errTag);
}

export default displayErrTag;
