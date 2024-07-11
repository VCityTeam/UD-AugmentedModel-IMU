import { loadMultipleJSON } from '@ud-viz/utils_browser';

loadMultipleJSON(['http://localhost:8000/assets/slide_show.json']).then(
  (configs) => {
    const slides = configs['slide_show'].slides;

    for (let slide in slides) {
      const button = document.createElement('button');
      button.innerText = slides[slide].name;
      document.body.appendChild(button);
      button.onclick = () => {
        const baseUrl = 'http://localhost:8000/';
        fetch(`${baseUrl}date`, {
          method: 'POST',
          body: JSON.stringify({ date: slides[slide].name }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.text())
          .then((html) => console.log(html));
      };
    }
  }
);
