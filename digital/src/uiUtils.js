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
