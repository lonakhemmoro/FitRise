const buttonMax = 5; //The amount of buttons visible on screen at once
const amntPerPage = 6;

let pagePosition = 1;
let pageCount = 1;

let holderElement;

/* Template
<div class="page-buttons">
  <button>&lt;</button>
    <ol>
      <li><button class="pb-highlight">1</button></li>
      <li><button>2</button></li>
      <li><button>3</button></li>
      <li><button>4</button></li>
      <li><button>5</button></li>
    </ol>
  <button>&gt;</button>
</div>
*/

export function createPageSelector(total, holderDiv) {
  holderElement = holderDiv;
  holderDiv.innerHTML = `
    <button>&lt;</button>
        <ol>
        </ol>
    <button>&gt;</button>
    `;
  holderDiv.classList.add("page-buttons");

  pageCount = Math.ceil(total / amntPerPage);

  const buttonCount = pageCount < buttonMax ? pageCount : buttonMax;
  let buttonStr = "";
  for (let i = 1; i <= buttonCount; i++) {
    if (i === 1) {
      buttonStr += `<li><button class="pb-highlight" disabled>${i}</button></li>`;
    } else {
      buttonStr += `<li><button>${i}</button></li>`;
    }
  }

  holderDiv.querySelector("ol").innerHTML = buttonStr;

  holderDiv.firstElementChild.disabled = true;
  if (pageCount === 1) {
    holderDiv.lastElementChild.disabled = true;
  }
}

/**
 *
 * @param {function} func The function you want the buttons to perform on click
 */
export function setPageClick(func, isAsync) {
  const buttons = holderElement.querySelectorAll("ol li button");
  buttons.forEach((element) => {
    if (isAsync) {
      element.onclick = async () => {
        const num = parseInt(element.innerText);
        await func(num);
        updatePageSelector(num);
      };
    } else {
      element.onclick = () => {
        const num = parseInt(element.innerText);
        func(num);
        updatePageSelector(num);
      };
    }
  });

  //Give functionality to the <> buttons
  holderElement.firstElementChild.onclick = () => {
    const num = pagePosition - 1;
    func(num);
    updatePageSelector(num);
  };
  holderElement.lastElementChild.onclick = () => {
    const num = pagePosition + 1;
    func(num);
    updatePageSelector(num);
  };
}

//Assumes the page isn't going to reload upon button click
function updatePageSelector(pagePos) {
  pagePosition = pagePos;

  //Change the numbers
  let pageMin, pageMax;

  if (pageCount > buttonMax) {
    if (pagePos - 2 <= 0) {
      pageMin = 1;
      pageMax = 5;
    } else if (pagePos + 2 > pageCount) {
      pageMax = pageCount;
      pageMin = pageMax - 4;
    } else {
      pageMin = pagePos - 2;
      pageMax = pagePos + 2;
    }
  } else {
    pageMin = 1;
  }

  const numButtons = holderElement.querySelectorAll("ol li button");
  let i = pageMin;
  numButtons.forEach((element) => {
    if (i === pagePos) {
      element.disabled = true;
      element.classList.add("pb-highlight");
    } else {
      element.disabled = false;
      element.classList.remove("pb-highlight");
    }
    element.innerText = i++;
  });

  //Disable buttons if necessary
  holderElement.firstElementChild.disabled = pagePos === 1;
  holderElement.lastElementChild.disabled = pagePos === pageCount;
}

export function deletePageButtons() {
  //Remove event listeners
  const numButtons = holderElement.querySelectorAll("ol li button");
  numButtons.forEach((element) => {
    element.remove();
  });

  //Remove HTML
  holderElement.innerHTML = "";
}
