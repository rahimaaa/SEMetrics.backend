const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true },
  username: { type: String, required: true },
  accessToken: { type: String},
});

const User = mongoose.model('User', userSchema);

module.exports = User;
