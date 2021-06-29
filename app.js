const nodemailer = require('nodemailer');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session')
const passport = require('passport')
const mongoose = require("mongoose");
const User = require('./models/users');
const Product = require('./models/products');
const mailinglist = require('./models/mailinglist');
function makeid(length) {
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}

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
      username: req.user.username
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
         _id: req.user._id
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
         _id: req.user._id
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
     _id: req.user._id
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
       _id: req.user._id
      }, (err, found1) => {
        res.render("individualproduct", {
          found: found,
          isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
          name: (req.isAuthenticated() ? found1.name : ""),
          id : found._id

        })

      })
    } else {
      res.render("individualproduct", {
        found: found,
        isLoggedin: "no",
        id : found._id
      })

    }



    
  })
})

app.post('/add_to_cart/:id', (rq, rs) => {
  Product.findOne({
    _id: rq.params.id
  }, (err, found) => {

    if (rq.isAuthenticated()) {
      // console.log(req.user.username)
      var cart_obj = [];
      User.findOne({
        _id: rq.user._id
      }, (err, found1) => {
        cart_obj = found1.cart;
        console.log(found.product_name)
         if(cart_obj.find(ob=>ob.name===found.product_name))
        {
          console.log("found and cart updated")
          var i = cart_obj.findIndex(ob=>ob.name === found.product_name);
          cart_obj[i].quantity=(Number(rq.body.tot_price)) / (found.product_price - ((found.product_price * found.product_discount) / 100))
        }
        else {
          console.log("new item added to cart")
         cart_obj.push({
          "name": found.product_name,
          "total_price": Number(rq.body.tot_price),
          "product_image": found.product_image,
          "quantity": (Number(rq.body.tot_price)) / (found.product_price - ((found.product_price * found.product_discount) / 100))
        })
      }
  
        User.updateOne({
          _id: rq.user._id
        }, {
          cart: cart_obj
        }, (err) => {
          if (err) {
            console.log(err)
          } else {
            ///*********AFTER CART UPDATE********* */
          
            rs.redirect('/cart')
          }
        })
      })
  
    } else {
      rs.render("needloginfirst", {
        isLoggedin:"no"
      })
    }
  })  

  
})

app.get("/contactus", function (req, res) {

  if (req.isAuthenticated()) {
    User.findOne({
     _id: req.user._id
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
     _id: req.user._id
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
     _id: req.user._id
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


///////////////////////////////////////////////////////////////////////////
app.get('/forgot',(req,res)=>{
  if(req.isAuthenticated()){
    User.findOne({
      _id: req.user._id
    }, (err, found1) => {
      res.render("forgot_password", {
        isLoggedin : "yes",
        name : found1.name
      })  
    
  })

  }
  else {
    res.render("forgot_password", {
      isLoggedin : "no"
    })
  }
})

app.post('/forgot',(req,res)=>{
   
    User.findOne({username : req.body.email},(err,found)=>{
      if(found.Id && found && found.username){
    // login with google
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'text789456text@gmail.com',
        pass: '1@2@3@4@'
      }
    });
    User.findOne({username : req.body.email},(err,found)=>{
      if(found){
    var mailOptions = {
      from: 'text789456text@gmail.com',
      to: req.body.email,
      subject: 'Reset Password',
      html : "<div marginheight='0' topmargin='0' marginwidth='0' style='margin: 0px; background-color: #f2f3f8;' leftmargin='0'> <table cellspacing='0' border='0' cellpadding='0' width='100%' bgcolor='#f2f3f8' style='@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;'> <tr> <td> <table style='background-color: #f2f3f8; max-width:670px; margin:0 auto;' width='100%' border='0' align='center' cellpadding='0' cellspacing='0'> <tr> <td style='height:80px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <a href='' title='logo' target='_blank'> <img width='60' src='https://img1.wsimg.com/isteam/ip/3347e55c-bce2-49cf-babe-4e156ce94552/favicon/1da8e68b-6374-48c8-8049-d62292c72173.png' title='logo' alt='logo' style='transform : scale(1.5);'> </a> </td></tr><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td> <table width='95%' border='0' align='center' cellpadding='0' cellspacing='0' style='max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);'> <tr> <td style='height:40px;'>&nbsp;</td></tr><tr> <td style='padding:0 35px;'> <h1 style='color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;'>You have requested to reset your password</h1> <span style='display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;'></span> <p style='color:#455056; font-size:15px;line-height:24px; margin:0;'> You had logged in via google in the past. <br> Please login with Google! </p><a href='http://localhost:3000/login' style='background:#D4B435;text-decoration:none !important; font-weight:500; margin-top:35px; color:#000;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;'>Login</a> </td></tr><tr> <td style='height:40px;'>&nbsp;</td></tr></table> </td><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <p style='font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;'>&copy; <strong>www.vishuddhacrops.com</strong></p></td></tr><tr> <td style='height:80px;'>&nbsp;</td></tr></table> </td></tr></table></div>"

    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        if(req.isAuthenticated()){
          User.findOne({
            _id: req.user._id
          }, (err, found1) => {
            res.render("check_your_email", {
              isLoggedin : "yes",
              name : found1.name
            })  
          
        })
      
        }
        else {
          res.render("check_your_email", {
            isLoggedin : "no"
          })
        }
      }
    });
        
      }
    })
       
      }
      else if(found && found.username) {
          
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'text789456text@gmail.com',
            pass: '1@2@3@4@'
          }
        });
        User.findOne({username : req.body.email},(err,found)=>{
          if(found){
      var ht = "<div marginheight='0' topmargin='0' marginwidth='0' style='margin: 0px; background-color: #f2f3f8;' leftmargin='0'> <table cellspacing='0' border='0' cellpadding='0' width='100%' bgcolor='#f2f3f8' style='@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;'> <tr> <td> <table style='background-color: #f2f3f8; max-width:670px; margin:0 auto;' width='100%' border='0' align='center' cellpadding='0' cellspacing='0'> <tr> <td style='height:80px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <a href='' title='logo' target='_blank'> <img width='60' src='https://img1.wsimg.com/isteam/ip/3347e55c-bce2-49cf-babe-4e156ce94552/favicon/1da8e68b-6374-48c8-8049-d62292c72173.png' title='logo' alt='logo' style='transform : scale(1.5);'> </a> </td></tr><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td> <table width='95%' border='0' align='center' cellpadding='0' cellspacing='0' style='max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);'> <tr> <td style='height:40px;'>&nbsp;</td></tr><tr> <td style='padding:0 35px;'> <h1 style='color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;'>You have requested to reset your password</h1> <span style='display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;'></span> <p style='color:#455056; font-size:15px;line-height:24px; margin:0;'> We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions. </p><a href='http://localhost:3000/change/"+ found._id+"' style='background:#D4B435;text-decoration:none !important; font-weight:500; margin-top:35px; color:#000;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;'>Reset Password</a> </td></tr><tr> <td style='height:40px;'>&nbsp;</td></tr></table> </td><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <p style='font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;'>&copy; <strong>www.vishuddhacrops.com</strong></p></td></tr><tr> <td style='height:80px;'>&nbsp;</td></tr></table> </td></tr></table></div>"
        var mailOptions = {
          from: 'text789456text@gmail.com',
          to: req.body.email,
          subject: 'Reset Password',
          html : ht
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            if(req.isAuthenticated()){
              User.findOne({
                _id: req.user._id
              }, (err, found1) => {
                res.render("check_your_email", {
                  isLoggedin : "yes",
                  name : found1.name
                })  
              
            })
          
            }
            else {
              res.render("check_your_email", {
                isLoggedin : "no"
              })
            }
          }
        });
            
          }
        })
      
      }
      else {
        // account with this email address doesn't exist 
        if(req.isAuthenticated()){
          User.findOne({_id : req.user._id},(err,found)=>{
              res.render("email_doesnt_exist",{
                isLoggedin : "yes",
                name : found.name
              })
          })
        }
        else {
          res.render("email_doesnt_exist",{
            isLoggedin : "no"
            })
        }
         
          
      }
    })





  
})

