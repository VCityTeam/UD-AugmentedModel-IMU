import { Vector3 } from 'three';
export class CameraController {
  constructor(camera, view) {
    this.camera = camera;
    this.view = view;
    this.listeners = [];
  }

  setListeners() {
    const zoomListener = (event) => {
      if (event.key == '-') {
        this.camera.translateOnAxis(new Vector3(0, 0, 1), 100);
        this.view.notifyChange();
      }
    };
    this.listeners.push(zoomListener);
    window.addEventListener('keypress', zoomListener);
    const unZoomListener = (event) => {
      if (event.key == '+') {
        this.camera.translateOnAxis(new Vector3(0, 0, 1), -100);
        this.view.notifyChange();
      }
    };
    window.addEventListener('keypress', unZoomListener);
    this.listeners.push(unZoomListener);
  }
}
