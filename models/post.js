const mongoose = require('mongoose');


///////////////////////////////////////////////////
//define schema for post

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    username: String,
    commentUser: [String],
    comment: [String],
    date: {
        type: Date,
        default: Date.now
    },
    like: {
        type: Number,
        default: 0
    },
    likedusers: {
        type: [String],
        default: ""
    }
});


module.exports = mongoose.model('Post', postSchema);