app.get('/change/:idd',(req,res)=>{
  
 const idd=req.params.idd 
 
  User.findOne({_id : idd},(err,found)=>{
    if(found){
      if(req.isAuthenticated()){
          res.render("change_password",{
            isLoggedin : "yes",
            name : found.name,
            id : req.params.idd
          })
      }
      else {
        res.render("change_password",{
          isLoggedin : "no",
          id : req.params.idd
          
        })
      }
    }
  })
  
  
})
app.post('/change/:idd',(req,res)=>{
  const idd = req.params.idd
  User.findOne({_id : idd},(err,found)=>{
    if(found){
      found.setPassword(req.body.password,(err,user)=>{
        user.save();
        res.render('password_changed',{
          isLoggedin : (req.isAuthenticated() ? "yes":"no"),
          name : (req.isAuthenticated() ? found.name :"")
        });
      })
    }
  })

  
})







app.get("/blog", function (req, res) {

  if (req.isAuthenticated()) {
    User.findOne({
     _id: req.user._id
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
     _id: req.user._id
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
          username: req.user.username
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
     _id: req.user._id
    }, (err, found1) => {
      res.render("orders", {
        isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
        name: (req.isAuthenticated() ? found1.name : ""),
        orders: found1.orders
      })

    })
  } else res.render("needloginfirst",{isLoggedin:"no"})
})


app.get('/cart', (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({
     _id: req.user._id
    }, (err, found1) => {
      res.render("cart", {
        isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
        name: (req.isAuthenticated() ? found1.name : ""),
        cart: found1.cart
      })

    })
  } else res.render("needloginfirst",{isLoggedin:"no"})
})

app.get("/termsandcondition", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({
     _id: req.user._id
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
     _id: req.user._id
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

  User.findOne({username : req.body.username},(err,found)=>{
    if(found){
      passport.authenticate("local")(req, res, function () {
        res.redirect("/products");
      })
    }
    else {
      if (req.isAuthenticated()) {
        User.findOne({
         _id: req.user._id
        }, (err, found1) => {
          res.render("email_doesnt_exist", {
            isLoggedin: "yes",
            name: found1.name
          })
        })
      } else {
        res.render("email_doesnt_exist", {
          isLoggedin: "no"
        })
      }
    }
  })
  
})
app.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/')
})




app.get('/secret', ensureAuth, (req, res) => {

  User.findOne({
   _id: req.user._id
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