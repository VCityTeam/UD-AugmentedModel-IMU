import {
  cameraFitRectangle,
  initScene,
  loadMultipleJSON,
} from '@ud-viz/utils_browser';
import proj4 from 'proj4';
import * as itowns from 'itowns';
import * as THREE from 'three';
import { ThemeController } from './ThemeController';

const baseUrl = 'http://localhost:8000/';

loadMultipleJSON([
  './assets/config/extents.json',
  './assets/config/crs.json',
  './assets/config/widget/slide_show.json',
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
  const view = new itowns.PlanarView(viewDomElement, extent);

  // eslint-disable-next-line no-constant-condition
  if ('RUN_MODE' == 'production')
    loadingScreen(view, ['UD-VIZ', 'UDVIZ_VERSION']);

  // init scene 3D
  initScene(view.camera.camera3D, view.mainLoop.gfxEngine.renderer, view.scene);

  const fitExtent = () => {
    cameraFitRectangle(
      view.camera.camera3D,
      new THREE.Vector2(extent.west, extent.south),
      new THREE.Vector2(extent.east, extent.north)
    );
    view.notifyChange(view.camera.camera3D);
  };
  fitExtent();
  view.camera.camera3D.rotation.set(0, 0, 0);

  // Add UI
  const uiDomElement = document.createElement('div');
  uiDomElement.classList.add('full_screen');
  document.body.appendChild(uiDomElement);

  const intervalID = setInterval(getDataId, 1000);
  const intervalStep = setInterval(getStepIndex, 1000);

  let themeController = null;
  const dataThemes = { dataId: null, selectedThemeIds: [] };
  let stepIndex = 0;

  const getThemesByIds = (ids) => {
    const themeConfig = configs['themes'].find((config) => {
      return config.dataId == dataThemes.dataId;
    });
    console.log(themeConfig);
    return themeConfig.themes.filter((config) => ids.includes(config.id));
  };

  function getDataId() {
    fetch(`${baseUrl}selectedDataId`, {
      method: 'GET',
    })
      .then((response) => {
        try {
          if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
          }
          return response.text();
        } catch (error) {
          console.error(error.message);
        }
      })
      .then((text) => {
        let forceRefresh = text != dataThemes.dataId;
        dataThemes.dataId = text;
        getSelectedThemeIds(forceRefresh);
      });
  }

  function getStepIndex() {
    fetch(`${baseUrl}stepIndex`, {
      method: 'GET',
    })
      .then((response) => {
        try {
          if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
          }
          return response.text();
        } catch (error) {
          console.error(error.message);
        }
      })
      .then((text) => {
        if (parseInt(text) != stepIndex) {
          stepIndex = parseInt(text);
          if (themeController) {
            themeController.slideShow.setTexture(stepIndex);
          }
        }
      });
  }

  function getSelectedThemeIds(forceRefresh) {
    fetch(`${baseUrl}selectedThemeIds`, {
      method: 'GET',
    })
      .then((response) => {
        try {
          if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
          }
          return response.json();
        } catch (error) {
          console.error(error.message);
        }
      })
      .then((json) => {
        if (
          (forceRefresh && json.length) ||
          JSON.stringify(json) != JSON.stringify(dataThemes.selectedThemeIds)
        ) {
          dataThemes.selectedThemeIds = json;
          if (themeController) {
            themeController.dispose();
            themeController = null;
          }
          stepIndex = 0;
          themeController = new ThemeController(
            view,
            getThemesByIds(dataThemes.selectedThemeIds),
            configs['slide_show'],
            extent
          );
          themeController.slideShow.addListeners();
          view.scene.add(themeController.slideShow.plane);
        }
      });
  }
});
