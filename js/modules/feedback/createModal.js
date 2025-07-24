let timeoutID = -1;

/**
 * Creates a modal at the bottom of the screen. Automatically closes it in 5 seconds
 * @param {string} message Message to display in the modal
 * @param {boolean} isError Is the modal being used for an error
 */
function displayModal(message, isError = false) {
  const preExistingModal = document.querySelector(".modal-container");
  //console.log(preExistingModal);
  if (preExistingModal) {
    clearTimeout(timeoutID);
    preExistingModal.remove();
  }

  const body = document.querySelector("body");
  const errClass = isError ? "err" : "";

  const container = document.createElement("div");
  container.classList.add("modal-container");
  container.innerHTML = `
      <div class="modal ${errClass}">
        <p>${message}</p>
      </div>
      `;

  body.appendChild(container);

  /*
    <div class="err-container closed">
      <div class="err-modal">
        <p>Unknown server error. Please try again later</p>
        <button>X</button>
      </div>
    </div>
    */

  let seconds = 5;
  let ms = seconds * 1000;
  timeoutID = setTimeout(() => {
    container.remove();
  }, ms);
}

export default displayModal;
