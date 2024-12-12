# UD-AugmentedModel-IMU

## Installation

```bash
npm i
```

## Build and run

In dev mode:

```bash
npm run build-dev
npm run host
```

In prod mode:

```bash
npm run start
```

The demo will be hosted on:

- Digital: `localhost:8000/digital`
- Tangible: `localhost:8000/tangible`

## Configuration

The content of the demo (3DTiles layers, themes, guided tours and slide shows) can be configured with the JSON files described below.

### 3DTiles layers

3DTiles layers can be configured in [`3DTiles_STS_data.json`](./digital/public/assets/config/layer/3DTiles_STS_data.json) and [`3DTiles_temporal.json`](./digital/public/assets/config/layer/3DTiles_temporal.json).

Each layer in `3DTiles_STS_data.json` must contain:

- an `id`
- a `name`
- a list of `versions`, where each version has:
  - an `id`
  - a `date`
  - an `url` to a 3DTiles tileset (without temporal extension)

Each layer in `3DTiles_temporal.json` must contain:

- an `id`
- a `name`
- an `url` to a 3DTiles tileset (with [temporal extension(https://github.com/VCityTeam/UD-SV/tree/master/3DTilesTemporalExtention)])
- a list of `dates` (dates of the temporal tileset)

### Themes

Themes can be configured in [themes.json](./assets/themes.json). A list of themes can be linked to a dataset with a `dataId` (must be the ID of a 3DTiles layer). A theme allows to link a guided tour, a slide show and dates.

Each theme must have:

- an `id`
- a `name`
- a `slideShowId` (the ID of a slide show of [`slide_show.json`](./tangible/public/assets/config/widget/slide_show.json))
- a `guidedTourId` (the ID of a guided tour of [`guided_tour.json`](./digital/public/assets/config/guided_tour.json))
- a list of `dates` in ascending order

### Slide show

Slide shows can be configured in [`slide_show.json`](./tangible/public/assets/config/widget/slide_show.json).

To configure the slide show, see the [widget doc](https://github.com/VCityTeam/UD-Viz/tree/master/packages/widget_slide_show).

### Guided tour

Guided tours can be configured in [`guided_tour.json`](./digital/public/assets/config/guided_tour.json).

To configure a tour, see the [guided tour documentation](https://github.com/VCityTeam/UD-Viz/blob/master/packages/widget_guided_tour/Readme.md#configuration).

### Tangible

[`camera.json`](./tangible/public/assets/config/camera.json) can be used to save a camera position (Vec3) and rotation (Euler).

```json
{
  "position": {
    "x": 1846119,
    "y": 5176047,
    "z": 1433
  },
  "rotation": {
    "x": 0,
    "y": 0,
    "z": -1.57
  }
}
```
