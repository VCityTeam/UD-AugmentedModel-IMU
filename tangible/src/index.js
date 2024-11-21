import {
  cameraFitRectangle,
  initScene,
  loadMultipleJSON,
} from '@ud-viz/utils_browser';
import proj4 from 'proj4';
import * as itowns from 'itowns';
import * as THREE from 'three';
import { ThemeController } from './ThemeController';
import { createPin } from './object3DUtil';

const baseUrl = window.location.origin;

loadMultipleJSON([
  './assets/config/extents.json',
  './assets/config/crs.json',
  './assets/config/widget/slide_show.json',
  `${baseUrl}/assets/themes.json`,
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
  let guidedTourConfig = null;
  let pins = {};

  const getThemesByIds = (ids) => {
    const themeConfig = configs['themes'].find((config) => {
      return config.dataId == dataThemes.dataId;
    });
    return themeConfig.themes.filter((config) => ids.includes(config.id));
  };

  function getDataId() {
    fetch(`${baseUrl}/selectedDataId`, {
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
        let datasetChanged = text != dataThemes.dataId;
        dataThemes.dataId = text;
        if (datasetChanged) {
          clean();

          Object.values(pins).forEach((pin) => {
            view.scene.remove(pin);
            pin.material.dispose();
          });
          pins = {};
          view.notifyChange();

          const themesConfig = configs['themes'].find(
            (config) => config.dataId == dataThemes.dataId
          );
          if (themesConfig) {
            themesConfig.themes
              .filter((theme) => theme.type == 'multimedia')
              .forEach((config) => {
                if (config.pin) {
                  const pin = createPin(
                    config.pin.position,
                    baseUrl + '/' + config.pin.sprite
                  );
                  view.scene.add(pin);
                  pins[config.id] = pin;
                }
              });
            view.notifyChange();
          }
        }
        getSelectedThemeIds(datasetChanged);
      });
  }

  function getSelectedThemeIds(datasetChanged) {
    fetch(`${baseUrl}/selectedThemeIds`, {
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
          !json ||
          (!datasetChanged &&
            JSON.stringify(json) == JSON.stringify(dataThemes.selectedThemeIds))
        )
          return;
        clean();
        dataThemes.selectedThemeIds = json;
        stepIndex = 0;
        if (dataThemes.selectedThemeIds.length) getGuidedTourConfig();
      });
  }

  function getGuidedTourConfig() {
    fetch(`${baseUrl}/guidedTourConfig`, {
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
        guidedTourConfig = JSON.parse(text);
        themeController = new ThemeController(
          view,
          getThemesByIds(dataThemes.selectedThemeIds),
          configs['slide_show'],
          guidedTourConfig,
          extent
        );
        themeController.slideShow.addListeners();
        themeController.guidedTour.goToStep(stepIndex);
        view.scene.add(themeController.slideShow.plane);
      });
  }

  function getStepIndex() {
    fetch(`${baseUrl}/stepIndex`, {
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
            if (themeController.guidedTour)
              themeController.guidedTour.goToStep(stepIndex);
          }
        }
      });
  }

  function clean() {
    if (themeController) themeController.dispose();
    themeController = null;
    guidedTourConfig = null;
  }
});
