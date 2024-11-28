import * as itowns from 'itowns';
import { ThemeController } from './ThemeController';
import { createPin } from './object3DUtil';

import { hideElement, showElement } from './uiUtils';

const baseUrl = window.location.origin;

export class MultimediaView {
  constructor(configs, view) {
    this.view = view;
    this.c3DTilesLayer = null;
    this.frameRequester = null;

    // CREATE HTML
    this.selectDataset = document
      .getElementById('multimedia_div')
      .getElementsByClassName('select_dataset')[0];
    const datasetConfig = {};
    configs['3DTiles'].forEach((config) => {
      datasetConfig[config.id] = config;
      const dataOption = document.createElement('option');
      dataOption.value = config.id;
      dataOption.innerText = config.name;
      this.selectDataset.appendChild(dataOption);
    });

    const getDataset = () => {
      return datasetConfig[this.selectDataset.selectedOptions[0].value];
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
      this.clean();

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
                const pin = createPin(config.pin.position, config.pin.sprite);
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
        this.frameRequester = this.view.addFrameRequester(
          itowns.MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
          this.updatePinsVisibility.bind(this)
        );
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
        Object.entries(this.pins).forEach(([themeId, pin]) => {
          pin.visible = this.defaultDisplayed || this.themeId == themeId;
        });
      };
      if (Object.keys(themes).length > 0) {
        this.selectMedia.dispatchEvent(new Event('change'));
      }

      const c3dtilesConfig = getDataset();
      this.c3DTilesLayer = new itowns.C3DTilesLayer(
        c3dtilesConfig.id,
        {
          name: c3dtilesConfig.id,
          source: new itowns.C3DTilesSource({
            url: c3dtilesConfig.url,
          }),
        },
        this.view
      );
      itowns.View.prototype.addLayer.call(this.view, this.c3DTilesLayer);
    };

    window.addEventListener('keydown', (event) => {
      if (this.themeController && this.themeController.guidedTour) {
        const tour = this.themeController.guidedTour;
        if (event.key == '0' && tour.currentIndex > tour.startIndex) {
          tour.currentIndex--;
        }
        if (event.key == '.' && tour.currentIndex < tour.endIndex) {
          tour.currentIndex++;
        }
        fetch(`${baseUrl}/stepIndex`, {
          method: 'POST',
          body: JSON.stringify({
            stepIndex: tour.currentIndex,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    });
    showElement('multimedia_div');
    hideElement('shape_div');
  }

  updatePinsVisibility() {
    Object.entries(this.pins).forEach(([themeId, pin]) => {
      pin.visible =
        (this.defaultDisplayed || this.themeId == themeId) &&
        pin.position.distanceTo(this.view.camera3D.position) > 1000;
    });
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
    if (this.frameRequester)
      this.view.removeFrameRequester(
        itowns.MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
        this.updatePinsVisibility
      );
  }

  canBeDisposed() {
    return this.themeId == null || this.defaultDisplayed;
  }

  dispose() {
    this.clean();
    this.view.removeLayer(this.c3DTilesLayer.id);
    this.selectDataset.replaceChildren(this.selectDataset.firstElementChild);
    this.selectDataset.firstElementChild.selected = true;
    hideElement('multimedia_div');
  }
}
