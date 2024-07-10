const udviz = window.udviz;

udviz
  .loadMultipleJSON([
    './assets/config/extents.json',
    './assets/config/crs.json',
    './assets/config/widget/slide_show.json',
  ])
  .then((configs) => {
    udviz.proj4.default.defs(
      configs['crs'][0].name,
      configs['crs'][0].transform
    );

    const extent = new udviz.itowns.Extent(
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
    const view = new udviz.itowns.PlanarView(viewDomElement, extent);

    // eslint-disable-next-line no-constant-condition
    if ('RUN_MODE' == 'production')
      loadingScreen(view, ['UD-VIZ', 'UDVIZ_VERSION']);

    // init scene 3D
    udviz.initScene(
      view.camera.camera3D,
      view.mainLoop.gfxEngine.renderer,
      view.scene
    );

    const fitExtent = () => {
      udviz.cameraFitRectangle(
        view.camera.camera3D,
        new udviz.THREE.Vector2(extent.west, extent.south),
        new udviz.THREE.Vector2(extent.east, extent.north)
      );
      view.notifyChange(view.camera.camera3D);
    };
    fitExtent();
    view.camera.camera3D.rotation.set(0, 0, 0);

    // /// SLIDESHOW MODULE
    // 3D Setup
    const slideShow = new udviz.widgetSlideShow.SlideShow(
      view,
      configs['slide_show'],
      extent
    );
    slideShow.domElement.classList.add('widget_slide_show');

    slideShow.addListeners();
    view.scene.add(slideShow.plane);

    // Add UI
    const uiDomElement = document.createElement('div');
    uiDomElement.classList.add('full_screen');
    document.body.appendChild(uiDomElement);
    uiDomElement.appendChild(slideShow.domElement);

    const hideUIListener = (event) => {
      if (event.key.toLowerCase() != 's') return;

      if (slideShow.domElement.style.display == 'none') {
        slideShow.domElement.style.display = '';
      } else {
        slideShow.domElement.style.display = 'none';
      }
    };

    /* Hide the domElement without dispose the widget */
    window.addEventListener('keydown', hideUIListener);
  });