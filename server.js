var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/home.html');
});

app.listen(8501, function () {
    console.log('Example app listening on port 8501!');
});