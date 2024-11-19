import * as itowns from 'itowns';
import * as THREE from 'three';
import * as extensions3DTilesTemporal from '@ud-viz/extensions_3d_tiles_temporal';
import { ThemeController } from './ThemeController';

import { hideElement, showElement } from './uiUtils';
import { degToRad } from 'three/src/math/MathUtils.js';

const baseUrl = 'http://localhost:8000/';

export class EvolutionView {
  constructor(configs, view, controls) {
    this.view = view;

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
    this.selectDataset = document
      .getElementById('evolution_div')
      .getElementsByClassName('select_dataset')[0];
    const datasetConfigs = {};
    configs['3DTiles_STS_data']
      .concat(configs['3DTiles_temporal'])
      .forEach((config) => {
        datasetConfigs[config.id] = config.versions || [config];
        const dataOption = document.createElement('option');
        dataOption.value = config.id;
        dataOption.innerText = config.name;
        this.selectDataset.appendChild(dataOption);
      });

    const getDataset = () => {
      return datasetConfigs[this.selectDataset.selectedOptions[0].value];
    };

    const getThemes = () => {
      return configs['themes'].find(
        (config) => config.dataId == this.selectDataset.selectedOptions[0].value
      );
    };

    this.selectMode = document.getElementById('select_mode');

    for (const mode in extensions3DTilesTemporal.STS_DISPLAY_MODE) {
      const optionMode = document.createElement('option');
      optionMode.innerText = extensions3DTilesTemporal.STS_DISPLAY_MODE[mode];
      this.selectMode.appendChild(optionMode);
    }

    const getCurrentMode = () => {
      return this.selectMode.selectedOptions[0].value;
    };

    this.selectSTShape = document.getElementById('select_shape');
    const shapeName = document.getElementById('shape_name');
    this.defaultShape = document.getElementById('default_shape');
    this.themeDiv = document.getElementById('theme_div');
    this.themesContainer = document.getElementById('themes_container');
    const navButtonsDiv = document.getElementById('nav_buttons_div');

    // CIRCLE HTML
    this.uiCircle = document.getElementById('circle_div');
    const radiusParameter = document.getElementById('circle_radius');
    const heightParameter = document.getElementById('circle_height');
    const selectDate = document.getElementById('circle_year');
    const updateCheckBox = document.getElementById('circle_rotation');

    // PARABOLA HTML
    this.uiParabola = document.getElementById('parabola_div');
    const parabolaDistAxisX = document.getElementById('parabola_distx');
    const parabolaDistAxisY = document.getElementById('parabola_disty');
    const parabolaHeight = document.getElementById('parabola_height');
    const selectDateParabola = document.getElementById('parabola_year');

    // CREATE SHAPES AND 3DTILES

    this.stsCircle = new extensions3DTilesTemporal.STSCircle();
    this.stsParabola = new extensions3DTilesTemporal.STSParabola();
    this.themeController = null;

    // EVENTS
    this.versions = [];
    const listenersToggle = [];

    this.selectDataset.onchange = () => {
      this.selectMode.hidden = false;
      this.defaultShape.selected = true;
      if (this.versions.length > 0) {
        this.versions.forEach((v) => {
          this.view.removeLayer(v.c3DTLayer.id);
        });
        this.versions = [];
      }
      if (this.themeController != null) {
        this.themeController.dispose();
        this.themeController = null;
      }

      fetch(`${baseUrl}selectedDataId`, {
        method: 'POST',
        body: JSON.stringify({
          selectedDataId: this.selectDataset.selectedOptions[0].value,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((response) => response.text());

      const themesConfigs = getThemes();
      const themeInputs = [];
      const themes = {};
      if (themesConfigs != undefined) {
        this.themeDiv.hidden = false;
        this.themesContainer.innerHTML = '';
        themesConfigs.themes
          .filter((theme) => theme.type == 'evolution')
          .forEach((config) => {
            themes[config.id] = config;
            const themeLabel = document.createElement('label');
            const themeInput = document.createElement('input');
            themeInput.setAttribute('type', 'checkbox');
            themeLabel.appendChild(themeInput);
            const themeSpan = document.createElement('span');
            themeSpan.innerText = config.name;
            themeLabel.appendChild(themeSpan);
            this.themesContainer.appendChild(themeLabel);
            themeInput.id = config.id;
            /* Adding an event listener when a key is pressed, if there is a match, it toggles the checked state of an input
       element and dispatches a new input event */
            if (config.key) {
              const newListener = (event) => {
                if (event.key == config.key) {
                  themeInput.checked = !themeInput.checked;
                  themeInput.dispatchEvent(new Event('input'));
                }
              };
              listenersToggle.push(newListener);
              window.addEventListener('keypress', newListener);
            }
            themeInputs.push(themeInput);
          });
      } else {
        this.themeDiv.hidden = true;
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
          if (this.themeController != null) {
            this.themeController.dispose();
            this.themeController = null;
          }

          fetch(`${baseUrl}selectedThemeIds`, {
            method: 'POST',
            body: JSON.stringify({ selectedThemeIds }),
            headers: {
              'Content-Type': 'application/json',
            },
          }).then((response) => response.json());

          if (selectedThemes.length > 0) {
            this.themeController = new ThemeController(
              this.view,
              selectedThemes,
              configs['guided_tour']
            );
            document.body.appendChild(
              this.themeController.guidedTour.domElement
            );
            navButtonsDiv.appendChild(
              this.themeController.guidedTour.previousButton
            );
            navButtonsDiv.appendChild(
              this.themeController.guidedTour.nextButton
            );
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
            this.view
          );
          itowns.View.prototype.addLayer.call(this.view, c3DTilesLayer);
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
          this.versions.push({ date: date, c3DTLayer: c3DTilesLayer });
        });
      });

      const stLayer = new extensions3DTilesTemporal.STLayer(
        this.view,
        new THREE.Object3D(),
        this.versions
      );

      Promise.all(promisesTileContentLoaded).then(() => {
        shapeName.hidden = true;

        this.getShapesWithUi().forEach((element) => {
          if (element.stShape.displayed) {
            element.stShape.dispose();
            element.ui.hidden = true;
          }
          element.stShape.setSTLayer(stLayer);
        });

        // STSCircle
        selectDate.innerHTML = '';
        this.versions.forEach((v) => {
          const date = v.date;
          const optionDate = document.createElement('option');
          optionDate.innerText = date.toString();
          if (this.versions.indexOf(v) == 0) {
            optionDate.selected = true;
            this.stsCircle.selectedDate = date;
          }
          selectDate.appendChild(optionDate);
        });

        // STSParabola
        selectDateParabola.innerHTML = '';
        this.versions.forEach((v) => {
          const date = v.date;
          const optionDate = document.createElement('option');
          optionDate.innerText = date.toString();
          if (date == this.stsParabola.middleDate) optionDate.selected = true;
          selectDateParabola.appendChild(optionDate);
        });
      });
    };

    this.selectSTShape.onchange = () => {
      shapeName.hidden = false;
      shapeName.innerText = this.selectSTShape.selectedOptions[0].innerText;
      this.getShapesWithUi().forEach((element) => {
        if (element.stShape != null && element.stShape.displayed) {
          element.stShape.dispose();
          element.ui.hidden = true;
        }
      });
      switch (this.selectSTShape.selectedOptions[0].value) {
        case 'circle':
          this.stsCircle.display(getCurrentMode());
          this.uiCircle.hidden = false;
          radiusParameter.value = this.stsCircle.radius;
          heightParameter.value = this.stsCircle.height;
          break;
        case 'parabola':
          this.stsParabola.display(getCurrentMode());
          this.uiParabola.hidden = false;
          parabolaDistAxisX.value = this.stsParabola.distAxisX;
          parabolaDistAxisY.value = this.stsParabola.distAxisY;
          parabolaHeight.value = this.stsParabola.height;
          break;
      }
    };

    this.selectMode.onchange = () => {
      this.getShapesWithUi().forEach((element) => {
        this.selectSTShape.hidden = false;
        if (element.stShape != null && element.stShape.displayed) {
          element.stShape.display(getCurrentMode());
        }
      });
    };

    radiusParameter.addEventListener('input', (event) => {
      this.stsCircle.radius = Number(event.target.value);
      this.stsCircle.display(getCurrentMode());
      this.stsCircle.selectVersion(selectDate.selectedOptions[0].value);
    });

    heightParameter.addEventListener('input', (event) => {
      this.stsCircle.height = Number(event.target.value);
      this.stsCircle.display(getCurrentMode());
      this.stsCircle.selectVersion(selectDate.selectedOptions[0].value);
    });

    updateCheckBox.onchange = () => {
      this.stsCircle.pause = updateCheckBox.checked;
    };

    selectDate.onchange = () => {
      this.stsCircle.selectVersion(selectDate.selectedOptions[0].value);
    };

    selectDateParabola.onchange = () => {
      this.stsParabola.middleDate = selectDateParabola.selectedOptions[0].value;
      this.stsParabola.display(getCurrentMode());
    };

    parabolaDistAxisX.addEventListener('input', (event) => {
      this.stsParabola.distAxisX = Number(event.target.value);
      this.stsParabola.display(getCurrentMode());
    });

    parabolaDistAxisY.addEventListener('input', (event) => {
      this.stsParabola.distAxisY = Number(event.target.value);
      this.stsParabola.display(getCurrentMode());
    });

    parabolaHeight.addEventListener('input', (event) => {
      this.stsParabola.height = Number(event.target.value);
      this.stsParabola.display(getCurrentMode());
    });

    document.body.addEventListener('valuechanged', () => {
      if (
        this.themeController != null &&
        this.themeController.slider &&
        this.versions.length > 0
      ) {
        const date = parseInt(this.themeController.slider.getValue());
        const closestDate = Math.max(
          ...this.versions.map((v) => v.date).filter((d) => d <= date),
          this.versions[0].date
        );
        if (this.stsCircle && this.stsCircle.displayed) {
          this.stsCircle.selectVersion(closestDate);
          selectDate.value = closestDate.toString();
        }
        if (this.stsParabola && this.stsParabola.displayed) {
          this.stsParabola.middleDate = closestDate;
          this.stsParabola.display(getCurrentMode());
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
      const currentSTShape = this.tryGetCurrentSTShape();

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
      const cameraView = 2 * Math.tan(0.5 * degToRad(this.view.camera3D.fov));

      // Calculate an initial distance to fit the object within the camera's field of view
      let distance = objectSize / cameraView;

      // Add extra distance based on the object's size to ensure optimal positioning in view
      distance += objectSize;

      // Define an angle to adjust the camera position relative to the object (in degrees)
      const angle = 90;

      // Clone the camera's position for manipulations without affecting the original camera position
      const cameraPositionClone = this.view.camera3D.position.clone();
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
      this.view.camera3D.position.copy(newPosition);

      // Calculate the direction vector from the camera to the object
      const dirCameraObject = this.view.camera3D
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
        if (!this.tryGetCurrentSTShape()) return;
        this.view.camera3D.position.copy(
          getFocusTransformForCurrentSTShape().position
        );

        controls.target.setFromMatrixPosition(
          this.tryGetCurrentSTShape().stLayer.rootObject3D.matrixWorld
        );
        controls.update();
      }
      if (event.key == 'b') {
        const rootObject3D = this.tryGetCurrentSTShape().stLayer.rootObject3D;
        const box3 = new THREE.Box3Helper(
          new THREE.Box3().setFromObject(rootObject3D),
          0xff0000
        );
        box3.updateMatrixWorld();
        this.view.scene.add(box3);
        bHelpers.push(box3);
      }
      if (event.key == 'c') {
        bHelpers.forEach((bh) => {
          bh.removeFromParent();
        });
        bHelpers = [];
      }
      if (this.themeController && this.themeController.guidedTour) {
        const tour = this.themeController.guidedTour;
        const index = tour.currentIndex;
        if (event.key == '0' && index != tour.startIndex) {
          tour.goToStep(tour.getCurrentStep().previous);
          this.themeController.updateSlider();
        }
        if (event.key == '.' && index != tour.endIndex) {
          tour.goToStep(tour.getCurrentStep().next);
          this.themeController.updateSlider();
        }
      }
    });

    showElement('evolution_div');
    hideElement('shape_div');
  }

  getShapesWithUi = () => {
    return [
      {
        stShape: this.stsCircle,
        ui: this.uiCircle,
      },
      { stShape: this.stsParabola, ui: this.uiParabola },
    ];
  };

  tryGetCurrentSTShape = () => {
    try {
      return this.getShapesWithUi().find((element) => {
        return element.stShape.displayed;
      }).stShape;
    } catch {
      return false;
    }
  };

  canBeDisposed() {
    return true;
  }

  dispose() {
    if (this.themeController != null) {
      this.themeController.dispose();
    }

    const shape = this.tryGetCurrentSTShape();
    if (shape) shape.dispose();

    if (this.versions.length > 0) {
      this.versions.forEach((v) => {
        this.view.removeLayer(v.c3DTLayer.id);
      });
    }

    fetch(`${baseUrl}selectedThemeIds`, {
      method: 'POST',
      body: JSON.stringify({ selectedThemeIds: [] }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json());

    this.selectDataset.replaceChildren(this.selectDataset.firstElementChild);
    this.selectDataset.firstElementChild.selected = true;
    this.selectMode.hidden = true;
    this.selectMode.replaceChildren(this.selectMode.firstElementChild);
    this.selectMode.firstElementChild.selected = true;
    this.selectSTShape.hidden = true;
    this.defaultShape.selected = true;
    this.themeDiv.hidden = true;
    this.themesContainer.innerHTML = '';
    hideElement('evolution_div');
  }
}
