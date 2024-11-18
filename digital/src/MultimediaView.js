import * as itowns from 'itowns';
import * as THREE from 'three';
import * as extensions3DTilesTemporal from '@ud-viz/extensions_3d_tiles_temporal';
import { ThemeController } from './ThemeController';

import { hideElement, showElement } from './uiUtils';

const baseUrl = 'http://localhost:8000/';

export class MultimediaView {
  constructor(configs, view) {
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
      .getElementById('multimedia_div')
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

    this.themeDiv = document.getElementById('media_div');
    this.themesContainer = document.getElementById('media_container');

    this.themeController = null;

    // EVENTS
    this.versions = [];
    const listenersToggle = [];

    this.selectDataset.onchange = () => {
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
        themesConfigs.themes.forEach((config) => {
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
          if (config.eventCode) {
            const newListener = (event) => {
              if (event.code == config.eventCode) {
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
            this.themeController.guidedTour.previousButton.remove();
            this.themeController.guidedTour.nextButton.remove();
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
    };

    window.addEventListener('keydown', (event) => {
      console.log(event.key);
    });

    showElement('multimedia_div');
    hideElement('shape_div');
  }

  dispose() {
    if (this.themeController != null) {
      this.themeController.dispose();
    }

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
    this.themeDiv.hidden = true;
    this.themesContainer.innerHTML = '';
    hideElement('multimedia_div');
  }
}
