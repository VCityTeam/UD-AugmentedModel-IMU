import { SlideShow } from '@ud-viz/widget_slide_show';

export class ThemeController {
  constructor(view, themeConfigs, slideShowConfigs, extent) {
    this.slideShow = null;
    this.mergedSlideShowConfig = null;

    this.view = view;
    this.extent = extent;
    this.themeConfigs = themeConfigs;
    this.slideShowConfigs = slideShowConfigs;

    this.setSlideShowConfig();
    this.createSlideShowWidget();
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
  }

  dispose() {
    this.slideShow.dispose();
    this.guidedTour = null;
  }
}
