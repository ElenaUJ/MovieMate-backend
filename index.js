/**
 * Module for setting up the Movie Database Server and API endpoints.
 * @module movieServer
 */

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
  'http://elena-uj-moviemate-react.s3-website-us-east-1.amazonaws.com',
  `http://${IMAGES_BUCKET}.s3.amazonaws.com`,
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
const dbConnectionUri =
  process.env.NODE_ENV === 'production'
    ? process.env.CONNECTION_URI
    : 'mongodb://localhost:27017/myFlixDB';
mongoose.connect(dbConnectionUri);

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

// S3 Image upload and retrieval functionality
// Instantiation of Client and Configuration Classes/Objects
const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const isProduction = process.env.NODE_ENV === 'production';
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: isProduction ? undefined : 'http://localhost:4566',
  forcePathStyle: isProduction ? undefined : true,
});
const IMAGES_BUCKET = isProduction
  ? process.env.IMAGES_BUCKET
  : 'my-cool-local-bucket';
const fileUpload = require('express-fileupload');
app.use(fileUpload());

/** Endpoint handlers */
app.get('/', function (req, res) {
  res.send('Movie database is being contructed.');
});

/**
 * Get a list of all movies.
 * @function
 * @name getMovies
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object containing an array of movie objects.
 */
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

/**
 * Gets data about single movie by title
 * @function
 * @name getSingleMovie
 * @param {Object} req - Express request object.
 * @param {string} req.params.title - The title of the movie to retrieve.
 * @param {Object} res - Express response object containing a movie object.
 */
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

/**
 * Gets data about a genre by genre name
 * @function
 * @name getGenre
 * @param {Object} req - Express request object.
 * @param {string} req.params.genreName - The name of the genre to retrieve.
 * @param {Object} res - Express response object containing a genre object.
 */
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

/**
 * Gets all movies that have a certain genre
 * @function
 * @name getMoviesPerGenre
 * @param {Object} req - Express request object.
 * @param {string} req.params.genreName - The name of the genre.
 * @param {Object} res - Express response object containing an array of movie objects (only IDs and titles).
 */
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

/**
 * Gets data about a director by director name
 * @function
 * @name getDirector
 * @param {Object} req - Express request object.
 * @param {string} req.params.directorName - The name of the director to retrieve.
 * @param {Object} res - Express response object containing a director object.
 */
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

/**
 * Gets all movies that have a certain genre
 * @function
 * @name getMoviesPerDirector
 * @param {Object} req - Express request object.
 * @param {string} req.params.genreName - The name of the director.
 * @param {Object} res - Express response object containing an array of movie objects (only IDs and titles).
 */
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

/**
 * Registers new user
 * @function
 * @name registerUser
 * @param {Object} req - Express request object containing user object.
 * @param {Object} res - Express response object containing user object.
 */
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

/**
 * Updates user info by username
 * @function
 * @name updateUser
 * @param {Object} req - Express request object containing user object with updated user data.
 * @param {Object} res - Express response object containing user object.
 */
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

/**
 * Adds a movie to user's list of favourites if not already present
 * @function
 * @name addMovie
 * @param {Object} req - Express request object.
 * @param {string} req.params.username - Username
 * @param {string} req.params.movieid - The ID of the movie to be added.
 * @param {Object} res - Express response object containing user object.
 */
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

/**
 * Removes movie from user's list of favourites
 * @function
 * @name removeMovie
 * @param {Object} req - Express request object.
 * @param {string} req.params.username - Username
 * @param {string} req.params.movieid - The ID of the movie to be removed.
 * @param {Object} res - Express response object containing user object.
 */
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

/**
 * Deletes a user by username
 * @function
 * @name deleteUser
 * @param {Object} req - Express request object.
 * @param {string} req.params.username - Username
 * @param {Object} res - Express response object containing success message.
 */
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

/**
 * Uploads image to bucket
 */
app.post('/images', (req, res) => {
  const file = req.files.image;
  const fileName = req.files.image.name;
  const tempPath = `./temp_files/${fileName}`;

  // There will need to be a solution put in place to empty that temporary files folder
  file.mv(tempPath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error: ' + err);
    }

    const putObjectParams = {
      Bucket: IMAGES_BUCKET,
      Key: `original-images/${fileName}`,
      Body: file.data,
    };
    s3Client
      .send(new PutObjectCommand(putObjectParams))
      .then(
        res.status(200).send('Image ' + fileName + ' uploaded successfully.')
      )
      .catch(function (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });
});

/**
 * Gets all resized images/thumbnails from the bucket
 */
app.get('/thumbnails', (req, res) => {
  listObjectsParams = {
    Bucket: IMAGES_BUCKET,
    Prefix: 'resized-images/',
  };

  s3Client
    .send(new ListObjectsV2Command(listObjectsParams))
    .then((listObjectsResponse) => {
      // Exclude empty prefix entry from list and extract S3 URL
      const thumbnailArray = listObjectsResponse.Contents.filter((entry) => {
        return entry.Size !== 0;
      }).map((entry) => {
        return isProduction
          ? `http://${IMAGES_BUCKET}.s3.amazonaws.com/${entry.Key}`
          : `http://localhost:4566/${IMAGES_BUCKET}/${entry.Key}`;
      });

      res.status(200).send(thumbnailArray);
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Gets one image in original size
 */
app.get('/images/:imageName', (req, res) => {
  const getObjectParams = {
    Bucket: IMAGES_BUCKET,
    Key: `original-images/${req.params.imageName}`, // Adjust the path based on your folder structure
  };

  s3Client
    .send(new GetObjectCommand(getObjectParams))
    .then((data) => {
      // Send the image data as the response
      data.Body.pipe(res);
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * Gets one image thumbnail
 */

// Error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

/**
 * Start the Movie API server.
 * @function
 * @name startServer
 * @param {number} port - The port to listen on.
 */
app.listen(8080, function () {
  console.log('MovieMate is listening to port 8080.');
});
