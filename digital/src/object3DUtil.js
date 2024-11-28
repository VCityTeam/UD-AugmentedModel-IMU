import {
  Object3D,
  Vector3,
  TextureLoader,
  SpriteMaterial,
  Sprite,
  Box3,
} from 'three';
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js';

/**
 * The function `isPositionBehindObject3D` determines if a target position is behind a given 3D object
 * based on the angle between their directions.
 * @param {Object3D} object - The `object` parameter in the `isPositionBehindObject3D` function refers to a 3D
 * object in a scene. This object is used to determine if another position is behind it in relation to
 * its current orientation.
 * @param {Vector3}targetPosition - The `targetPosition` parameter is the position of the target object in 3D
 * space that you want to check if it is behind the given `object`. This function calculates the angle
 * between the direction from the `object` to the `targetPosition` and the direction the `object` is
 * facing
 * @returns {boolean} The function `isPositionBehindObject3D` returns a boolean value indicating whether the
 * target position is behind the object in 3D space. If the angle between the direction from the object
 * to the target position and the object's forward direction is greater than 90 degrees, it returns
 * `true`, indicating that the target position is behind the object. Otherwise, it returns `false`.
 */
export const isPositionBehindObject3D = (object, targetPosition) => {
  if (!targetPosition) {
    console.warn('define targetPosition before');
    return;
  }
  const dirObjectTarget = targetPosition
    .clone()
    .sub(object.getWorldPosition(new Vector3()));

  const dirObject = object.getWorldDirection(new Vector3());

  const angle = radToDeg(dirObjectTarget.angleTo(dirObject));

  return angle > 90;
};

export function createPin(position, imagePath) {
  const loader = new TextureLoader();
  const texture = loader.load(imagePath, (texture) => {
    texture.center.set(0.5, 1);
  });
  const pictureMaterial = new SpriteMaterial({
    map: texture,
  });
  const pin = new Sprite(pictureMaterial);
  pin.position.set(position.x, position.y, position.z);
  pin.scale.set(500, 500, 500);
  pin.updateMatrixWorld();

  return pin;
}

/**
 * Computes an orientation and position for a 3D object clone that aligns it with the current camera view.
 * This helps ensure the object appears centered and properly oriented in the camera's field of view.
 * @returns {Object3D} - The transformed clone of the 3D object, oriented consistently with the camera view.
 */
export function getFocusTransformForCurrentSTShape(view, stShape) {
  // Clone the 3D object to work with it independently of the original
  const cloneObject = stShape.stLayer.rootObject3D.clone();

  // Reset the rotation of the clone to a base orientation for consistent positioning
  cloneObject.rotation.set(0, 0, 0);

  // Calculate the bounding box of the clone to determine its spatial dimensions
  const bounds = new Box3().setFromObject(cloneObject);

  // Get the dimensions (width, height, depth) of the bounding box
  const objectSizes = bounds.getSize(new Vector3());

  // Determine the largest dimension and double it to use as a reference size
  const objectSize = Math.max(objectSizes.x, objectSizes.y, objectSizes.z) * 2;

  // Calculate the vertical field of view at a 1-meter distance from the camera
  const cameraView = 2 * Math.tan(0.5 * degToRad(view.camera3D.fov));

  // Calculate an initial distance to fit the object within the camera's field of view
  let distance = objectSize / cameraView;

  // Define an angle to adjust the camera position relative to the object (in degrees)
  const angle = 90;

  // Clone the camera's position for manipulations without affecting the original camera position
  const cameraPositionClone = view.camera3D.position.clone();
  cameraPositionClone.z = cloneObject.position.z;

  // Convert the angle to radians
  const radAngle = degToRad(angle);

  // Calculate the new position of the camera in the x-y plane based on the specified rotation angle
  const newPosition = new Vector3(
    cameraPositionClone.x,
    cameraPositionClone.y * Math.cos(radAngle) -
      cameraPositionClone.z * Math.sin(radAngle),
    cameraPositionClone.y * Math.sin(radAngle) +
      cameraPositionClone.z * Math.cos(radAngle)
  );

  // Update the camera's position to the newly calculated position
  view.camera3D.position.copy(newPosition);

  // Calculate the direction vector from the camera to the object
  const dirCameraObject = view.camera3D
    .getWorldPosition(new Vector3())
    .sub(cloneObject.getWorldPosition(new Vector3()));

  // Move the cloned object along the direction vector so that it is properly positioned in view
  cloneObject.translateOnAxis(dirCameraObject.normalize(), distance);

  // Apply transformations to the clone's world matrix
  cloneObject.updateMatrixWorld();

  // Return the transformed clone, now positioned consistently with the camera view
  return cloneObject;
}
