/*We made a new displayErrModal like function. But keep this for now.
  It might be useful later*/

/**
 * Displays the bottom viewport error modal
 * @param {string} str The string the modal should display
 */
function displayErrModal(str) {
  const errContainer = document.querySelector(".err-container");
  const pTag = errContainer.querySelector(".err-modal p");
  pTag.innerText = str;

  errContainer.classList.remove("closed");
}

export default displayErrModal;
