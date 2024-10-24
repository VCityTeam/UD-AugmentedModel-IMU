import { Vector3 } from 'three';
import { isPositionBehindObject3D } from './object3DUtil';

export class CameraController {
  constructor(camera, speed) {
    this.camera = camera;
    this.speed = speed || 250;
    this.moveAxis = new Vector3(0, 0, 0);
    this.targetPosition = null;
    this.listeners = [];
  }

  setTargetPosition(position) {
    this.targetPosition = position;
  }

  isTargetBehindNextCamera() {
    return isPositionBehindObject3D(
      this.computeNextCamera(),
      this.targetPosition
    );
  }

  computeNextCamera() {
    return this.camera.clone().translateOnAxis(this.moveAxis, this.speed);
  }

  moveCamera() {
    this.camera.position.copy(this.computeNextCamera().position);
  }

  setListeners() {
    const stopMoveListener = (event) => {
      const keyMoving = ['-', '+'];
      if (keyMoving.includes(event.key)) {
        this.moveAxis = new Vector3();
      }
    };
    this.listeners.push(stopMoveListener);
    window.addEventListener('keyup', stopMoveListener);

    const zoomListener = (event) => {
      if (event.key == '+') {
        this.moveAxis = new Vector3(0, 0, -1);
      }
    };
    this.listeners.push(zoomListener);
    window.addEventListener('keydown', zoomListener);

    const unZoomListener = (event) => {
      if (event.key == '-') {
        this.moveAxis = new Vector3(0, 0, 1);
      }
    };
    window.addEventListener('keydown', unZoomListener);
    this.listeners.push(unZoomListener);
  }
}
