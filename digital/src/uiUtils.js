export function setSelectValue(selectId, defaultValue) {
  const selectElement = document.getElementById(selectId);
  if (selectElement) {
    for (let i = 0; i < selectElement.options.length; i++) {
      if (selectElement.options[i].value === defaultValue) {
        selectElement.selectedIndex = i;
        selectElement.dispatchEvent(new Event('change'));
        break;
      }
    }
  }
}

export function hideElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}

export function showElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = '';
  }
}

export function toggleShowHide(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = element.style.display === 'none' ? '' : 'none';
  }
}

export function debugCamera(view) {
  const debugButton = document.createElement('button');
  document.body.appendChild(debugButton);
  debugButton.style.zIndex = 1000;
  debugButton.style.position = 'absolute';
  debugButton.style.right = '0px';
  debugButton.onclick = () => {
    console.log(
      '"x: "' +
        view.camera.camera3D.position.x +
        ', "y: "' +
        view.camera.camera3D.position.y +
        ', "z: "' +
        view.camera.camera3D.position.z
    );
    console.log(
      '"x: "' +
        view.camera.camera3D.quaternion._x +
        ', "y: "' +
        view.camera.camera3D.quaternion._y +
        ', "z: "' +
        view.camera.camera3D.quaternion._z +
        ', "w: "' +
        view.camera.camera3D.quaternion._w
    );
  };
}
