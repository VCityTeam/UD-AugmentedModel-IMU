import { Quaternion, Vector3 } from 'three';
import { isPositionBehindObject3D } from './object3DUtil';

export class CameraController {
  constructor(camera, speed) {
    this.camera = camera;
    this.speed = speed || 250;
    this.moveAxis = new Vector3(0, 0, 0);
    this.targetPosition = null;
    this.cameraTransformSaved = this.camera.matrixWorld.clone();
    this.listeners = [];
  }

  setTargetPosition(position) {
    this.targetPosition = position;
  }

  saveCameraTransform() {
    this.cameraTransformSaved = this.camera.matrixWorld.clone();
  }

  loadCameraTransform() {
    const position = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    this.cameraTransformSaved.decompose(position, quaternion, scale);

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
}

CameraController.MOVE_KEY = {
  ZOOM_TO_TARGET: '+',
  UNZOOM_TO_TARGET: '-',
};
