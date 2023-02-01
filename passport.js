const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

// Adding basic HTTP authentication strategy
passport.use(
  new LocalStrategy(
    // Options object specifying fields that should be used for username and password (default property names)
    {
      usernameField: 'Username',
      passwordField: 'Password',
    },
    // Question: Where is this callback function?? Is it the middleware function handling the endpoint requests?
    function (username, hashedPassword, callback) {
      console.log(username + ' ' + hashedPassword);
      // Using Mongoose method to check for username and password
      Users.findOne({ Username: username }, function (error, user) {
        // Question: Why multiple if statements here and no if else? When a condition applies the execution of the function will be stopped because of the return statements. Wouldn't if else statements result in exactly the same behaviour?
        if (error) {
          console.log(error);
          return callback(error);
        }

        if (!user) {
          console.log('incorrect username');
          // null means: no error; false means, no user
          return callback(null, false, {
            message: 'Incorrect username.',
          });
        }

        if (!user.validatePassword(hashedPassword)) {
          console.log('incorrect password');
          return callback(null, false, {
            message: 'Incorrect password',
          });
        }

        console.log('finished');
        return callback(null, user);
      });
    }
  )
);

// Adding JWT Authentication strategy
passport.use(
  new JWTStrategy(
    // JWT (bearer token) is extracted from HTTP header
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      // The secretOrKey string can be picked by developer, has to be kept secret, and changed periodically - security of JWT depends on it!
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
