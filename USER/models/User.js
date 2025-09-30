//USER/models/User.js 
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  positions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Position" 
  }]
}, { timestamps: true });

// Hide password when converting to JSON
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.password;
    return returnedObject;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
