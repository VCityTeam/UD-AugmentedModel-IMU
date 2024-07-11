// Code adapted from https://www.npmjs.com/package/express
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let date = null;

app.post('/date', (req, res) => {
    console.log('POST');
    date = req.body.date;
    // res.send(date);
})

app.get('/date', (req, res) => {
    // res.send();
    console.log('GET');
    res.send(date);
})

console.log(path.join(__dirname , "../app1"));
app.use("/digital", express.static(path.join(__dirname, "../app1")));
app.use("/tangible", express.static(path.join(__dirname, "../app2")));

// app.use(express.static(path.resolve(__dirname, '../')));


app.listen(8000)