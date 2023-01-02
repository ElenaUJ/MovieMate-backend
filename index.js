const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path');

// Variable for Express' functionality to configure web server
const app = express();

let topMovies = [
  {
    title: 'Forrest Gump',
    director: 'Robert Zemeckis',
    release: '1994',
  },
  {
    title: 'The Truman Show',
    director: 'Peter Weir',
    release: '1998',
  },
  {
    title: 'Before Sunrise',
    director: 'Richard Linklater',
    release: '1995',
  },
  {
    title: 'Sonic the Hedgehog 2',
    director: 'Jeff Fowler',
    release: '2022',
  },
  {
    title: 'Avatar',
    director: 'James Cameron',
    release: '2009',
  },
  {
    title: 'Pulp Fiction',
    director: 'Quentin Tarantino',
    release: '1994',
  },
  {
    title: 'Gone with the Wind',
    director: 'Victor Fleming',
    release: '1939',
  },
  {
    title: 'Madagascar',
    director: 'Eric Darnell, Tom McGrath',
    release: '2005',
  },
  {
    title: 'The Green Mile',
    director: 'Frank Darabont',
    release: '1999',
  },
  {
    title: 'Dead Poets Society',
    director: 'Peter Weir',
    release: '1989',
  },
];

// Logging requests to console
app.use(morgan('common'));
// Additionally, creating log stream in log.txt file (flags: 'a' instructs to append logs to file)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});
app.use(morgan('common', { stream: accessLogStream }));

// Question: What does this actually do? Wouldn't the request to send the documentation file work regardless?
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.send('Movie database is being contructed.');
});

app.get('/movies', function (req, res) {
  res.json(topMovies);
});

app.get('/documentation', function (req, res) {
  res.sendFile('public/documentation.html', { root: __dirname });
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, function () {
  console.log('MyFlix app is listening to port 8080.');
});
