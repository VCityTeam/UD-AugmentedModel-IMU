import { GuidedTour } from '@ud-viz/widget_guided_tour';

export function getTourConfigFromThemes(themeConfigs, tourConfigs) {
  const tourId = themeConfigs[0].guidedTourId;
  const tour = tourConfigs.find((config) => config.tour.id == tourId);
  return tour;
}

export function createGuidedTourWidget(view, tourConfig) {
  const guidedTour = new GuidedTour(view, tourConfig.tour, tourConfig.media);
  guidedTour.goToStep(guidedTour.startIndex);
  guidedTour.domElement.classList.add('widget_guided_tour');
  guidedTour.mediaContainer.classList.add('media_container');
  guidedTour.previousButton.innerText = 'Previous';
  guidedTour.nextButton.innerText = 'Next';
  return guidedTour;
}
