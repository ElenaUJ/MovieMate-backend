const express = require('express');
const app = express();

// Parsing incoming requests
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS middleware
const cors = require('cors');
let allowedOrigins = [
  'http://localhost:1234',
  'https://my-moviemate.netlify.app',
  'http://localhost:4200',
  'https://elenauj.github.io',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn’t found on the list of allowed origins
        let message =
          'The CORS policy for this application doesn’t allow access from origin ' +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

// Authentication (auth.js is handling login endpoint and generating JWT tokens)
let auth = require('./auth.js')(app);
const passport = require('passport');

require('./passport.js');

// Input validation
const { check, validationResult } = require('express-validator');

// Integrating Mongoose and connecting to MongoDB
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

// Suppresses deprecation warning
mongoose.set('strictQuery', true);
mongoose.connect(process.env.CONNECTION_URI);
// Local database
//mongoose.connect('mongodb://localhost:27017/myFlixDB');

//Routing of static files (e.g. documentation.html)
app.use(express.static('public'));

// Logging requests
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

app.use(morgan('common'));
app.use(morgan('common', { stream: accessLogStream }));

//------------------ Endpoint handlers ------------------//
app.get('/', function (req, res) {
  res.send('Movie database is being contructed.');
});

// Returns list of all movies
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Movies.find()
      .then(function (movies) {
        res.status(200).json(movies);
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Gets data about single movie by title
app.get(
  '/movies/:title',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Movies.findOne({ Title: req.params.title })
      .then(function (movie) {
        if (!movie) {
          res
            .status(404)
            .send(
              'Movie with the title of ' + req.params.title + ' was not found.'
            );
        } else {
          res.status(200).json(movie);
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Gets data about a genre by genre name
app.get(
  '/movies/genres/:genreName',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Movies.findOne({ 'Genre.Name': req.params.genreName })
      .then(function (genre) {
        if (!genre) {
          return res
            .status(404)
            .send('Genre ' + req.params.genreName + ' was not found.');
        } else {
          res.status(200).json(genre.Genre);
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Gets all movies that have a certain genre
app.get(
  '/movies/genres/:genreName/movies',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Movies.find({ 'Genre.Name': req.params.genreName })
      .select('Title')
      .then(function (movieTitles) {
        if (movieTitles.length === 0) {
          return res
            .status(404)
            .send('Genre ' + req.params.genreName + ' was not found.');
        } else {
          res.status(200).json(movieTitles);
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Gets data about a director by director name
app.get(
  '/movies/directors/:directorName',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Movies.findOne({ 'Director.Name': req.params.directorName })
      .then(function (director) {
        if (!director) {
          res
            .status(404)
            .send(
              'Director with the name of ' +
                req.params.directorName +
                ' was not found.'
            );
        } else {
          res.status(200).json(director.Director);
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Gets all movies by a certain director
app.get(
  '/movies/directors/:directorName/movies',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Movies.find({ 'Director.Name': req.params.directorName })
      .select('Title')
      .then(function (movieTitles) {
        if (movieTitles.length === 0) {
          return res
            .status(404)
            .send(
              'Director with the name of ' +
                req.params.directorName +
                ' was not found.'
            );
        } else {
          res.status(200).json(movieTitles);
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Registers new user
app.post(
  '/users',
  [
    check('Username')
      .not()
      .isEmpty()
      .withMessage('Username is required.')
      // If there is no email, code will stop here, otherwise format will be validated
      .bail()
      .isAlphanumeric()
      .withMessage(
        'Username contains non alphanumeric characters - not allowed.'
      ),
    check('Password').not().isEmpty().withMessage('Password is required.'),
    check('Email')
      .not()
      .isEmpty()
      .withMessage('Email is required.')
      .bail()
      .isEmail()
      .withMessage('Email does not appear to be valid.'),
  ],
  function (req, res) {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);

    Users.findOne({ Username: req.body.Username })
      .then(function (user) {
        if (user) {
          return res.status(409).send(req.body.Username + ' already exists.');
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then(function (newUser) {
              res.status(201).json(newUser);
            })
            .catch(function (error) {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Updates user info by username
app.put(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  [
    check('Username')
      // Added optional() method because not necessarily all fields will be updated
      .optional()
      .isAlphanumeric()
      .withMessage(
        'Username contains non alphanumeric characters - not allowed.'
      ),
    check('Email')
      .optional()
      .isEmail()
      .withMessage('Email does not appear to be valid.'),
  ],
  function (req, res) {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const currentUsername = req.params.username;
    const newUsername = req.body.Username;

    function updateUser() {
      // If statement necessary to prevent bcrypt error when no passwort is request body
      if (req.body.Password) {
        let hashedPassword = Users.hashPassword(req.body.Password);
        updates = {
          Username: newUsername,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        };
      } else {
        updates = {
          Username: newUsername,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        };
      }
      Users.findOneAndUpdate(
        { Username: currentUsername },
        {
          $set: updates,
        },
        { new: true }
      )
        .then(function (updatedUser) {
          res.status(200).json(updatedUser);
        })
        .catch(function (error) {
          console.error(error);
          res.status(500).send('Error: ' + error);
        });
    }

    if (currentUsername !== newUsername) {
      Users.findOne({ Username: newUsername }).then(function (user) {
        if (user) {
          return res.status(409).send(newUsername + ' already exists.');
        } else {
          updateUser();
        }
      });
    } else {
      updateUser();
    }
  }
);

// Adds a movie to user's list of favourites if not already present
app.post(
  '/users/:username/topMovies/:movieid',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Users.findOne({
      Username: req.params.username,
      TopMovies: req.params.movieid,
    })
      .then(function (movieIsPresent) {
        if (movieIsPresent) {
          return res.status(409).send('Movie is already on your list.');
        } else {
          Users.findOneAndUpdate(
            { Username: req.params.username },
            {
              $addToSet: { TopMovies: req.params.movieid },
            },
            { new: true }
          )
            .then(function (updatedUser) {
              res.status(200).json(updatedUser);
            })
            .catch(function (error) {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Removes movie from user's list of favourites
app.delete(
  '/users/:username/topMovies/:movieid',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Users.findOneAndUpdate(
      { Username: req.params.username },
      {
        $pull: { TopMovies: req.params.movieid },
      },
      { new: true }
    )
      .then(function (updatedUser) {
        res.status(200).json(updatedUser);
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  }
);

// Deletes a user by username
app.delete(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    Users.findOneAndRemove({ Username: req.params.username })
      .then(function (user) {
        if (!user) {
          res.status(404).send(req.params.username + ' was not found.');
        } else {
          res.status(200).send(req.params.username + ' was deleted.');
        }
      })
      .catch(function (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, function () {
  console.log('MyFlix app is listening to port 8080.');
});
