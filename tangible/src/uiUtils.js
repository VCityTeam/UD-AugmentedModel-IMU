export function createInputVector(labels, vectorName, step = 0.5) {
  const titleVector = document.createElement('h3');
  titleVector.innerText = vectorName;

  const inputDiv = document.createElement('div');
  inputDiv.id = vectorName + '_inputDiv';
  inputDiv.style.display = 'grid';
  for (let iInput = 0; iInput < labels.length; iInput++) {
    const labelElement = document.createElement('label');
    labelElement.innerText = labels[iInput];

    const componentElement = document.createElement('input');
    componentElement.id = vectorName + labelElement.innerText;
    componentElement.type = 'number';
    componentElement.setAttribute('value', '0');
    componentElement.step = step;

    labelElement.htmlFor = componentElement.id;
    inputDiv.appendChild(labelElement);
    inputDiv.appendChild(componentElement);
  }
  return {
    title: titleVector,
    inputDiv: inputDiv,
    inputs: [...inputDiv.getElementsByTagName('input')],
  };
}

export function cameraSettings(view) {
  const camera = view.camera3D;
  const getVector = (inputs) => {
    return [
      inputs[0].valueAsNumber,
      inputs[1].valueAsNumber,
      inputs[2].valueAsNumber,
    ];
  };

  const setVector = (inputs, vector3D) => {
    inputs[0].value = vector3D.x;
    inputs[1].value = vector3D.y;
    inputs[2].value = vector3D.z;
  };

  const cameraSettingsDiv = document.createElement('div');
  cameraSettingsDiv.id = 'camera_settings_div';
  cameraSettingsDiv.style.position = 'absolute';
  cameraSettingsDiv.style.display = 'flex';
  cameraSettingsDiv.style.flexDirection = 'column';
  cameraSettingsDiv.style.zIndex = 1000;
  document.body.appendChild(cameraSettingsDiv);
  const coordinatesElement = createInputVector(
    ['X', 'Y', 'Z'],
    'Coordinates',
    0.5
  );
  cameraSettingsDiv.appendChild(coordinatesElement.title);
  const coordinatesInputs = coordinatesElement.inputs;
  setVector(coordinatesInputs, camera.position);
  coordinatesInputs.forEach((input) => {
    input.oninput = () => {
      const coordinates = getVector(coordinatesInputs);
      camera.position.set(...coordinates);
      view.notifyChange();
    };
  });
  cameraSettingsDiv.appendChild(coordinatesElement.inputDiv);

  const rotationElement = createInputVector(['X', 'Y', 'Z'], 'Rotation', 0.001);
  cameraSettingsDiv.appendChild(rotationElement.title);
  const rotationInputs = rotationElement.inputs;
  setVector(rotationInputs, camera.rotation);
  rotationInputs.forEach((input) => {
    input.oninput = () => {
      const coordinates = getVector(rotationInputs);
      camera.rotation.set(...coordinates);
      view.notifyChange();
    };
  });
  cameraSettingsDiv.appendChild(rotationElement.inputDiv);

  return cameraSettingsDiv;
}
