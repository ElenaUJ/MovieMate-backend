const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  path = require('path');

// Variable for Express' functionality to configure web server
const app = express();

const movies = [
  {
    title: 'The Truman Show',
    description:
      "The Truman Show is a 1998 American science fiction film directed by Peter Weir and written by Andrew Niccol. The film stars Jim Carrey as Truman Burbank, a man who is the unknowing star of a reality television show in which everything in his life is staged for the camera. Truman's entire life, from his birth to his present, has been broadcast on television to a global audience, but he is unaware of this and believes that everything in his life is normal. As he begins to suspect that his life is not as it seems and that he is being watched, Truman sets out to discover the truth about his life and the world around him. The film explores themes of reality, identity, and the media's influence on society.",
    genre: {
      name: 'drama',
      description:
        'A drama film is a genre of film that focuses on characters and their relationships, and often deals with sensitive, emotional themes. Drama films often aim to evoke strong feelings and emotions in the audience, such as sadness, joy, or hope. These films often tell stories about characters struggling with personal issues, relationships, or societal problems, and they may explore themes such as family, love, loss, identity, or coming of age.',
    },
    director: {
      name: 'Peter Weir',
      bio: 'Peter Lindsay Weir is an Australian film director, producer, and screenwriter. He was born in Sydney, Australia in 1944 and began his career in the film industry in the 1970s. Weir is known for his diverse body of work, which includes films in a range of genres, such as drama, comedy, and thriller. Some of his most popular and critically acclaimed films include Picnic at Hanging Rock, The Last Wave, Dead Poets Society, and The Truman Show. Weir has been nominated for several awards throughout his career, including three Academy Awards for Best Director. In addition to his work in film, Weir has also directed and produced television shows and stage productions.',
      birth: 1944,
      death: 'N/A',
    },
    imageUrl:
      'https://m.media-amazon.com/images/M/MV5BMDIzODcyY2EtMmY2MC00ZWVlLTgwMzAtMjQwOWUyNmJjNTYyXkEyXkFqcGdeQXVyNDk3NzU2MTQ@._V1_.jpg',
    featured: false,
  },
];

const users = [
  {
    username: 'ElenaUlb',
    password: 'password',
    topMovies: [],
  },
];

//Routing of static files
app.use(express.static('public'));

app.use(bodyParser.json());

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
app.get('/movies', function (req, res) {
  res.status(200).json(movies);
});

// Gets data about single movie by title
app.get('/movies/:title', function (req, res) {
  const title = req.params.title;
  const movie = movies.find(function (movie) {
    return movie.title === title;
  });

  if (!movie) {
    res
      .status(404)
      .send('Movie with the title of ' + req.params.title + ' was not found.');
  } else {
    res.status(200).json(movie);
  }
});

// Gets data about a genre by genre name
app.get('/movies/genres/:genreName', function (req, res) {
  const genreName = req.params.genreName;
  const genre = movies.find(function (movie) {
    return movie.genre.name === genreName;
    // .genre has to be added so only the genre property is returned
  }).genre;

  if (!genre) {
    res.status(404).send('Genre ' + req.params.genreName + ' was not found.');
  } else {
    res.status(200).json(genre);
  }
});

// Gets data about a director by director name
app.get('/movies/directors/:directorName', function (req, res) {
  const directorName = req.params.directorName;
  const director = movies.find(function (movie) {
    return movie.director.name === directorName;
  }).director;

  if (!director) {
    res
      .status(404)
      .send(
        'Director with the name of ' +
          req.params.directorName +
          ' was not found.'
      );
  } else {
    res.status(200).json(director);
  }
});

// Registers new user
app.post('/users', function (req, res) {
  const newUser = req.body;
  const isUsernameTaken = users.find(function (user) {
    return user.username === newUser.username;
  });

  if (!newUser.username) {
    res.status(400).send('Missing username in request body');
  } else if (isUsernameTaken) {
    res.status(409).send('Username is already taken.');
  } else {
    // Adds an empty array of favourite movies to user object
    newUser.topMovies = [];
    users.push(newUser);
    res.status(201).json(newUser);
  }
});

// Updates username
app.put('/users/:username/:newUsername', function (req, res) {
  const user = users.find(function (user) {
    return user.username === req.params.username;
  });
  const newUsername = req.params.newUsername;
  const isUsernameTaken = users.find(function (user) {
    return user.username === newUsername;
  });

  if (!user) {
    res.status(404).send('Username ' + req.params.username + ' was not found.');
  } else if (isUsernameTaken) {
    res.status(409).send('Username is already taken.');
  } else {
    user.username = newUsername;
    res.status(200).send('Username has been updated to: ' + user.username);
  }
});

// Adds movie to list of user favourites
app.post('/users/:username/topMovies/:title', function (req, res) {
  const user = users.find(function (user) {
    return user.username === req.params.username;
  });
  const newFavouriteMovie = movies.find(function (movie) {
    return movie.title === req.params.title;
  });
  const usersFavourites = user.topMovies;
  const isMoviePresent = usersFavourites.find(function (movie) {
    return movie.title === newFavouriteMovie.title;
  });

  if (!user) {
    res.status(404).send('Username ' + req.params.username + ' was not found.');
  } else if (!newFavouriteMovie) {
    res
      .status(404)
      .send('Movie with the title of ' + req.params.title + ' was not found.');
  } else if (isMoviePresent) {
    res.status(409).send('Movie is already on the list.');
  } else {
    usersFavourites.push(newFavouriteMovie);
    res
      .status(201)
      .send(
        newFavouriteMovie.title +
          ' was added to ' +
          user.username +
          "'s top movies."
      );
  }
});

// Removes movie from user list of favourites
app.delete('/users/:username/topMovies/:title', function (req, res) {
  const user = users.find(function (user) {
    return user.username === req.params.username;
  });
  const movieToDelete = user.topMovies.find(function (movie) {
    return movie.title === req.params.title;
  });

  if (!user) {
    res.status(404).send('Username ' + req.params.username + ' was not found.');
  } else if (!movieToDelete) {
    res
      .status(404)
      .send('Movie with the title of ' + req.params.title + ' was not found.');
  } else {
    // Returns filtered array with all movies but the one to delete
    user.topMovies = user.topMovies.filter(function (otherMovies) {
      return otherMovies.title !== movieToDelete.title;
    });
    res
      .status(200)
      .send(
        movieToDelete.title +
          ' was removed from ' +
          user.username +
          "'s top movies."
      );
  }
});

// Deregisters user
app.delete('/users/:username', function (req, res) {
  const userToDeregister = users.find(function (user) {
    return user.username === req.params.username;
  });
  if (!userToDeregister) {
    res.status(404).send('Username ' + req.params.username + ' was not found.');
  } else {
    users = users.filter(function (otherUsers) {
      return otherUsers.username !== userToDeregister.username;
    });
    res
      .status(200)
      .send(
        'User ' + userToDeregister.username + ' was successfully deregistered.'
      );
  }
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, function () {
  console.log('MyFlix app is listening to port 8080.');
});
