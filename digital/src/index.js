import {
  initScene,
  loadMultipleJSON,
} from '@ud-viz/utils_browser';
import proj4 from 'proj4';
import * as itowns from 'itowns';
import * as THREE from 'three';
import * as extensions3DTilesTemporal from '@ud-viz/extensions_3d_tiles_temporal';

loadMultipleJSON(['./assets/config/extents.json',
  './assets/config/crs.json',
  './assets/config/layer/3DTiles_temporal.json',
  './assets/config/layer/3DTiles_STS_data.json',
  './assets/config/layer/base_maps.json',
  './assets/config/layer/elevation.json',]).then(
    (configs) => {
      proj4.defs(configs['crs'][0].name, configs['crs'][0].transform);

      // const slides = configs['slide_show'].slides;

      // for (let slide in slides) {
      //   const button = document.createElement('button');
      //   button.innerText = slides[slide].name;
      //   document.body.appendChild(button);
      //   button.onclick = () => {
      //     const baseUrl = 'http://localhost:8000/';
      //     fetch(`${baseUrl}date`, {
      //       method: 'POST',
      //       body: JSON.stringify({ date: slides[slide].name }),
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //     })
      //       .then((response) => response.text())
      //       .then((html) => console.log(html));
      //   };
      // }

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
      initScene(
        view.camera.camera3D,
        view.mainLoop.gfxEngine.renderer,
        view.scene
      );

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
        new itowns.ElevationLayer(
          configs['elevation']['layer_name'],
          {
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
          }
        )
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
      const ui = document.createElement('div');
      ui.id = 'stp_ui';
      document.body.appendChild(ui);

      const divSelect = document.createElement('div');
      ui.appendChild(divSelect);

      const divUiSTS = document.createElement('div');
      ui.appendChild(divUiSTS);

      const selectDataset = document.createElement('select');
      divSelect.appendChild(selectDataset);
      const datasetGratteCiel = document.createElement('option');
      datasetGratteCiel.value = 'gratteCiel';
      datasetGratteCiel.innerText = 'GratteCiel temporal';
      selectDataset.appendChild(datasetGratteCiel);

      const getDataset = () => {
        return [configs['3DTiles_temporal'][2]];
      }

      //SEQUENTIAL or CHRONOLOGICAL
      const selectMode = document.createElement('select');
      // selectMode.hidden = true;
      divSelect.appendChild(selectMode);
      const optionDefaultMode = document.createElement('option');
      optionDefaultMode.innerText = 'Choose a Mode';
      optionDefaultMode.selected = true;
      optionDefaultMode.disabled = true;
      optionDefaultMode.hidden = true;
      selectMode.appendChild(optionDefaultMode);

      for (const mode in extensions3DTilesTemporal.STS_DISPLAY_MODE) {
        const optionMode = document.createElement('option');
        optionMode.innerText =
          extensions3DTilesTemporal.STS_DISPLAY_MODE[mode];
        selectMode.appendChild(optionMode);
      }

      const getCurrentMode = () => {
        if (selectMode.selectedOptions[0] != optionDefaultMode)
          return selectMode.selectedOptions[0].value;
        return undefined;
      };

      const selectSTShape = document.createElement('select');
      selectSTShape.hidden = true;
      divSelect.appendChild(selectSTShape);
      const optionDefaultShape = document.createElement('option');
      optionDefaultShape.innerText = 'Choose a Shape';
      optionDefaultShape.disabled = true;
      optionDefaultShape.hidden = true;
      selectSTShape.appendChild(optionDefaultShape);

      // CIRCLE HTML
      const optionCircle = document.createElement('option');
      optionCircle.value = 'circle';
      optionCircle.innerText = 'Circle';
      selectSTShape.appendChild(optionCircle);

      const uiCircle = document.createElement('div');
      uiCircle.hidden = true;
      divUiSTS.appendChild(uiCircle);

      const radiusParameterLabel = document.createElement('label');
      radiusParameterLabel.innerText = 'Radius';
      uiCircle.appendChild(radiusParameterLabel);
      const radiusParameter = document.createElement('input');
      radiusParameter.type = 'number';
      radiusParameter.name = 'Radius';
      uiCircle.appendChild(radiusParameter);

      const heightParameterLabel = document.createElement('label');
      heightParameterLabel.innerText = 'Height';
      uiCircle.appendChild(heightParameterLabel);
      const heightParameter = document.createElement('input');
      heightParameter.type = 'number';
      heightParameter.name = 'Height';
      uiCircle.appendChild(heightParameter);

      const dateSelectLabel = document.createElement('label');
      dateSelectLabel.innerText = 'Year';
      uiCircle.appendChild(dateSelectLabel);
      const selectDate = document.createElement('select');
      uiCircle.appendChild(selectDate);

      const updateCheckBoxLabel = document.createElement('label');
      updateCheckBoxLabel.innerText = 'Freeze rotation';
      uiCircle.appendChild(updateCheckBoxLabel);
      const updateCheckBox = document.createElement('input');
      updateCheckBox.type = 'checkbox';
      updateCheckBox.name = 'update';
      uiCircle.appendChild(updateCheckBox);

      // PARABOLA HTML
      const optionParabola = document.createElement('option');
      optionParabola.value = 'parabola';
      optionParabola.innerText = 'Parabola';
      selectSTShape.appendChild(optionParabola);

      const uiParabola = document.createElement('div');
      uiParabola.hidden = true;
      divUiSTS.appendChild(uiParabola);

      const labelDistAxisX = document.createElement('label');
      labelDistAxisX.innerText = 'Distance on X axis';
      uiParabola.appendChild(labelDistAxisX);

      const parabolaDistAxisX = document.createElement('input');
      parabolaDistAxisX.type = 'number';
      parabolaDistAxisX.name = 'distAxisX';
      uiParabola.appendChild(parabolaDistAxisX);

      const labelDistAxisY = document.createElement('label');
      labelDistAxisY.innerText = 'Distance on Y axis';
      uiParabola.appendChild(labelDistAxisY);
      const parabolaDistAxisY = document.createElement('input');
      parabolaDistAxisY.type = 'number';
      parabolaDistAxisY.name = 'distAxisY';
      uiParabola.appendChild(parabolaDistAxisY);

      const labelHeight = document.createElement('label');
      labelHeight.innerText = 'Height';
      uiParabola.appendChild(labelHeight);
      const parabolaHeight = document.createElement('input');
      parabolaHeight.type = 'number';
      parabolaHeight.name = 'Height';
      uiParabola.appendChild(parabolaHeight);

      const parabolaDateSelectLabel = document.createElement('label');
      parabolaDateSelectLabel.innerText = 'Year';
      uiParabola.appendChild(parabolaDateSelectLabel);
      const selectDateParabola = document.createElement('select');
      uiParabola.appendChild(selectDateParabola);

      // CREATE 3DTILES

      let versions = [];
      let stsCircle = null;
      let stsParabola = null;

      optionDefaultShape.selected = true;
      if (versions.length > 0) {
        versions.forEach((v) => {
          view.removeLayer(v.c3DTLayer.id);
        });
        versions = [];
      }
      const c3dtilesConfigs = getDataset();
      const temporalsWrappers = [];
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
            temporalsWrappers.push(
              new extensions3DTilesTemporal.Temporal3DTilesLayerWrapper(
                c3DTilesLayer
              )
            );

            if (date == Math.min(...datesJSON)) {
              temporalsWrappers[temporalsWrappers.length - 1].styleDate =
                date + 1;
            } else {
              temporalsWrappers[temporalsWrappers.length - 1].styleDate =
                date - 2;
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
        // STSCircle
        if (stsCircle != null) {
          stsCircle.dispose();
          stsCircle.setSTLayer(stLayer);
          uiCircle.hidden = true;
        } else {
          stsCircle = new extensions3DTilesTemporal.STSCircle(
            stLayer
          );
        }

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
        if (stsParabola != null) {
          stsParabola.dispose();
          stsParabola.setSTLayer(stLayer);
          uiParabola.hidden = true;
        } else {
          stsParabola = new extensions3DTilesTemporal.STSParabola(
            stLayer
          );
        }

        selectDateParabola.innerHTML = '';
        versions.forEach((v) => {
          const date = v.date;
          const optionDate = document.createElement('option');
          optionDate.innerText = date.toString();
          if (date == stsParabola.middleDate) optionDate.selected = true;
          selectDateParabola.appendChild(optionDate);
        });
      });

      // EVENTS

      const getShapesWithUi = () => {
        return [
          {
            stShape: stsCircle,
            ui: uiCircle,
          },
          { stShape: stsParabola, ui: uiParabola },
        ];
      };

      selectSTShape.onchange = () => {
        console.log(selectSTShape.selectedOptions[0].value);
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
        // Send to the server the correct value
        const baseUrl = 'http://localhost:8000/';
        fetch(`${baseUrl}date`, {
          method: 'POST',
          body: JSON.stringify({ date: selectDate.selectedOptions[0].value }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.text())
          .then((html) => console.log(html));
      };

      selectDateParabola.onchange = () => {
        stsParabola.middleDate =
          selectDateParabola.selectedOptions[0].value;
        stsParabola.display(getCurrentMode());
        // Send to the server the correct value
        const baseUrl = 'http://localhost:8000/';
        fetch(`${baseUrl}date`, {
          method: 'POST',
          body: JSON.stringify({ date: stsParabola.middleDate }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.text())
          .then((html) => console.log(html));
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
    }
  );
