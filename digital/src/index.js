import {
  initScene,
  loadMultipleJSON,
  RequestAnimationFrameProcess,
} from '@ud-viz/utils_browser';
import proj4 from 'proj4';
import * as itowns from 'itowns';
import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CameraController } from './CameraController';
import { DATA_ID, load, save } from './saveAndLoad.js';

import { EvolutionView } from './EvolutionView.js'

const baseUrl = 'http://localhost:8000/';

loadMultipleJSON([
  './assets/config/extents.json',
  './assets/config/crs.json',
  './assets/config/guided_tour.json',
  './assets/config/layer/3DTiles_temporal.json',
  './assets/config/layer/3DTiles_STS_data.json',
  './assets/config/layer/base_maps.json',
  './assets/config/layer/elevation.json',
  `${baseUrl}assets/themes.json`,
]).then((configs) => {
  proj4.defs(configs['crs'][0].name, configs['crs'][0].transform);

  const extent = new itowns.Extent(
    configs['extents'][0].name,
    parseInt(configs['extents'][0].west),
    parseInt(configs['extents'][0].east),
    parseInt(configs['extents'][0].south),
    parseInt(configs['extents'][0].north)
  );

  // create a itowns planar view
  const viewDomElement = document.createElement('div');
  viewDomElement.classList.add('full_screen');
  document.body.appendChild(viewDomElement);
  const view = new itowns.PlanarView(viewDomElement, extent, {
    noControls: true,
  });
  // view.controls.enabled = false;
  // init scene 3D
  initScene(
    view.camera.camera3D,
    view.mainLoop.gfxEngine.getRenderer(),
    view.scene
  );

  // view.controls.enabled = false;
  const orbitControls = new OrbitControls(
    view.camera.camera3D,
    view.mainLoop.gfxEngine.label2dRenderer.domElement
  );

  const cameraProcess = new RequestAnimationFrameProcess(30);

  //init Camera Controller
  const cameraController = new CameraController(view.camera3D);
  cameraController.setListeners();
  cameraController.speed = 1000;
  cameraProcess.start(() => {
    if (!cameraController.isTargetBehindNextCamera()) {
      cameraController.moveCamera();
      view.notifyChange(
        view.camera3D
      ); /** Give camera3D param to trigger redraw of depthBuffer {@link https://github.com/iTowns/itowns/blob/b991878fb7b8ccd409c6ad53adbfbb398003aca0/src/Core/View.js#L470}*/
    }
  });
  cameraController.targetPosition = orbitControls.target;

  const loadCameraButtons = document.getElementsByClassName('load_camera');
  Array.from(loadCameraButtons).forEach((loadCameraButton) => {
    loadCameraButton.onclick = () => {
      cameraController.setCameraFromArray(
        load(DATA_ID.CAMERA).arrayMatrixWorld
      );
      orbitControls.target.copy(
        new THREE.Vector3().fromArray(load(DATA_ID.ORBIT_CONTROLS).arrayTarget)
      );
    };
  });

  const saveCameraButtons = document.getElementsByClassName('save_camera');
  Array.from(saveCameraButtons).forEach((saveCameraButton) => {
    saveCameraButton.onclick = () => {
      save(DATA_ID.CAMERA, cameraController.toJSON());
      save(DATA_ID.ORBIT_CONTROLS, {
        arrayTarget: orbitControls.target.toArray(),
      });
    };
  });

  orbitControls.target.copy(extent.center().toVector3().clone());
  orbitControls.update();
  orbitControls.addEventListener('change', () => {
    view.notifyChange(view.camera.camera3D);
  });

  view.addLayer(
    new itowns.ColorLayer(configs['base_maps'][0]['name'], {
      updateStrategy: {
        type: itowns.STRATEGY_DICHOTOMY,
        options: {},
      },
      source: new itowns.WMSSource({
        extent: extent,
        name: configs['base_maps'][0].source['name'],
        url: configs['base_maps'][0].source['url'],
        version: configs['base_maps'][0].source['version'],
        crs: extent.crs,
        format: configs['base_maps'][0].source['format'],
      }),
      transparent: true,
    })
  );

  const isTextureFormat =
    configs['elevation']['format'] == 'image/jpeg' ||
    configs['elevation']['format'] == 'image/png';
  view.addLayer(
    new itowns.ElevationLayer(configs['elevation']['layer_name'], {
      useColorTextureElevation: isTextureFormat,
      colorTextureElevationMinZ: isTextureFormat
        ? configs['elevation']['colorTextureElevationMinZ']
        : null,
      colorTextureElevationMaxZ: isTextureFormat
        ? configs['elevation']['colorTextureElevationMaxZ']
        : null,
      source: new itowns.WMSSource({
        extent: extent,
        url: configs['elevation']['url'],
        name: configs['elevation']['name'],
        crs: extent.crs,
        heightMapWidth: 256,
        format: configs['elevation']['format'],
      }),
    })
  );

  let currentView = null;

  currentView = new EvolutionView(configs, view, orbitControls);
});
