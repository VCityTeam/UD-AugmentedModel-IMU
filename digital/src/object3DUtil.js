import { Object3D, Vector3 } from 'three';
import { radToDeg } from 'three/src/math/MathUtils.js';

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
