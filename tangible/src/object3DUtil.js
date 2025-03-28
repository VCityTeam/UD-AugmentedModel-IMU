import { TextureLoader, SpriteMaterial, Sprite } from 'three';

export function createPin(position, imagePath) {
  const loader = new TextureLoader();
  const texture = loader.load(imagePath, (texture) => {
    texture.center.set(0.5, 1);
  });
  const pictureMaterial = new SpriteMaterial({
    map: texture,
  });
  const pin = new Sprite(pictureMaterial);
  pin.position.set(position.x, position.y, 0.2);
  pin.scale.set(20, 20, 20);
  pin.updateMatrixWorld();

  return pin;
}
