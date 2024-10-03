export function dragElement(draggableElement, draggedElement) {
  if (!draggedElement) draggedElement = draggableElement;
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  // otherwise, move the DIV from anywhere inside the DIV:
  draggableElement.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:

    draggedElement.style.top = draggedElement.offsetTop - pos2 + 'px';
    draggedElement.style.left = draggedElement.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
