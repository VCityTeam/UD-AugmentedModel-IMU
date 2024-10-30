export function save(id, data) {
  localStorage.setItem(id, JSON.stringify(data));
}

export function load(id) {
  const savedData = localStorage.getItem(id);
  return savedData ? JSON.parse(savedData) : null;
}

export const DATA_ID = {
  CAMERA: 'camera',
  ORBIT_CONTROLS: 'orbitControls',
};
