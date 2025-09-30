const mongoose = require('mongoose');

// models/user.js
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Hide password when converting to JSON
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.password;
 },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
