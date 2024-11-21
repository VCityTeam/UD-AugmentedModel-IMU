import * as itowns from 'itowns';
import * as extensions3DTilesTemporal from '@ud-viz/extensions_3d_tiles_temporal';
import { ThemeController } from './ThemeController';
import { createPin } from './object3DUtil';

import { hideElement, showElement } from './uiUtils';

const baseUrl = window.location.origin;

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
    this.selectMedia = document.getElementById('select_media');

    this.themeController = null;
    this.themeId = null;
    this.defaultDisplayed = true;

    // EVENTS
    this.versions = [];
    this.listenersToggle = [];
    this.pins = {};

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
      const themes = {};
      this.pins = {};
      if (themesConfigs != undefined) {
        this.themeDiv.hidden = false;
        this.selectMedia.innerHTML = '';
        themesConfigs.themes
          .filter((theme) => theme.type == 'multimedia')
          .forEach((config) => {
            themes[config.id] = config;
            const mediaOption = document.createElement('option');
            this.selectMedia.appendChild(mediaOption);
            mediaOption.value = config.id;
            if (config.id == 'default') {
              mediaOption.innerText = config.name;
              mediaOption.selected = true;
            } else {
              mediaOption.innerText = '#' + config.key + ' ' + config.name;
              if (config.pin) {
                const pin = createPin(config.pin.position, baseUrl + '/' + config.pin.sprite);
                this.view.scene.add(pin);
                this.pins[config.id] = pin;
              }
            }
            /* Adding an event listener when a key is pressed, if there is a match, it toggles the checked state of an input
              element and dispatches a new input event */
            const newListener = (event) => {
              if (event.key == config.key) {
                mediaOption.selected = true;
                this.selectMedia.dispatchEvent(new Event('change'));
              }
            };
            this.listenersToggle.push(newListener);
            window.addEventListener('keypress', newListener);
          });
        this.view.notifyChange();
      } else {
        this.clean();
      }
      this.selectMedia.onchange = () => {
        if (this.themeId == this.selectMedia.selectedOptions[0].value) return;
        this.themeId = this.selectMedia.selectedOptions[0].value;
        this.defaultDisplayed = this.themeId == 'default';

        if (this.themeController != null) {
          this.themeController.dispose();
          this.themeController = null;
        }

        fetch(`${baseUrl}/selectedThemeIds`, {
          method: 'POST',
          body: JSON.stringify({ selectedThemeIds: [this.themeId] }),
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((response) => response.json());

        this.themeController = new ThemeController(
          this.view,
          [themes[this.themeId]],
          configs['guided_tour']
        );
        if (this.themeController.guidedTour.mediaConfig.length > 0) {
          document.body.appendChild(this.themeController.guidedTour.domElement);
          this.themeController.guidedTour.previousButton.remove();
          this.themeController.guidedTour.nextButton.remove();
        }
      };
      if (Object.keys(themes).length > 0) {
        this.selectMedia.dispatchEvent(new Event('change'));
      }

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

    showElement('multimedia_div');
    hideElement('shape_div');
  }

  clean() {
    this.themeDiv.hidden = true;
    this.themeId = null;

    if (this.themeController != null) {
      this.themeController.dispose();
      this.themeController = null;
    }

    fetch(`${baseUrl}/selectedThemeIds`, {
      method: 'POST',
      body: JSON.stringify({ selectedThemeIds: [] }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json());

    this.selectMedia.innerHTML = '';

    this.listenersToggle.forEach((listener) => {
      window.removeEventListener('keypress', listener);
    });

    Object.values(this.pins).forEach((pin) => {
      this.view.scene.remove(pin);
      pin.material.dispose();
    });
    this.view.notifyChange();
  }

  canBeDisposed() {
    return this.themeId == null || this.defaultDisplayed;
  }

  dispose() {
    this.clean();

    if (this.versions.length > 0) {
      this.versions.forEach((v) => {
        this.view.removeLayer(v.c3DTLayer.id);
      });
    }

    this.selectDataset.replaceChildren(this.selectDataset.firstElementChild);
    this.selectDataset.firstElementChild.selected = true;
    hideElement('multimedia_div');
  }
}
