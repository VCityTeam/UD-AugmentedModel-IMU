import { GuidedTour } from '@ud-viz/widget_guided_tour';

export class GuidedTourController {
  constructor() {
    this.stepByDate = {};
  }

  getTourConfigFromThemes(themeConfigs, tourConfigs) {
    this.stepByDate = {};
    const allSteps = [];
    let mergedMedia = [];
    let name = '';
    for (const themeConfig of themeConfigs) {
      const tourId = themeConfig.guidedTourId;
      const dates = themeConfig.dates;
      const tour = tourConfigs.find((config) => config.tour.id == tourId);
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
      if (!(step.date in this.stepByDate))
        this.stepByDate[step.date] = step.stepIndex;
      const tour = tourConfigs.find(
        (config) => config.tour.id == step.tourId
      ).tour;
      const tourStep = tour.steps[step.stepIndex];
      tourStep.previous = Math.max(i - 1, mergedTour.startIndex);
      tourStep.next = Math.min(i + 1, mergedTour.endIndex);
      mergedTour.steps.push(tourStep);
    }
    return { tour: mergedTour, media: mergedMedia };
  }

  createWidget(view, tourConfig) {
    const guidedTour = new GuidedTour(view, tourConfig.tour, tourConfig.media);
    guidedTour.goToStep(guidedTour.startIndex);
    guidedTour.domElement.classList.add('widget_guided_tour');
    guidedTour.mediaContainer.classList.add('media_container');
    guidedTour.previousButton.innerText = 'Previous';
    guidedTour.nextButton.innerText = 'Next';
    return guidedTour;
  }
}
