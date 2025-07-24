/**
 * Displays the error red border around the given element
 * @param {*} tag
 * @param {*} enabled (bool) enable or disable the border
 */
function displayErrBorder(tag, enabled = true) {
  if (enabled) {
    tag.classList.add("err");
  } else {
    tag.classList.remove("err");
  }
}

export default displayErrBorder;
