/*We switched to having the modal be automatically removed after a few seconds,
  but keep this for now, it may be useful later*/

function closeErrModal() {
  const errContainer = document.querySelector(".err-container");
  errContainer.classList.add("closed");
}

export default closeErrModal;
