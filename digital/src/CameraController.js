import { Matrix4, Quaternion, Vector3 } from 'three';
import { isPositionBehindObject3D } from './object3DUtil';

export class CameraController {
  constructor(camera, speed) {
    this.camera = camera;
    this.speed = speed || 250;
    this.moveAxis = new Vector3(0, 0, 0);
    this.targetPosition = null;
    this.listeners = [];
  }

  setCameraFromArray(transform) {
    transform = new Matrix4().fromArray(transform);

    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    transform.decompose(position, quaternion, scale);

    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);
    this.camera.scale.copy(scale);
    this.camera.updateMatrixWorld();
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
      const keyMoving = Object.values(CameraController.MOVE_KEY).flat();
      if (keyMoving.includes(event.key)) {
        this.moveAxis = new Vector3();
      }
    };
    this.listeners.push(stopMoveListener);
    window.addEventListener('keyup', stopMoveListener);

    const zoomListener = (event) => {
      if (CameraController.MOVE_KEY.ZOOM_TO_TARGET.includes(event.key)) {
        this.moveAxis = new Vector3(0, 0, -1);
      }
    };
    this.listeners.push(zoomListener);
    window.addEventListener('keydown', zoomListener);

    const unZoomListener = (event) => {
      if (CameraController.MOVE_KEY.UNZOOM_TO_TARGET.includes(event.key)) {
        this.moveAxis = new Vector3(0, 0, 1);
      }
    };
    window.addEventListener('keydown', unZoomListener);
    this.listeners.push(unZoomListener);
  }

  toJSON() {
    return {
      arrayMatrixWorld: this.camera.matrixWorld.toArray(),
    };
  }
}

CameraController.MOVE_KEY = {
  ZOOM_TO_TARGET: '+',
  UNZOOM_TO_TARGET: '-',
};
