// Code adapted from https://www.npmjs.com/package/express
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let date = null;

app.post('/', (req, res) => {
    console.log(req.body.date);
    date = req.body.date;
    res.send(date);
})

app.get('/', (req, res) => {
    // res.send();
    res.send(date);
})

app.use(express.static(path.resolve(__dirname, '../')));

app.listen(8000)