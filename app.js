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
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      res.render("home", {
        isLoggedin: "yes",
        name: found1.name
      })

    })



  } else {
    res.render("home", {
      isLoggedin: "no"
    })
  }


})

app.post("/submit", (req, res) => {
  mailinglist.findOne({
    email: req.body.mail
  }, (err, found) => {
    if (found) {
      if (req.isAuthenticated()) {

        User.findOne({
          Id: req.user.Id
        }, (err, found1) => {
          res.render("email_already_exist", {
            message: "Email already exists!",
            isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
            name: (req.isAuthenticated() ? found1.name : "")
          })

        })
      } else {
        res.render("email_already_exist", {
          message: "Email already exists!",
          isLoggedin: "no",
          name: ""
        })
      }


    } else {
      const mail = new mailinglist({
        email: req.body.mail
      });
      mail.save();
      if (req.isAuthenticated()) {
        User.findOne({
          Id: req.user.Id
        }, (err, found1) => {
          res.render("email_already_exist", {
            message: "Thank you for the Subscription!",
            isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
            name: (req.isAuthenticated() ? found1.name : "")
          })

        })
      } else {
        res.render("email_already_exist", {
          message: "Thank you for the Subscription!",
          isLoggedin: "no",
          name: ""
        })
      }


    }
  })
})

app.get("/products", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {

      Product.find({}, (err, found) => {
        if (found) {
          res.render("products", {
            post: found,
            isLoggedin: "yes",
            name: found1.name
          })

        }
      })
    })



  } else {
    Product.find({}, (err, found) => {
      if (found) {
        res.render("products", {
          post: found,
          isLoggedin: "no"
        })

      }
    })



  }





})
app.get("/products/:np", function (req, res) {


  Product.findOne({
    _id: req.params.np
  }, (err, found) => {

    if (req.isAuthenticated()) {
      User.findOne({
        Id: req.user.Id
      }, (err, found1) => {
        res.render("individualproduct", {
          found: found,
          isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
          name: (req.isAuthenticated() ? found1.name : "")

        })

      })
    } else {
      res.render("individualproduct", {
        found: found,
        isLoggedin: "no"
      })

    }



    app.post('/add_to_cart', (rq, rs) => {
      if (rq.isAuthenticated()) {
        // console.log(req.user.username)
        var cart_obj = [];
        User.findOne({
          Id: rq.user.Id
        }, (err, found1) => {
          cart_obj = found1.cart;
          cart_obj.push({
            "name": found.product_name,
            "total_price": Number(rq.body.tot_price),
            "product_image": found.product_image,
            "quantity": (Number(rq.body.tot_price)) / (found.product_price - ((found.product_price * found.product_discount) / 100))
          })
          User.updateOne({
            Id: rq.user.Id
          }, {
            cart: cart_obj
          }, (err) => {
            if (err) {
              console.log(err)
            } else {
              ///*********AFTER CART UPDATE********* */
            }
          })
        })

      } else {
        rs.render("needloginfirst", {})
      }
    })
  })
})


app.get("/contactus", function (req, res) {

  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {

      res.render("contactus", {
        isLoggedin: "yes",
        name: found1.name
      })
    })



  } else {
    res.render("contactus", {
      isLoggedin: "no"
    })



  }

})
app.get("/foundersnote", function (req, res) {

  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {

      res.render("foundersnote", {
        isLoggedin: "yes",
        name: found1.name
      })
    })



  } else {

    res.render("foundersnote", {
      isLoggedin: "no"
    })


  }


})
app.get("/ourstory", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      res.render("ourstory", {
        isLoggedin: "yes",
        name: found1.name
      })
    })
  } else {
    res.render("ourstory", {
      isLoggedin: "no"
    })
  }
})









app.get("/blog", function (req, res) {

  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      Blog.find({}, function (err, post) {
        res.render("blog", {
          post: post,
          name: found1.name,
          isLoggedin: "yes"

        })
      })
    })



  } else {
    Blog.find({}, function (err, post) {
      res.render("blog", {
        post: post,
        isLoggedin: "no"

      })
    })

  }






})


app.get("/blog/:np", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      var n_p = req.params.np
      Blog.findOne({
        _id: n_p
      }, function (err, post) {

        if (post) {
          res.render("currentblog", {
            title: post.heading,
            date: post.date,
            img: post.image_link,
            data: post.blog_data.split("<br>"),
            isLoggedin: "yes",
            name: found1.name

          });
        }

      });
    })



  } else {
    Blog.findOne({
      _id: n_p
    }, function (err, post) {

      if (post) {
        res.render("currentblog", {
          title: post.heading,
          date: post.date,
          img: post.image_link,
          data: post.blog_data.split("<br>"),
          isLoggedin: "no"

        });
      }

    });

  }


})



app.get('/register', (req, res) => {
  res.render('register', {
    isLoggedin: "no"
  })
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
      if (req.isAuthenticated()) {

        User.findOne({
          Id: req.user.Id
        }, (err, found1) => {
          res.render("useralreadyexists", {
            message: "User already exists!",
            isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
            name: (req.isAuthenticated() ? found1.name : "")
          })

        })
      } else {
        res.render("useralreadyexists", {
          message: "User already exists!",
          isLoggedin: "no",
          name: ""
        })
      }
    } else {
      passport.authenticate("local", {
        failureRedirect: '/login'
      })(req, res, function () {
        res.redirect('/products')
      })
    }
  });
})



app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/products')
  } else res.render('login', {
    isLoggedin: "no"
  })
})
//*************************/
app.get('/orders', (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      res.render("orders", {
        isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
        name: (req.isAuthenticated() ? found1.name : ""),
        orders: found1.orders
      })

    })
  } else res.redirect("/login")
})


app.get('/cart', (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      res.render("cart", {
        isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
        name: (req.isAuthenticated() ? found1.name : ""),
        cart: found1.cart
      })

    })
  } else res.redirect("/login")
})

app.get("/termsandcondition", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      res.render("termsandcondition", {
        isLoggedin: "yes",
        name: found1.name
      })
    })
  } else {
    res.render("termsandcondition", {
      isLoggedin: "no"
    })
  }
})

app.get("/privacypolicy", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({
      Id: req.user.Id
    }, (err, found1) => {
      res.render("privacypolicy", {
        isLoggedin: "yes",
        name: found1.name
      })
    })
  } else {
    res.render("privacypolicy", {
      isLoggedin: "no"
    })
  }
})




//********************** */


app.post('/login', (req, res) => {
  passport.authenticate("local")(req, res, function () {
    res.redirect("/products");
  })
})
app.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/')
})




app.get('/secret', ensureAuth, (req, res) => {

  User.findOne({
    Id: req.user.Id
  }, (err, found1) => {
    res.render('secret', {
      user: req.user.name,
      name: found1.name,
      isLoggedin: "yes"
    })
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
    res.redirect("/products");
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