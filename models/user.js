const mongoose = require('mongoose');

///////////////////////////////////////////////////
//define schema for user
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

module.exports = mongoose.model("User", userSchema);