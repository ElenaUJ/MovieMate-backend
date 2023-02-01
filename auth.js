// Same key as in JWTS Strategy
const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
  passport = require('passport');

// Local passport file, containing passport middleware and strategies
require('./passport.js');

// Jsonwebtoken library's sign method creates JWT, takes 3 arguments- 1.payload: data to be included, 2. secret key, 3. options object
// Returns token: a string
let generateJWTToken = function (user) {
  return jwt.sign(user, jwtSecret, {
    // For whom the JWT is issued (the user with certain Username)
    subject: user.Username,
    expiresIn: '7d',
    // Algorithm used to encode values of JWT
    algorithm: 'HS256',
  });
};

// POST login
module.exports = function (router) {
  // Question: Why router.post and not app.post? What is the difference? Is it because Express is not imported in this file? But it should still work because the index.js file added the (app) parameter to the link to this file, or not?
  router.post('/login', function (req, res) {
    // Question: Why is the authenticate function within the req/res function here, whereas for all the other endpoints in the index.js file, the response callback function comes after the authenticate function is completed?
    passport.authenticate(
      'local',
      // No session has to be maintained on the server because JWT holds all info necessary to authenticate user
      { session: false },
      // Is this the callback function referred to in the local strategy? Is the info variable for the message?
      function (error, user, info) {
        // You will only have info if there was an error during the local authentication (see local strategy in passport.js)
        if (info) {
          return res.status(400).json(info);
        }

        if (error) {
          return res.status(400).json({
            message: 'Something is not right',
            user: user,
          });
        }
        req.login(user, { session: false }, function (error) {
          if (error) {
            return res.send(error);
          }
          let token = generateJWTToken(user.toJSON());
          return res.json({
            // shorthand {user, token} would be anough with ES6, if values and keys are the same
            user: user,
            token: token,
          });
        });
      }
      // Question: (req, res) in their own parentheses are the third parameter for the login post request...what do they do here?
    )(req, res);
  });
};
