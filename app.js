const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session')
const passport = require('passport')
const mongoose = require("mongoose");
const User = require('./models/users');
const Product = require('./models/products');
const mailinglist = require('./models/mailinglist');

const {
  ensureAuth
} = require("./config/auth");

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

require('./config/passport-config')(passport);
app.use(session({
  secret: "DontTellAnyOneThisIsASecret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

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


app.post("/submit", (req, res) => {
  mailinglist.findOne({
    email: req.body.mail
  }, (err, found) => {
    if (found) {
      res.render("email_already_exist", {
        message: "Email already exists!"
      })
    } else {
      const mail = new mailinglist({
        email: req.body.mail
      });
      mail.save();
      res.render("email_already_exist", {
        message: "Thank you for the Subscription!"
      })
    }
  })
})

app.get("/products", function (req, res) {

  Product.find({}, (err, found) => {
    if (found) {
      res.render("products", {
        post: found
      })

    }
  })

})
app.get("/products/:np", function (req, res) {
  Product.findOne({
    _id: req.params.np
  }, (err, found) => {
    res.render("individualproduct", {
      found
    })


    app.post('/add_to_cart', (req, res) => {
      if (req.isAuthenticated()) {
        // console.log(req.user.username)
        var cart_obj = [];
        User.findOne({
          Id: req.user.Id
        }, (err, found1) => {
          cart_obj = found1.cart;
          cart_obj.push({
            "name": found.product_name,
            "total_price": Number(req.body.tot_price),
            "product_image": found.product_image,
            "quantity": (Number(req.body.tot_price)) / (found.product_price - ((found.product_price * found.product_discount) / 100))
          })
          User.findOneAndUpdate({
            Id: req.user.Id
          }, {
            cart: cart_obj
          }, {
            new: true
          }, (err, response) => {
            if (err) {
              console.log(err)
            } else {
              console.log(response)
            }
          })
        })

      } else {
        res.render("needloginfirst", {})
      }
    })
  })
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



app.get('/register', (req, res) => {
  res.render('register')
})
app.post('/register', (req, res) => {

  User.register({
    username: req.body.username,
    name: req.body.fname + " " + req.body.lname,
    orders: [{
        name: "item_1",
        price: 100,
        number: 5,
        discount: 5
      },
      {
        name: "item_2",
        price: 200,
        number: 4,
        discount: 10

      }
    ],
    cart: []
  }, req.body.password, function (err) {
    if (err) {
      console.log("User already exists")
      res.redirect('/login')
    } else {
      passport.authenticate("local", {
        failureRedirect: '/login'
      })(req, res, function () {
        res.redirect('/secret')
      })
    }
  });
})



app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/secret')
  } else res.render('login')
})


app.post('/login', (req, res) => {
  passport.authenticate("local")(req, res, function () {
    res.redirect("/secret");
  })
})
app.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/')
})




app.get('/secret', ensureAuth, (req, res) => {
  res.render('secret', {
    user: req.user.name
  })
})


//************************* */
// google auth
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
app.get("/auth/google/google_login",
  passport.authenticate('google', {
    failureRedirect: "/login"
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secret");
  });









/*
mongoose.connect("mongodb://localhost:27017/Profiles",{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
*/


mongoose.connect('mongodb+srv://vishuddha_crops:vishuddha@prateek@cluster0.zmxnf.mongodb.net/DATA', {
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