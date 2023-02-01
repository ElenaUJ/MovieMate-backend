const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  path = require('path'),
  mongoose = require('mongoose'),
  Models = require('./models.js');

// Variable for Express' functionality to configure web server
const app = express();

app.use(bodyParser.json());
// Parses bodies from URL requests, extended: true means req.body object can contain any value, not just strings
app.use(bodyParser.urlencoded({ extended: true }));

// Cors middleware. Making sure that app uses CORS specifying domains which get access to API
const cors = require('cors');
// Per default, this grants access to all origins
app.use(cors());

// The fewer domains have access, the more secure - if I only wanted to give certain domains access, I would do it like this:
// let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Question: Why is that here? If there is no origin header- why should that grant access?
//       if (!origin) {
//         return callback(null, true);
//       }
//       if (allowedOrigins.indexOf(origin) === -1) {
//         let message =
//           "The CORS policy for this application doesn't allow access from origin" +
//           origin;
//         // false means access to API will be denied
//         return callback(new Error(message), false);
//       }
//       return callback(null, true);
//     },
//   })
// );

// Import of auth.js file, must come after bodyparser middleware! App argument ensures that Express is available in auth.js file, too
// Question: How is it enough to import the file? How does the app understand that when the /login endpoint is requested, it has to look in the auth.js file for the logic?
//Passport module and passport.js file are required, too
let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport.js');

// Input validation
const { check, validationResult } = require('express-validator');

// Refer to model names defined in models.js file
const Movies = Models.Movie;
const Users = Models.User;

// Suppresses deprecation warning
mongoose.set('strictQuery', true);
// Allows Mongoose to connect to that database so it can perform CRUD operations on its documents from within REST API
mongoose.connect('mongodb://localhost:27017/myFlixDB');

//Routing of static files
app.use(express.static('public'));

// Logging requests to console
app.use(morgan('common'));
// Additionally, creating log stream in log.txt file (flags: 'a' instructs to append logs to file)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});
app.use(morgan('common', { stream: accessLogStream }));

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
    const title = req.params.title;
    Movies.findOne({ Title: title })
      .then(function (movie) {
        if (!movie) {
          res
            .status(404)
            .send('Movie with the title of ' + title + ' was not found.');
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
  // Question: How does the app know which strategy to use? What if there were more jwt strategies in the passport.js file?
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    const genreName = req.params.genreName;
    Movies.findOne({ 'Genre.Name': genreName })
      .then(function (genre) {
        if (!genre) {
          return res.status(404).send('Genre ' + genreName + ' was not found.');
        } else {
          // .Genre has to be added so only the genre key is returned
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
    const genreName = req.params.genreName;
    Movies.find({ 'Genre.Name': genreName })
      .select('Title')
      .then(function (movieTitles) {
        if (movieTitles.length === 0) {
          return res.status(404).send('Genre ' + genreName + ' was not found.');
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
    const directorName = req.params.directorName;
    Movies.findOne({ 'Director.Name': directorName })
      .then(function (director) {
        if (!director) {
          res
            .status(404)
            .send(
              'Director with the name of ' + directorName + ' was not found.'
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
    const directorName = req.params.directorName;
    Movies.find({ 'Director.Name': directorName })
      .select('Title')
      .then(function (movieTitles) {
        if (movieTitles.length === 0) {
          return res
            .status(404)
            .send(
              'Director with the name of ' + directorName + ' was not found.'
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

// Registers new user (and hashes their password)
app.post(
  '/users',
  // Validation logic
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
    // validationResult is a method provided by express-validator library
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      // array() is another method of the express-validator library
      // Status code 422: unprocessable entity
      // Rest of code will not be executed: database remains safe from potential malicious code
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);

    const username = req.body.Username;
    Users.findOne({ Username: username })
      .then(function (user) {
        if (user) {
          return res.status(409).send(username + ' already exists.');
        } else {
          // .create command takes object. Keys specified in Schema, values received by request body.
          Users.create({
            Username: username,
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

// Gets data about a user by name
// Will be deleted before app goes live
app.get('/users/:username', function (req, res) {
  const username = req.params.username;
  Users.findOne({ Username: username })
    .then(function (user) {
      if (!user) {
        res.status(404).send('No user with the name of ' + username);
      } else {
        res.status(200).json(user);
      }
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Updates user info by username
app.put(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  [
    check('Username')
      // added optional() method, because not necessarily all fields will be updated
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
    const newPassword = req.body.Password;

    function updateUser() {
      // If statement necessary to prevent bcrypt error when no passwort is request body
      if (newPassword) {
        let hashedPassword = Users.hashPassword(newPassword);
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
        // This line is to specify that the following callback function will take the updated object as parameter
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
    const username = req.params.username;
    const movieId = req.params.movieid;
    Users.findOne({ Username: username, TopMovies: movieId })
      .then(function (movieIsPresent) {
        if (movieIsPresent) {
          return res.status(409).send('Movie is already on your list.');
        } else {
          Users.findOneAndUpdate(
            { Username: username },
            {
              // Only adds if not already present (but wouldn't throw error)
              $addToSet: { TopMovies: movieId },
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
    const username = req.params.username;
    const movieId = req.params.movieid;
    Users.findOneAndUpdate(
      { Username: username },
      {
        $pull: { TopMovies: movieId },
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

// Delete a user by username
app.delete(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  function (req, res) {
    const username = req.params.username;
    Users.findOneAndRemove({ Username: username })
      .then(function (user) {
        if (!user) {
          res.status(400).send(username + ' was not found.');
        } else {
          res.status(200).send(username + ' was deleted.');
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
