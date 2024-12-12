import { GuidedTour } from '@ud-viz/widget_guided_tour';
import { rSlider } from './rSlider/rSlider.min.js';

export class ThemeController {
  constructor(view, themeConfigs, tourConfigs) {
    this.stepByDate = {};
    this.guidedTour = null;
    this.mergedTourConfig = null;
    this.slider = null;
    this.baseUrl = window.location.origin;

    this.view = view;
    this.themeConfigs = themeConfigs;
    this.tourConfigs = tourConfigs;

    this.setTourConfig();
    this.createGuidedTourWidget();
    this.createSlider();
    this.sendEventUpdate(this.guidedTour.currentIndex);
  }

  setTourConfig() {
    this.stepByDate = {};
    const allSteps = [];
    let mergedMedia = [];
    let name = '';
    for (const themeConfig of this.themeConfigs) {
      const tourId = themeConfig.guidedTourId;
      const tour = this.tourConfigs.find((config) => config.tour.id == tourId);
      const dates = themeConfig.dates || Array(tour.tour.endIndex + 1).fill(0);
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
    this.guidedTour.previousButton.id = 'previous';
    this.guidedTour.nextButton.id = 'next';
    fetch(`${this.baseUrl}/guidedTourConfig`, {
      method: 'POST',
      body: JSON.stringify(this.mergedTourConfig),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  createSlider() {
    const dates = Object.keys(this.stepByDate);
    this.slider = new rSlider({
      target: '#theme_slider',
      values: dates,
      labels: true,
      set: [dates[0]],
      onChange: (val) => {
        if (this.guidedTour != null) {
          this.guidedTour.goToStep(this.stepByDate[val]);
          this.updateButtonsVisibility();
          this.sendEventUpdate(this.stepByDate[val]);
        }
      },
    });

    this.guidedTour.nextButton.addEventListener('click', () => {
      this.updateSlider();
    });
    this.guidedTour.previousButton.addEventListener('click', () => {
      this.updateSlider();
    });
  }

  updateSlider() {
    const stepIndex = this.guidedTour.currentIndex;
    this.updateButtonsVisibility();
    this.sendEventUpdate(stepIndex);
    const closestIndex = Math.max(
      ...Object.values(this.stepByDate).filter((x) => x <= stepIndex)
    );
    const date = Object.keys(this.stepByDate).find(
      (d) => this.stepByDate[d] == closestIndex
    );
    this.slider.setCursor(null, date);
  }

  sendEventUpdate(stepIndex) {
    fetch(`${this.baseUrl}/stepIndex`, {
      method: 'POST',
      body: JSON.stringify({
        stepIndex: stepIndex,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  updateButtonsVisibility() {
    const step = this.guidedTour.currentIndex;
    this.guidedTour.previousButton.hidden = step == this.guidedTour.startIndex;
    this.guidedTour.nextButton.hidden = step == this.guidedTour.endIndex;
  }

  dispose() {
    this.guidedTour.domElement.remove();
    this.guidedTour.previousButton.remove();
    this.guidedTour.nextButton.remove();
    document.getElementsByClassName('rs-container')[0].remove();
  }
}
