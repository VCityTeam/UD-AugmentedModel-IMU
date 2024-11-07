import {
  initScene,
  loadMultipleJSON,
  createLabelInput,
  RequestAnimationFrameProcess,
} from '@ud-viz/utils_browser';
import proj4 from 'proj4';
import * as itowns from 'itowns';
import * as THREE from 'three';
import * as extensions3DTilesTemporal from '@ud-viz/extensions_3d_tiles_temporal';
import { ThemeController } from './ThemeController';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { hideElement } from './uiUtils';
import { CameraController } from './CameraController';
import { DATA_ID, load, save } from './saveAndLoad.js';
import { degToRad } from 'three/src/math/MathUtils.js';

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

  const divSaveLoad = document.createElement('div');
  divSaveLoad.style.position = 'absolute';
  divSaveLoad.style.right = '0';
  divSaveLoad.style.zIndex = '3';
  divSaveLoad.style.display = 'flex';
  document.body.appendChild(divSaveLoad);

  const loadCameraButton = document.getElementById('load_camera')
  loadCameraButton.onclick = () => {
    cameraController.setCameraFromArray(load(DATA_ID.CAMERA).arrayMatrixWorld);
    orbitControls.target.copy(
      new THREE.Vector3().fromArray(load(DATA_ID.ORBIT_CONTROLS).arrayTarget)
    );
  };

  const saveCameraButton = document.getElementById('save_camera')
  saveCameraButton.onclick = () => {
    save(DATA_ID.CAMERA, cameraController.toJSON());
    save(DATA_ID.ORBIT_CONTROLS, {
      arrayTarget: orbitControls.target.toArray(),
    });
  };

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

  const extensions = new itowns.C3DTExtensions();
  extensions.registerExtension(extensions3DTilesTemporal.ID, {
    [itowns.C3DTilesTypes.batchtable]:
      extensions3DTilesTemporal.C3DTTemporalBatchTable,
    [itowns.C3DTilesTypes.boundingVolume]:
      extensions3DTilesTemporal.C3DTTemporalBoundingVolume,
    [itowns.C3DTilesTypes.tileset]:
      extensions3DTilesTemporal.C3DTTemporalTileset,
  });

  // CREATE HTML
  const selectDataset = document.getElementById('select_dataset');
  const datasetConfigs = {};
  configs['3DTiles_STS_data']
    .concat(configs['3DTiles_temporal'])
    .forEach((config) => {
      datasetConfigs[config.id] = config.versions || [config];
      const dataOption = document.createElement('option');
      dataOption.value = config.id;
      dataOption.innerText = config.name;
      selectDataset.appendChild(dataOption);
    });

  const getDataset = () => {
    return datasetConfigs[selectDataset.selectedOptions[0].value];
  };

  const getThemes = () => {
    return configs['themes'].find(
      (config) => config.dataId == selectDataset.selectedOptions[0].value
    );
  };

  const selectMode = document.getElementById('select_mode');

  for (const mode in extensions3DTilesTemporal.STS_DISPLAY_MODE) {
    const optionMode = document.createElement('option');
    optionMode.innerText = extensions3DTilesTemporal.STS_DISPLAY_MODE[mode];
    selectMode.appendChild(optionMode);
  }

  const getCurrentMode = () => {
    return selectMode.selectedOptions[0].value;
  };

  const selectSTShape = document.getElementById('select_shape');
  const shapeName = document.getElementById('shape_name');
  const defaultShape = document.getElementById('default_shape');
  const themeDiv = document.getElementById('theme_div');
  const themesContainer = document.getElementById('themes_container');
  const navButtonsDiv = document.getElementById('nav_buttons_div');

  // CIRCLE HTML
  const uiCircle = document.getElementById('circle_div');
  const radiusParameter = document.getElementById('circle_radius');
  const heightParameter = document.getElementById('circle_height');
  const selectDate = document.getElementById('circle_year');
  const updateCheckBox = document.getElementById('circle_rotation');

  // PARABOLA HTML
  const uiParabola = document.getElementById('parabola_div');
  const parabolaDistAxisX = document.getElementById('parabola_distx');
  const parabolaDistAxisY = document.getElementById('parabola_disty');
  const parabolaHeight = document.getElementById('parabola_height');
  const selectDateParabola = document.getElementById('parabola_year');

  // CREATE SHAPES AND 3DTILES

  const stsCircle = new extensions3DTilesTemporal.STSCircle();
  const stsParabola = new extensions3DTilesTemporal.STSParabola();
  let themeController = null;

  const getShapesWithUi = () => {
    return [
      {
        stShape: stsCircle,
        ui: uiCircle,
      },
      { stShape: stsParabola, ui: uiParabola },
    ];
  };

  const tryGetCurrentSTShape = () => {
    try {
      return getShapesWithUi().find((element) => {
        return element.stShape.displayed;
      }).stShape;
    } catch {
      return false;
    }
  };

  // EVENTS
  let versions = [];
  const listenersToggle = [];

  selectDataset.onchange = () => {
    selectMode.hidden = false;
    defaultShape.selected = true;
    if (versions.length > 0) {
      versions.forEach((v) => {
        view.removeLayer(v.c3DTLayer.id);
      });
      versions = [];
    }
    if (themeController != null) {
      themeController.dispose();
      themeController = null;
    }

    fetch(`${baseUrl}selectedDataId`, {
      method: 'POST',
      body: JSON.stringify({
        selectedDataId: selectDataset.selectedOptions[0].value,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.text());

    const themesConfigs = getThemes();
    const themeInputs = [];
    const themes = {};
    if (themesConfigs != undefined) {
      themeDiv.hidden = false;
      themesContainer.innerHTML = '';
      themesConfigs.themes.forEach((config) => {
        themes[config.id] = config;
        const themeLabelInput = createLabelInput(config.name, 'checkbox');
        themesContainer.appendChild(themeLabelInput.parent);
        themeLabelInput.input.id = config.id;
        /* Adding an event listener when a key is pressed, if there is a match, it toggles the checked state of an input
       element and dispatches a new input event */
        if (config.eventCode) {
          const newListener = (event) => {
            if (event.code == config.eventCode) {
              themeLabelInput.input.checked = !themeLabelInput.input.checked;
              themeLabelInput.input.dispatchEvent(new Event('input'));
            }
          };
          listenersToggle.push(newListener);
          window.addEventListener('keypress', newListener);
        }
        themeInputs.push(themeLabelInput.input);
      });
    } else {
      themeDiv.hidden = true;
      /* Removing event listeners from all the functions in the `listenersToggle`*/
      listenersToggle.forEach((listener) => {
        window.removeEventListener('keypress', listener);
      });
    }
    themeInputs.forEach((input) => {
      input.addEventListener('input', () => {
        const selectedThemes = [];
        const selectedThemeIds = [];
        themeInputs.forEach(({ checked, id }) => {
          if (checked) {
            selectedThemes.push(themes[id]);
            selectedThemeIds.push(id);
          }
        });
        if (themeController != null) {
          themeController.dispose();
          themeController = null;
        }
        if (selectedThemes.length > 0) {
          fetch(`${baseUrl}selectedThemeIds`, {
            method: 'POST',
            body: JSON.stringify({ selectedThemeIds }),
            headers: {
              'Content-Type': 'application/json',
            },
          }).then((response) => response.json());

          themeController = new ThemeController(
            view,
            selectedThemes,
            configs['guided_tour']
          );
          document.body.appendChild(themeController.guidedTour.domElement);
          navButtonsDiv.appendChild(themeController.guidedTour.previousButton);
          navButtonsDiv.appendChild(themeController.guidedTour.nextButton);
        }
      });
    });

    const c3dtilesConfigs = getDataset();
    const promisesTileContentLoaded = [];
    c3dtilesConfigs.forEach((config) => {
      const isTemporal = !!config.dates;
      const datesJSON = isTemporal ? config.dates : [config.date];
      const registerExtensions = isTemporal ? extensions : null;
      datesJSON.forEach((date) => {
        const c3DTilesLayer = new itowns.C3DTilesLayer(
          config.id + '_' + date.toString(),
          {
            name: config.id + date.toString(),
            source: new itowns.C3DTilesSource({
              url: config.url,
            }),
            registeredExtensions: registerExtensions,
          },
          view
        );
        itowns.View.prototype.addLayer.call(view, c3DTilesLayer);
        promisesTileContentLoaded.push(
          new Promise((resolve) => {
            c3DTilesLayer.addEventListener(
              itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
              () => {
                resolve();
              }
            );
          })
        );
        if (isTemporal) {
          const temporalsWrapper =
            new extensions3DTilesTemporal.Temporal3DTilesLayerWrapper(
              c3DTilesLayer
            );

          if (date == Math.min(...datesJSON)) {
            temporalsWrapper.styleDate = date + 1;
          } else {
            temporalsWrapper.styleDate = date - 2;
          }
        }
        versions.push({ date: date, c3DTLayer: c3DTilesLayer });
      });
    });

    const stLayer = new extensions3DTilesTemporal.STLayer(
      view,
      new THREE.Object3D(),
      versions
    );

    Promise.all(promisesTileContentLoaded).then(() => {
      shapeName.hidden = true;

      getShapesWithUi().forEach((element) => {
        if (element.stShape.displayed) {
          element.stShape.dispose();
          element.ui.hidden = true;
        }
        element.stShape.setSTLayer(stLayer);
      });

      // STSCircle
      selectDate.innerHTML = '';
      versions.forEach((v) => {
        const date = v.date;
        const optionDate = document.createElement('option');
        optionDate.innerText = date.toString();
        if (versions.indexOf(v) == 0) {
          optionDate.selected = true;
          stsCircle.selectedDate = date;
        }
        selectDate.appendChild(optionDate);
      });

      // STSParabola
      selectDateParabola.innerHTML = '';
      versions.forEach((v) => {
        const date = v.date;
        const optionDate = document.createElement('option');
        optionDate.innerText = date.toString();
        if (date == stsParabola.middleDate) optionDate.selected = true;
        selectDateParabola.appendChild(optionDate);
      });
    });
  };

  selectSTShape.onchange = () => {
    shapeName.hidden = false;
    shapeName.innerText = selectSTShape.selectedOptions[0].innerText;
    getShapesWithUi().forEach((element) => {
      if (element.stShape != null && element.stShape.displayed) {
        element.stShape.dispose();
        element.ui.hidden = true;
      }
    });
    switch (selectSTShape.selectedOptions[0].value) {
      case 'circle':
        stsCircle.display(getCurrentMode());
        uiCircle.hidden = false;
        radiusParameter.value = stsCircle.radius;
        heightParameter.value = stsCircle.height;
        break;
      case 'parabola':
        stsParabola.display(getCurrentMode());
        uiParabola.hidden = false;
        parabolaDistAxisX.value = stsParabola.distAxisX;
        parabolaDistAxisY.value = stsParabola.distAxisY;
        parabolaHeight.value = stsParabola.height;
        break;
    }
  };

  selectMode.onchange = () => {
    getShapesWithUi().forEach((element) => {
      selectSTShape.hidden = false;
      if (element.stShape != null && element.stShape.displayed) {
        element.stShape.display(getCurrentMode());
      }
    });
  };

  radiusParameter.addEventListener('input', (event) => {
    stsCircle.radius = Number(event.target.value);
    stsCircle.display(getCurrentMode());
    stsCircle.selectVersion(selectDate.selectedOptions[0].value);
  });

  heightParameter.addEventListener('input', (event) => {
    stsCircle.height = Number(event.target.value);
    stsCircle.display(getCurrentMode());
    stsCircle.selectVersion(selectDate.selectedOptions[0].value);
  });

  updateCheckBox.onchange = () => {
    stsCircle.pause = updateCheckBox.checked;
  };

  selectDate.onchange = () => {
    stsCircle.selectVersion(selectDate.selectedOptions[0].value);
  };

  selectDateParabola.onchange = () => {
    stsParabola.middleDate = selectDateParabola.selectedOptions[0].value;
    stsParabola.display(getCurrentMode());
  };

  parabolaDistAxisX.addEventListener('input', (event) => {
    stsParabola.distAxisX = Number(event.target.value);
    stsParabola.display(getCurrentMode());
  });

  parabolaDistAxisY.addEventListener('input', (event) => {
    stsParabola.distAxisY = Number(event.target.value);
    stsParabola.display(getCurrentMode());
  });

  parabolaHeight.addEventListener('input', (event) => {
    stsParabola.height = Number(event.target.value);
    stsParabola.display(getCurrentMode());
  });

  document.body.addEventListener('valuechanged', () => {
    if (
      themeController != null &&
      themeController.slider &&
      versions.length > 0
    ) {
      const date = parseInt(themeController.slider.getValue());
      const closestDate = Math.max(
        ...versions.map((v) => v.date).filter((d) => d <= date),
        versions[0].date
      );
      if (stsCircle && stsCircle.displayed) {
        stsCircle.selectVersion(closestDate);
        selectDate.value = closestDate.toString();
      }
      if (stsParabola && stsParabola.displayed) {
        stsParabola.middleDate = closestDate;
        stsParabola.display(getCurrentMode());
        selectDateParabola.value = closestDate.toString();
      }
    }
  });

  /**
   * Computes an orientation and position for a 3D object clone that aligns it with the current camera view.
   * This helps ensure the object appears centered and properly oriented in the camera's field of view.
   * @returns {THREE.Object3D} - The transformed clone of the 3D object, oriented consistently with the camera view.
   */
  const getFocusTransformForCurrentSTShape = () => {
    // Retrieve the current shape in the scene (assumed to be a 3D object)
    const currentSTShape = tryGetCurrentSTShape();

    // Clone the 3D object to work with it independently of the original
    const cloneObject = currentSTShape.stLayer.rootObject3D.clone();

    // Reset the rotation of the clone to a base orientation for consistent positioning
    cloneObject.rotation.set(0, 0, 0);

    // Calculate the bounding box of the clone to determine its spatial dimensions
    const bounds = new THREE.Box3().setFromObject(cloneObject);

    // Get the dimensions (width, height, depth) of the bounding box
    const objectSizes = bounds.getSize(new THREE.Vector3());

    // Determine the largest dimension and double it to use as a reference size
    const objectSize =
      Math.max(objectSizes.x, objectSizes.y, objectSizes.z) * 2;

    // Calculate the vertical field of view at a 1-meter distance from the camera
    const cameraView = 2 * Math.tan(0.5 * degToRad(view.camera3D.fov));

    // Calculate an initial distance to fit the object within the camera's field of view
    let distance = objectSize / cameraView;

    // Add extra distance based on the object's size to ensure optimal positioning in view
    distance += objectSize;

    // Define an angle to adjust the camera position relative to the object (in degrees)
    const angle = 90;

    // Clone the camera's position for manipulations without affecting the original camera position
    const cameraPositionClone = view.camera3D.position.clone();
    cameraPositionClone.z = cloneObject.position.z;

    // Convert the angle to radians
    const radAngle = degToRad(angle);

    // Calculate the new position of the camera in the x-y plane based on the specified rotation angle
    const newPosition = new THREE.Vector3(
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
      .getWorldPosition(new THREE.Vector3())
      .sub(cloneObject.getWorldPosition(new THREE.Vector3()));

    // Move the cloned object along the direction vector so that it is properly positioned in view
    cloneObject.translateOnAxis(dirCameraObject.normalize(), distance);

    // Apply transformations to the clone's world matrix
    cloneObject.updateMatrixWorld();

    // Return the transformed clone, now positioned consistently with the camera view
    return cloneObject;
  };

  let bHelpers = [];
  window.addEventListener('keydown', (event) => {
    if (event.key == '*') {
      if (!tryGetCurrentSTShape()) return;
      view.camera3D.position.copy(
        getFocusTransformForCurrentSTShape().position
      );

      orbitControls.target.setFromMatrixPosition(
        tryGetCurrentSTShape().stLayer.rootObject3D.matrixWorld
      );
      orbitControls.update();
    }
    if (event.key == 'b') {
      const rootObject3D = tryGetCurrentSTShape().stLayer.rootObject3D;
      const box3 = new THREE.Box3Helper(
        new THREE.Box3().setFromObject(rootObject3D),
        0xff0000
      );
      box3.updateMatrixWorld();
      view.scene.add(box3);
      bHelpers.push(box3);
    }
    if (event.key == 'c') {
      bHelpers.forEach((bh) => {
        bh.removeFromParent();
      });
      bHelpers = [];
    }
  });

  hideElement('shape_div');
});
