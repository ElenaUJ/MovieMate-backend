const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let movieSchema = new Schema({
  Title: { type: String, required: true },
  Decsription: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
    Birth: String,
    Death: String,
  },
  ImagePath: String,
  Featured: Boolean,
});

let userSchema = new Schema({
  Username: { type: String, required: true },
  Password: { type: String, required: true },
  Email: { type: String, required: true },
  Birthday: Date,
  TopMovies: [
    {
      // Mongoose specific data type that is used to store MongoDB ObjectId
      type: mongoose.Schema.Types.ObjectId,
      // ref attribute referres to db.movies collection
      ref: 'Movie',
    },
  ],
});

// A function with 'Movie' and 'User' as the model's names, and the respective schema's
// Models act as represenation of the underlying database data
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
