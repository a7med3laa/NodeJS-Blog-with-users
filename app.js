//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
require('dotenv').config();
const Post = require('./models/post');
const User = require('./models/user');
const Port=process.env.PORT;

const homeStartingContent = "Welcome to Simple Blog Site. You are free to write your own story!!";
const aboutContent = "This is a simple daily bLog written with NodeJs and MongoDB";
const contactContent = "Send me E-mail";
let currentUser = ""; //current user

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

///////////////////////////////////////////////////

//connect to DB
mongoose.connect("mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@" + process.env.DB_HOST, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB Connection error"));
///////////////////////////////////////////////////


//get about
app.get("/about", function (req, res) {
  res.render("about", {
    header: currentUser,
    aboutContent: aboutContent
  });

});

///////////////////////////////////////////////////


//get contact
app.get("/contact", function (req, res) {
  res.render("contact", {
    header: currentUser,
    contactContent: contactContent
  });

});

///////////////////////////////////////////////////
//delete all posts
app.get("/deleteAll", function (req, res) {
  Post.remove({}, function (err) {
    if (err) {
      console.err(err);
    }
  });
  res.redirect("/");
});

///////////////////////////////////////////////////
//delete all users
app.get("/deleteAllUsers", function (req, res) {
  User.remove({}, function (err) {
    if (err) {
      console.err(err);
    }
  });
  res.redirect("/");
});


///////////////////////////////////////////////////
//root route
app.get("/", async function (req, res) {
  const posts = await Post.find().sort({
    date: 'desc'
  });
  res.render("home", {
    header: currentUser,
    startingContent: homeStartingContent,
    posts: posts
  });
});

///////////////////////////////////////////////////
//get compose
app.get("/compose", function (req, res) {
  res.render("compose", {
    header: currentUser
  });
});

///////////////////////////////////////////////////
//post compose
app.post("/compose", function (req, res) {
  var d = new Date();
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    commentUser: "",
    comment: "",
    username: currentUser,
    date: d,
    like: 0,
    likedusers: ""
  });

  post.save(function (err) {
    if (!err) {
      res.redirect("/profile");
    }
  });
});

///////////////////////////////////////////////////
// get sign in
app.get("/login", function (req, res) {
  res.render("login", {
    header: currentUser,
    errorMessage: ""
  });
});

///////////////////////////////////////////////////
// post sign in
app.post("/login", function (req, res) {

  const requestedEmail = req.body.email;
  const requestedPassword = req.body.password;
  let message = "";

  if (requestedEmail && requestedPassword) {

    User.findOne({
      email: requestedEmail
    }, function (err, foundUser) {
      if (err) {
        message = "Login Failed you are not registered";

        console.log(err);
      } else {

        if (foundUser) {

          if (foundUser.password === requestedPassword) {

            console.log("Login Success");
            currentUser = foundUser.username;
            res.redirect("/profile");

          } else {

            console.log("Failed login");
            message = "Login Failed password is not correct";

            res.render("login", {
              header: currentUser,
              errorMessage: message
            });
          }
        }
      }
    });
  } else {
    message = "Please Enter your email and password";

    res.render("login", {
      header: currentUser,
      errorMessage: message
    });
  }
});

///////////////////////////////////////////////////
// get sign up
app.get("/register", function (req, res) {
  res.render("register", {
    header: currentUser,
    errorMessage: ""
  });

});

///////////////////////////////////////////////////
// post sign up
app.post("/register", function (req, res) {
  let Message = "";
  if (req.body.username && req.body.email && req.body.password && req.body.passwordConf) {

    User.findOne({
      email: req.body.email
    }, function (err, foundUser) {
      if (err) {
        console.log(err);
      } else if (foundUser) {
        Message = "User already exist Login instead";
        res.render("register", {
          header: currentUser,
          errorMessage: Message
        });
      }
    });

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    newUser.save(function (err) {
      if (err) {
        Message = "Register Error" + err;
      } else {

        Message = "Register Success";
        currentUser = req.body.username;
        res.redirect("/profile");
      }

    });

  } else {
    res.render("register", {
      header: currentUser,
      errorMessage: Message
    });
  }
});

///////////////////////////////////////////////////
//get profile
app.get("/profile", function (req, res) {

  Post.find({
    username: currentUser
  }, function (err, posts) {
    if (!err && posts) {
      res.render("profile", {
        header: currentUser,
        username: currentUser,
        userPosts: posts
      });
    } else {
      res.render("profile", {
        header: currentUser,
        username: currentUser,
        userPosts: ""
      });
    }
  });

});


///////////////////////////////////////////////////
// get post
app.get("/post/:postId", function (req, res) {

  const requestedPostId = req.params.postId;

  Post.findOne({
    _id: requestedPostId
  }, function (err, post) {
    res.render("post", {
      header: currentUser,
      post: post
    });
  });

});

///////////////////////////////////////////////////
// delete post
app.get("/delete/:postId", function (req, res) {

  const requestedPostId = req.params.postId;

  Post.findByIdAndDelete({
    _id: requestedPostId
  }, function (err, post) {
    res.redirect("/profile");
  });

});


///////////////////////////////////////////////////
//get logout
app.get("/logout", function (req, res) {
  currentUser = "";
  res.redirect("/");
});

///////////////////////////////////////////////////
//post comment
app.post("/comment", function (req, res) {


  const requestedComment = req.body.commentContent;
  const requestedPostID = req.body.commentPostID;

  if (currentUser === "") {

    res.redirect("/post/" + requestedPostID);

  } else {
    Post.findOne({
      _id: requestedPostID
    }, function (err, post) {
      if (post) {
        post.comment.push(requestedComment);
        post.commentUser.push(currentUser);

        post.save(function (err) {
          if (!err) {
            res.redirect("/post/" + requestedPostID);
          }
        });
      }
    });
  }

});

///////////////////////////////////////////////////
//post like
app.post("/like", function (req, res) {

  const requestedPostID = req.body.commentPostID;

  if (currentUser === "") {

    res.redirect("/post/" + requestedPostID);

  } else {

    Post.findOne({
      _id: requestedPostID
    }, function (err, post) {
      if (post) {

        if (post.likedusers.includes(currentUser)) {
          const index = post.likedusers.indexOf(currentUser);
          if (index > -1) {
            post.likedusers.splice(index, 1);
          }
          post.like -= 1;

          if (post.like < 0) {
            post.like = 0;
          }
        } else {
          post.like += 1;
          post.likedusers.push(currentUser);
        }


        post.save(function (err) {
          if (!err) {
            res.redirect("/post/" + requestedPostID);
          }
        });

      }
    });
  }
});

///////////////////////////////////////////////////
// edit post
app.get("/edit/:postId", function (req, res) {
  const requestedPostId = req.params.postId;


  Post.findOne({
    _id: requestedPostId
  }, function (err, post) {
    res.render("edit", {
      header: currentUser,
      post: post
    });
  });
});

///////////////////////////////////////////////////
//edit post
app.post("/edit/:postId", function (req, res) {

  const requestedPostId = req.params.postId;

  Post.findOneAndUpdate({
      _id: requestedPostId
    }, {
      title: req.body.postTitle,
      content: req.body.postBody
    },
    function (err, post) {
      res.redirect("/profile");
    });
})

///////////////////////////////////////////////////
//liked users post
app.get("/showlikedlist/:postId", function (req, res) {

  const requestedPostId = req.params.postId;

  Post.findOne({
    _id: requestedPostId
  }, function (err, post) {
    res.render("likedUsers", {
      header: currentUser,
      post: post
    });
  });
});

app.listen(Port, function () {
  console.log("Server started on port "+Port);
});
