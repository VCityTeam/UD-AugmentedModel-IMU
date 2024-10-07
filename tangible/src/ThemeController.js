import { Vector2, Vector3 } from 'three';
import { SlideShow } from '@ud-viz/widget_slide_show';
import { GuidedTour } from '@ud-viz/widget_guided_tour';
import { dragElement } from './draggable';

export class ThemeController {
  constructor(view, themeConfigs, slideShowConfigs, guidedTourConfig, extent) {
    this.slideShow = null;
    this.mergedSlideShowConfig = null;

    this.view = view;
    this.extent = extent;
    this.themeConfigs = themeConfigs;
    this.slideShowConfigs = slideShowConfigs;
    this.canvasConfig = this.slideShowConfigs.canvasConfig;
    this.guidedTourConfig = guidedTourConfig;

    this.setSlideShowConfig();
    this.createSlideShowWidget();
    if (guidedTourConfig != null) this.createGuidedTourWidget();
  }

  setSlideShowConfig() {
    this.stepByDate = {};
    const allSteps = [];
    let name = '';
    for (const themeConfig of this.themeConfigs) {
      const slideShowId = themeConfig.slideShowId;
      const dates = themeConfig.dates;
      const slideShow = this.slideShowConfigs.slides.find(
        (config) => config.id == slideShowId
      );
      for (let i = 0; i < dates.length; i++) {
        allSteps.push({
          date: dates[i],
          slideShowId: slideShowId,
          stepIndex: i,
        });
      }
      name += slideShow.name;
    }
    allSteps.sort((a, b) => a.date - b.date);
    const mergedSlideShow = {
      id: 'mergedSlideShow',
      name: name,
      folder: './assets/img',
      diapositives: [],
    };
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      if (!(step.date in this.stepByDate)) this.stepByDate[step.date] = i;
      const slideShow = this.slideShowConfigs.slides.find(
        (config) => config.id == step.slideShowId
      );
      const slideShowDiapo = slideShow.diapositives[step.stepIndex];
      mergedSlideShow.diapositives.push(slideShowDiapo);
    }
    this.mergedSlideShowConfig = {
      slides: [mergedSlideShow],
      textureRotation: 0,
    };
  }

  createSlideShowWidget() {
    this.slideShow = new SlideShow(
      this.view,
      this.mergedSlideShowConfig,
      this.extent
    );
    if (this.canvasConfig) {
      this.slideShow.setSizeInputs(
        new Vector2(this.canvasConfig.size.height, this.canvasConfig.size.width)
      );
      this.slideShow.setCoordinatesInputs(
        new Vector3(
          this.canvasConfig.position.x,
          this.canvasConfig.position.y,
          this.canvasConfig.position.z
        )
      );
    }
    this.slideShow.domElement.classList.add('widget_slide_show');
    document.body.appendChild(this.slideShow.domElement);
    const hideUIListener = (event) => {
      if (event.key.toLowerCase() != 's') return;

      if (this.slideShow.domElement.style.display == 'none') {
        this.slideShow.domElement.style.display = '';
      } else {
        this.slideShow.domElement.style.display = 'none';
      }
    };

    /* Hide the domElement without dispose the widget */
    window.addEventListener('keydown', hideUIListener);
  }

  createGuidedTourWidget() {
    this.guidedTour = new GuidedTour(
      this.view,
      this.guidedTourConfig.tour,
      this.guidedTourConfig.media
    );
    this.guidedTour.domElement.classList.add('widget_guided_tour');
    this.guidedTour.mediaContainer.classList.add('media_container');
    this.guidedTour.previousButton.remove();
    this.guidedTour.nextButton.remove();
    dragElement(this.guidedTour.mediaContainer, this.guidedTour.domElement);
    document.body.appendChild(this.guidedTour.domElement);
  }

  dispose() {
    this.slideShow.dispose();
    if (this.guidedTour) this.guidedTour.domElement.remove();
  }
}
