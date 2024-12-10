import * as itowns from 'itowns';
import * as THREE from 'three';
import * as extensions3DTilesTemporal from '@ud-viz/extensions_3d_tiles_temporal';
import { ThemeController } from './ThemeController';

import { hideElement, showElement } from './uiUtils';
import { getFocusTransformForCurrentSTShape } from './object3DUtil';

const baseUrl = window.location.origin;

export class EvolutionView {
  constructor(configs, view, controls) {
    this.view = view;
    this.controls = controls;

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
    this.listDataset = document.getElementById('evolution_list_dataset');

    configs['3DTiles_STS_data']
      .concat(configs['3DTiles_temporal'])
      .forEach((config) => {
        datasetConfigs[config.id] = config.versions || [config];
        const dataOption = document.createElement('option');
        dataOption.value = config.id;
        dataOption.innerText = config.name;
        this.selectDataset.appendChild(dataOption);
        const ul = document.createElement('ul');
        ul.innerText = `${this.selectDataset.options.length - 1} ${
          config.name
        }`;
        this.listDataset.appendChild(ul);
      });

    const getDataset = () => {
      return datasetConfigs[this.selectDataset.selectedOptions[0].value];
    };
    const getMode = () => {
      const selectedMode = this.selectMode.selectedOptions[0];

      return selectedMode.index > 0 ? selectedMode.value : false;
    };

    const getShape = () => {
      const selectedShape = this.selectSTShape.selectedOptions[0];
      return selectedShape.index > 0 ? selectedShape.value : false;
    };

    const getThemes = () => {
      return configs['themes'].find(
        (config) => config.dataId == this.selectDataset.selectedOptions[0].value
      );
    };

    this.selectMode = document.getElementById('select_mode');
    this.listMode = document.getElementById('evolution_list_mode');

    for (const mode in extensions3DTilesTemporal.STS_DISPLAY_MODE) {
      const optionMode = document.createElement('option');
      optionMode.innerText = extensions3DTilesTemporal.STS_DISPLAY_MODE[mode];
      this.selectMode.appendChild(optionMode);
      const ul = document.createElement('ul');
      ul.innerText = `${this.selectMode.options.length - 1} ${
        optionMode.innerText
      }`;
      this.listMode.appendChild(ul);
    }

    this.listShape = document.getElementById('evolution_list_shape');
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
    this.listenersToggle = [];

    this.selectDataset.onchange = () => {
      this.listDataset.innerHTML = '';
      this.selectMode.hidden = false;
      this.listMode.hidden = false;
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

      fetch(`${baseUrl}/selectedDataId`, {
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
            themeSpan.innerText = `${config.key} ${config.name}`;
            themeLabel.appendChild(themeSpan);
            this.themesContainer.appendChild(themeLabel);
            themeInput.id = config.id;
            /* Adding an event listener when a key is pressed, if there is a match, it toggles the checked state of an input
       element and dispatches a new input event */
            if (config.key) {
              const newListener = (event) => {
                if (!getDataset() || !getMode() || !getShape()) return;
                if (event.key == config.key) {
                  themeInput.checked = !themeInput.checked;
                  themeInput.dispatchEvent(new Event('input'));
                }
              };
              this.listenersToggle.push(newListener);
            }
            themeInputs.push(themeInput);
          });
      } else {
        this.themeDiv.hidden = true;
        /* Removing event listeners from all the functions in the `listenersToggle`*/
        this.listenersToggle.forEach((listener) => {
          window.removeEventListener('keydown', listener);
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

          fetch(`${baseUrl}/selectedThemeIds`, {
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
            // document.body.appendChild(
            //   this.themeController.guidedTour.domElement
            // );
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

    let selectedFirstTime = true;
    this.selectSTShape.onchange = () => {
      this.listShape.hidden = true;
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
          this.stsCircle.display(getMode());
          this.uiCircle.hidden = false;
          radiusParameter.value = this.stsCircle.radius;
          heightParameter.value = this.stsCircle.height;
          break;
        case 'parabola':
          this.stsParabola.display(getMode());
          this.uiParabola.hidden = false;
          parabolaDistAxisX.value = this.stsParabola.distAxisX;
          parabolaDistAxisY.value = this.stsParabola.distAxisY;
          parabolaHeight.value = this.stsParabola.height;
          break;
      }
      this.focusCameraOnShape();
      if (selectedFirstTime) {
        this.listenersToggle.forEach((newListener) => {
          window.addEventListener('keydown', newListener);
        });
        selectedFirstTime = false;
      }
    };

    this.selectMode.onchange = () => {
      this.listMode.innerHTML = '';
      this.getShapesWithUi().forEach((element) => {
        this.selectSTShape.hidden = false;
        this.listShape.hidden = false;
        if (element.stShape != null && element.stShape.displayed) {
          element.stShape.display(getMode());
        }
      });
    };

    radiusParameter.addEventListener('input', (event) => {
      this.stsCircle.radius = Number(event.target.value);
      this.stsCircle.display(getMode());
      this.stsCircle.selectVersion(selectDate.selectedOptions[0].value);
    });

    heightParameter.addEventListener('input', (event) => {
      this.stsCircle.height = Number(event.target.value);
      this.stsCircle.display(getMode());
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
      this.stsParabola.display(getMode());
    };

    parabolaDistAxisX.addEventListener('input', (event) => {
      this.stsParabola.distAxisX = Number(event.target.value);
      this.stsParabola.display(getMode());
    });

    parabolaDistAxisY.addEventListener('input', (event) => {
      this.stsParabola.distAxisY = Number(event.target.value);
      this.stsParabola.display(getMode());
    });

    parabolaHeight.addEventListener('input', (event) => {
      this.stsParabola.height = Number(event.target.value);
      this.stsParabola.display(getMode());
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
          this.stsParabola.display(getMode());
          selectDateParabola.value = closestDate.toString();
        }
      }
    });

    this.listenerKeydown = (event) => {
      if (!getDataset()) {
        const options = this.selectDataset.options;
        const index = Number(event.key);
        const isNumber = event.key.match(/^[1-9]$/);
        if (isNumber && index >= 1 && index < options.length) {
          this.selectDataset.selectedIndex = event.key;
          this.selectDataset.dispatchEvent(new Event('change'));
        }
      } else if (!getMode()) {
        const options = this.selectMode.options;
        const index = Number(event.key);
        const isNumber = event.key.match(/^[1-9]$/);
        if (isNumber && index >= 1 && index < options.length) {
          this.selectMode.selectedIndex = event.key;
          this.selectMode.dispatchEvent(new Event('change'));
        }
      } else if (!getShape()) {
        const options = this.selectSTShape.options;
        const index = Number(event.key);
        const isNumber = event.key.match(/^[1-9]$/);
        if (isNumber && index >= 1 && index < options.length) {
          this.selectSTShape.selectedIndex = event.key;
          this.selectSTShape.dispatchEvent(new Event('change'));
        }
      }

      if (event.key == '*') {
        this.focusCameraOnShape();
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
    };

    window.addEventListener('keydown', this.listenerKeydown);

    showElement('evolution_div');
    hideElement('shape_div');
  }

  focusCameraOnShape() {
    if (!this.tryGetCurrentSTShape()) return;
    this.view.camera3D.position.copy(
      getFocusTransformForCurrentSTShape(this.view, this.tryGetCurrentSTShape())
        .position
    );

    this.controls.target.setFromMatrixPosition(
      this.tryGetCurrentSTShape().stLayer.rootObject3D.matrixWorld
    );
    this.controls.update();
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

    fetch(`${baseUrl}/selectedThemeIds`, {
      method: 'POST',
      body: JSON.stringify({ selectedThemeIds: [] }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json());

    this.selectDataset.replaceChildren(this.selectDataset.firstElementChild);
    this.selectDataset.firstElementChild.selected = true;
    this.listDataset.innerHTML = '';
    this.selectMode.hidden = true;
    this.listMode.hidden = true;
    this.selectMode.replaceChildren(this.selectMode.firstElementChild);
    this.selectMode.firstElementChild.selected = true;
    this.selectSTShape.hidden = true;
    this.listShape.hidden = true;
    this.defaultShape.selected = true;
    this.themeDiv.hidden = true;
    this.themesContainer.innerHTML = '';
    hideElement('evolution_div');

    window.removeEventListener('keydown', this.listenerKeydown);
    this.listenersToggle.forEach((listener) => {
      window.removeEventListener('keydown', listener);
    });
  }
}
