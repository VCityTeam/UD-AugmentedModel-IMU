// Code adapted from https://www.npmjs.com/package/express
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let date = null;

app.post('/date', (req, res) => {
  date = req.body.date;
  res.send(date);
});

app.get('/date', (req, res) => {
  // res.send();
  res.send(date);
});

app.use('/digital', express.static(path.join(__dirname, '../digital/public')));
app.use(
  '/tangible',
  express.static(path.join(__dirname, '../tangible/public'))
);
app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.listen(8000);
