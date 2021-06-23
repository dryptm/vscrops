const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");


const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// app.use(cors({
//   origin: true
// }));

var blogSchema = new mongoose.Schema({
  heading: String,
  date: String,
  image_link: String,
  blog_data: String
});

var Blog = mongoose.model('Blog', blogSchema);





app.get("/", function (req, res) {
  res.redirect("/home");
})

app.get("/home", function (req, res) {
  res.render("home", {})

})

app.get("/products", function (req, res) {
  res.render("products", {})

})
app.get("/contactus", function (req, res) {
  res.render("contactus", {})

})
app.get("/foundersnote", function (req, res) {
  res.render("foundersnote", {})

})
app.get("/ourstory", function (req, res) {
  res.render("ourstory", {})

})
app.get("/blog", function (req, res) {
  Blog.find({}, function (err, post) {
    res.render("blog", {
      post: post
    })
  })


})


app.get("/blog/:np", function (req, res) {
  var n_p = req.params.np
  Blog.findOne({
    _id: n_p
  }, function (err, post) {

    if (post) {
      res.render("currentblog", {
        title: post.heading,
        date: post.date,
        img: post.image_link,
        data: post.blog_data.split("<br>")
      });
    }

  });
})





mongoose.connect('mongodb+srv://vishuddha_crops:vishuddha@prateek@cluster0.zmxnf.mongodb.net/blogs', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!

  console.log("database connected!!!!");
});

app.listen(process.env.PORT || 3000, (req, res) => {
  console.log("server started")
})