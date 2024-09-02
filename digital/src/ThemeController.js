import { GuidedTour } from '@ud-viz/widget_guided_tour';
import { rSlider } from './rSlider/rSlider.min.js';


export class ThemeController {
  constructor(view, themeConfigs, tourConfigs) {
    this.stepByDate = {};
    this.guidedTour = null;
    this.slider = null;
    this.mergedTourConfig = null;
    this.view = view;
    this.themeConfigs = themeConfigs;
    this.tourConfigs = tourConfigs;

    this.setTourConfig();
    this.createGuidedTourWidget();
    this.createSlider();
  }

  setTourConfig() {
    this.stepByDate = {};
    const allSteps = [];
    let mergedMedia = [];
    let name = '';
    for (const themeConfig of this.themeConfigs) {
      const tourId = themeConfig.guidedTourId;
      const dates = themeConfig.dates;
      const tour = this.tourConfigs.find((config) => config.tour.id == tourId);
      for (let i = 0; i < dates.length; i++) {
        allSteps.push({ date: dates[i], tourId: tourId, stepIndex: i });
      }
      mergedMedia = mergedMedia.concat(tour.media);
      name += tour.tour.name;
    }
    allSteps.sort((a, b) => a.date - b.date);
    const mergedTour = {
      id: 'mergedTour',
      name: name,
      startIndex: 0,
      endIndex: allSteps.length - 1,
      steps: [],
    };
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      if (!(step.date in this.stepByDate)) this.stepByDate[step.date] = i;
      const tour = this.tourConfigs.find(
        (config) => config.tour.id == step.tourId
      ).tour;
      const tourStep = tour.steps[step.stepIndex];
      tourStep.previous = Math.max(i - 1, mergedTour.startIndex);
      tourStep.next = Math.min(i + 1, mergedTour.endIndex);
      mergedTour.steps.push(tourStep);
    }
    this.mergedTourConfig = { tour: mergedTour, media: mergedMedia };
  }

  createGuidedTourWidget() {
    this.guidedTour = new GuidedTour(
      this.view,
      this.mergedTourConfig.tour,
      this.mergedTourConfig.media
    );
    this.guidedTour.domElement.classList.add('widget_guided_tour');
    this.guidedTour.mediaContainer.classList.add('media_container');
    this.guidedTour.previousButton.innerText = 'Previous';
    this.guidedTour.nextButton.innerText = 'Next';
  }

  createSlider() {
    const dates = Object.keys(this.stepByDate);
    this.slider = new rSlider({
      target: '#theme_slider',
      values: dates,
      labels: true,
      set: [dates[0]],
      onChange: function (val) {
        this.guidedTour.goToStep(this.stepByDate[val]);
      }.bind(this),
    });
  }

  dispose() {
    this.guidedTour.domElement.remove();
    this.guidedTour = null;
    document.getElementsByClassName('rs-container')[0].remove();
    this.slider = null;
  }
}
