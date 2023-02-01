const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

// Basic HTTP authentication strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'Username',
      passwordField: 'Password',
    },
    function (username, hashedPassword, callback) {
      console.log(username + ' ' + hashedPassword);
      Users.findOne({ Username: username }, function (error, user) {
        if (error) {
          console.log(error);
          return callback(error);
        }

        if (!user) {
          console.log('incorrect username');
          return callback(null, false, {
            message: 'Incorrect username.',
          });
        }

        if (!user.validatePassword(hashedPassword)) {
          console.log('incorrect password');
          return callback(null, false, {
            message: 'Incorrect password.',
          });
        }

        console.log('finished');
        return callback(null, user);
      });
    }
  )
);

// JWT Authentication strategy
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'your_jwt_secret',
    },
    function (jwtPayload, callback) {
      return Users.findById(jwtPayload._id)
        .then(function (user) {
          return callback(null, user);
        })
        .catch(function (error) {
          return callback(error);
        });
    }
  )
);
