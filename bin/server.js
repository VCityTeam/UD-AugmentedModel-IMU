// Code adapted from https://www.npmjs.com/package/express
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

console.info(`
░█▀▀▄░▒█░▒█░▒█▀▀█░▒█▀▄▀█░▒█▀▀▀░▒█▄░▒█░▀▀█▀▀░▒█▀▀▀░▒█▀▀▄░░░▒█▀▄▀█░▒█▀▀▀█░▒█▀▀▄░▒█▀▀▀░▒█░░░
▒█▄▄█░▒█░▒█░▒█░▄▄░▒█▒█▒█░▒█▀▀▀░▒█▒█▒█░░▒█░░░▒█▀▀▀░▒█░▒█░░░▒█▒█▒█░▒█░░▒█░▒█░▒█░▒█▀▀▀░▒█░░░
▒█░▒█░░▀▄▄▀░▒█▄▄▀░▒█░░▒█░▒█▄▄▄░▒█░░▀█░░▒█░░░▒█▄▄▄░▒█▄▄█░░░▒█░░▒█░▒█▄▄▄█░▒█▄▄█░▒█▄▄▄░▒█▄▄█
  `);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let date = null;
let selectedDataId = null;
let selectedThemeIds = [];
let stepIndex = null;

app.post('/date', (req, res) => {
  date = req.body.date;
  res.send(date);
});

app.get('/date', (req, res) => {
  res.send(date);
});

app.post('/selectedThemeIds', (req, res) => {
  selectedThemeIds = req.body.selectedThemeIds;
  console.log('New Selected Theme IDs:', selectedThemeIds);
  res.send(selectedThemeIds);
});

app.get('/selectedThemeIds', (req, res) => {
  res.send(selectedThemeIds);
});

app.post('/selectedDataId', (req, res) => {
  selectedDataId = req.body.selectedDataId;
  console.log('New Selected Data ID:', selectedDataId);
  res.send(selectedDataId);
});

app.get('/selectedDataId', (req, res) => {
  res.send(selectedDataId);
});

app.post('/stepIndex', (req, res) => {
  stepIndex = req.body.stepIndex.toString();
  res.send(stepIndex);
});

app.get('/stepIndex', (req, res) => {
  res.send(stepIndex);
});

app.use('/digital', express.static(path.join(__dirname, '../digital/public')));
app.use(
  '/tangible',
  express.static(path.join(__dirname, '../tangible/public'))
);
app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.listen(8000);

console.info(`
  ░▄▀▀▒██▀▒█▀▄░█▒█▒██▀▒█▀▄░░░▄▀▀░▀█▀▒▄▀▄▒█▀▄░▀█▀▒██▀░█▀▄
  ▒▄██░█▄▄░█▀▄░▀▄▀░█▄▄░█▀▄▒░▒▄██░▒█▒░█▀█░█▀▄░▒█▒░█▄▄▒█▄▀
`);
