const nodemailer = require('nodemailer');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require('express-session')
const passport = require('passport')
const mongoose = require("mongoose");
const User = require('./models/users');
const Product = require('./models/products');
const Admin = require('./models/admin');
const Coupon = require("./models/coupons");
const mailinglist = require('./models/mailinglist');
const Razorpay = require("razorpay")
const Order = require('./models/orders')
const fast2sms = require('fast-two-sms')
const axios = require('axios')
const Track = require('./models/tracking')
const fetch = require('node-fetch');
var cors = require('cors')




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

app.use(cors({
  origin: true
}));


var blogSchema = new mongoose.Schema({
  heading: String,
  date: String,
  image_link: String,
  blog_data: String
});

var Blog = mongoose.model('Blog', blogSchema);



// product sku maker
Product.find({}, (err, found) => {

  for (var i = 0; i < found.length; i++) {
    Product.findOne({
      _id: found[i]._id
    }, (err, found1) => {
      var x = found1.product_name
      var y = x.split(" ")
      for (var j = 0; j < y.length; j++) {
        y[j] = y[j].substring(0, 3)
      }
      if (found1.product_sku == "") {

        Product.findOneAndUpdate({
          _id: found1._id
        }, {
          product_sku: y.join("-")
        }, {
          new: true
        }, (err, foundx) => {
          console.log(found1.product_name + " sku changed")
        })
      }
    })
  }
})
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
          id: found._id

        })

      })
    } else {
      res.render("individualproduct", {
        found: found,
        isLoggedin: "no",
        id: found._id
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
        if (cart_obj.find(ob => ob.name === found.product_name)) {
          console.log("found and cart updated")
          console.log(rq.body.tot_price)
          var i = cart_obj.findIndex(ob => ob.name === found.product_name);
          cart_obj[i].quantity = (Number(rq.body.tot_price)) / (found.product_price - ((found.product_price * found.product_discount) / 100))
          cart_obj[i].total_price = Number(rq.body.tot_price)
          cart_obj[i].original_price = Number(found.product_price)
        } else {
          console.log("new item added to cart")
          
          cart_obj.push({
            "name": found.product_name,
            "total_price": Number(rq.body.tot_price),
            "product_image": found.product_image,
            "quantity": (Number(rq.body.tot_price)) / (found.product_price - ((found.product_price * found.product_discount) / 100)),
            "original_price": Number(found.product_price)
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
            ///****AFTER CART UPDATE**** */

            rs.redirect('/cart')
          }
        })
      })

    } else {
      rs.render("needloginfirst", {
        isLoggedin: "no"
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
app.get('/forgot', (req, res) => {
  if (req.isAuthenticated()) {
    User.findOne({
      _id: req.user._id
    }, (err, found1) => {
      res.render("forgot_password", {
        isLoggedin: "yes",
        name: found1.name
      })

    })

  } else {
    res.render("forgot_password", {
      isLoggedin: "no"
    })
  }
})

app.post('/forgot', (req, res) => {

  User.findOne({
    username: req.body.email
  }, (err, found) => {
    if (found.Id && found && found.username) {
      // login with google
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'text789456text@gmail.com',
          pass: '1@2@3@4@'
        }
      });
      User.findOne({
        username: req.body.email
      }, (err, found) => {
        if (found) {
          var mailOptions = {
            from: 'text789456text@gmail.com',
            to: req.body.email,
            subject: 'Reset Password',
            html: "<div marginheight='0' topmargin='0' marginwidth='0' style='margin: 0px; background-color: #f2f3f8;' leftmargin='0'> <table cellspacing='0' border='0' cellpadding='0' width='100%' bgcolor='#f2f3f8' style='@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;'> <tr> <td> <table style='background-color: #f2f3f8; max-width:670px; margin:0 auto;' width='100%' border='0' align='center' cellpadding='0' cellspacing='0'> <tr> <td style='height:80px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <a href='' title='logo' target='_blank'> <img width='60' src='https://img1.wsimg.com/isteam/ip/3347e55c-bce2-49cf-babe-4e156ce94552/favicon/1da8e68b-6374-48c8-8049-d62292c72173.png' title='logo' alt='logo' style='transform : scale(1.5);'> </a> </td></tr><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td> <table width='95%' border='0' align='center' cellpadding='0' cellspacing='0' style='max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);'> <tr> <td style='height:40px;'>&nbsp;</td></tr><tr> <td style='padding:0 35px;'> <h1 style='color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;'>You have requested to reset your password</h1> <span style='display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;'></span> <p style='color:#455056; font-size:15px;line-height:24px; margin:0;'> You had logged in via google in the past. <br> Please login with Google! </p><a href='http://localhost:3000/login' style='background:#D4B435;text-decoration:none !important; font-weight:500; margin-top:35px; color:#000;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;'>Login</a> </td></tr><tr> <td style='height:40px;'>&nbsp;</td></tr></table> </td><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <p style='font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;'>&copy; <strong>www.vishuddhacrops.com</strong></p></td></tr><tr> <td style='height:80px;'>&nbsp;</td></tr></table> </td></tr></table></div>"

          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              if (req.isAuthenticated()) {
                User.findOne({
                  _id: req.user._id
                }, (err, found1) => {
                  res.render("check_your_email", {
                    isLoggedin: "yes",
                    name: found1.name
                  })

                })

              } else {
                res.render("check_your_email", {
                  isLoggedin: "no"
                })
              }
            }
          });

        }
      })

    } else if (found && found.username) {

      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'text789456text@gmail.com',
          pass: '1@2@3@4@'
        }
      });
      User.findOne({
        username: req.body.email
      }, (err, found) => {
        if (found) {
          var ht = "<div marginheight='0' topmargin='0' marginwidth='0' style='margin: 0px; background-color: #f2f3f8;' leftmargin='0'> <table cellspacing='0' border='0' cellpadding='0' width='100%' bgcolor='#f2f3f8' style='@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;'> <tr> <td> <table style='background-color: #f2f3f8; max-width:670px; margin:0 auto;' width='100%' border='0' align='center' cellpadding='0' cellspacing='0'> <tr> <td style='height:80px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <a href='' title='logo' target='_blank'> <img width='60' src='https://img1.wsimg.com/isteam/ip/3347e55c-bce2-49cf-babe-4e156ce94552/favicon/1da8e68b-6374-48c8-8049-d62292c72173.png' title='logo' alt='logo' style='transform : scale(1.5);'> </a> </td></tr><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td> <table width='95%' border='0' align='center' cellpadding='0' cellspacing='0' style='max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);'> <tr> <td style='height:40px;'>&nbsp;</td></tr><tr> <td style='padding:0 35px;'> <h1 style='color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;'>You have requested to reset your password</h1> <span style='display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;'></span> <p style='color:#455056; font-size:15px;line-height:24px; margin:0;'> We cannot simply send you your old password. A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions. </p><a href='http://localhost:3000/change/" + found._id + "' style='background:#D4B435;text-decoration:none !important; font-weight:500; margin-top:35px; color:#000;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;'>Reset Password</a> </td></tr><tr> <td style='height:40px;'>&nbsp;</td></tr></table> </td><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <p style='font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;'>&copy; <strong>www.vishuddhacrops.com</strong></p></td></tr><tr> <td style='height:80px;'>&nbsp;</td></tr></table> </td></tr></table></div>"
          var mailOptions = {
            from: 'text789456text@gmail.com',
            to: req.body.email,
            subject: 'Reset Password',
            html: ht
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              if (req.isAuthenticated()) {
                User.findOne({
                  _id: req.user._id
                }, (err, found1) => {
                  res.render("check_your_email", {
                    isLoggedin: "yes",
                    name: found1.name
                  })

                })

              } else {
                res.render("check_your_email", {
                  isLoggedin: "no"
                })
              }
            }
          });

        }
      })

    } else {
      // account with this email address doesn't exist 
      if (req.isAuthenticated()) {
        User.findOne({
          _id: req.user._id
        }, (err, found) => {
          res.render("email_doesnt_exist", {
            isLoggedin: "yes",
            name: found.name
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

app.get('/change/:idd', (req, res) => {

  const idd = req.params.idd

  User.findOne({
    _id: idd
  }, (err, found) => {
    if (found) {
      if (req.isAuthenticated()) {
        res.render("change_password", {
          isLoggedin: "yes",
          name: found.name,
          id: req.params.idd
        })
      } else {
        res.render("change_password", {
          isLoggedin: "no",
          id: req.params.idd

        })
      }
    }
  })


})
app.post('/change/:idd', (req, res) => {
  const idd = req.params.idd
  User.findOne({
    _id: idd
  }, (err, found) => {
    if (found) {
      found.setPassword(req.body.password, (err, user) => {
        user.save();
        res.render('password_changed', {
          isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
          name: (req.isAuthenticated() ? found.name : "")
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
            name: found1.name,
            iddx: post._id
          });
        }

      });
    })



  } else {
    Blog.findOne({
      _id: req.params.np
    }, function (err, post) {

      if (post) {
        res.render("currentblog", {
          title: post.heading,
          date: post.date,
          img: post.image_link,
          data: post.blog_data.split("<br>"),
          isLoggedin: "no",
          iddx: post._id
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
    orders: [],
    cart: [],
    billing_address1: "",
    city: "",
    pincode: "",
    state: "",
    phone: ""
  }, req.body.password, function (err) {
    if (err) {
      if (req.isAuthenticated()) {

        User.findOne({
          username: req.user.username
        }, (err, found1) => {


          if (found1) {
            res.render("useralreadyexists", {
              message: "User already exists!",
              isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
              name: (req.isAuthenticated() ? found1.name : "")
            })
          }
        })
      } else {
        res.render("useralreadyexists", {
          message: "User already exists!",
          isLoggedin: "no",
          name: ""
        })
      }
    } else {
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'text789456text@gmail.com',
          pass: '1@2@3@4@'
        }
      });
      var mailOptions = {
        from: 'text789456text@gmail.com',
        to: req.body.username,
        subject: 'Welcome to Vishuddha Crops',
        html: "<div marginheight='0' topmargin='0' marginwidth='0' style='margin: 0px; background-color: #f2f3f8;' leftmargin='0'> <table cellspacing='0' border='0' cellpadding='0' width='100%' bgcolor='#f2f3f8' style='@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;'> <tr> <td> <table style='background-color: #f2f3f8; max-width:670px; margin:0 auto;' width='100%' border='0' align='center' cellpadding='0' cellspacing='0'> <tr> <td style='height:80px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <a href='' title='logo' target='_blank'> <img width='60' src='https://img1.wsimg.com/isteam/ip/3347e55c-bce2-49cf-babe-4e156ce94552/favicon/1da8e68b-6374-48c8-8049-d62292c72173.png' title='logo' alt='logo' style='transform : scale(1.5);'> </a> </td></tr><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td> <table width='95%' border='0' align='center' cellpadding='0' cellspacing='0' style='max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);'> <tr> <td style='height:40px;'>&nbsp;</td></tr><tr> <td style='padding:0 35px;'> <h1 style='color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;'>Thank you for choosing us!</h1> <span style='display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;'></span> <p style='color:#455056; font-size:15px;line-height:24px; margin:0;'> We are happy to inform you that you have now become an essential part of Vishuddha Crops. <br> </p><a href='http://localhost:3000/login' style='background:#D4B435;text-decoration:none !important; font-weight:500; margin-top:35px; color:#000;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;'>Login</a> </td></tr><tr> <td style='height:40px;'>&nbsp;</td></tr></table> </td><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <p style='font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;'>&copy; <strong>www.vishuddhacrops.com</strong></p></td></tr><tr> <td style='height:80px;'>&nbsp;</td></tr></table> </td></tr></table></div>"

      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        }
      })
      passport.authenticate("local", {
        failureRedirect: '/auth_failed'
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

      Track.find({},(e,f)=>{
        res.render("orders", {
          isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
          name: (req.isAuthenticated() ? found1.name : ""),
          orders: found1.orders,
          track : f
        })
      })
      

    })
  } else res.render("needloginfirst", {
    isLoggedin: "no"
  })
})


app.post('/discount', (req, res) => {


  if (req.isAuthenticated()) {

    Coupon.findOne({
      coupon_code: req.body.discount.toLowerCase()
    }, (err, found) => {
      if (found) {

        // console.log(found)

        var arr = req.user.cart
        for(var i=0;i<arr.length;i++){
          arr[i].coupon_code=found.coupon_code;
        }
        // console.log(arr)

        for (let i = 0; i < arr.length; ++i) {
          var dd = arr[i].original_price - arr[i].original_price * Number(found.coupon_discount) / 100;
          arr[i].total_price = dd * arr[i].quantity
        }
        User.updateOne({
          _id: req.user._id
        }, {
          cart: arr
        }, (err) => {
          if (err) console.log(err)
          else {
            res.redirect('/cart')
          }
        })
      } else {
        res.redirect('/cart')

      }
    })

  } else {
    res.render("needloginfirst", {
      isLoggedin: "no"
    })
  }
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
  } else res.render("needloginfirst", {
    isLoggedin: "no"
  })
})
app.get("/delete/:np", (req, res) => {
  var npp = req.params.np
  if (req.isAuthenticated()) {
    User.findOne({
      _id: req.user._id
    }, (err, found1) => {
      // console.log(found1.cart)
      var arr = found1.cart
      for (let i = 0; i < found1.cart.length; ++i) {
        if (arr[i].name === npp) {
          arr.splice(i, 1)
        }
      }
      User.updateOne({
        _id: req.user._id
      }, {
        cart: arr
      }, (err) => {
        if (err) console.log(err)
        else res.redirect('/cart')
      })



      // for (var i = 0; i < found1.cart.length; i++) {
      //   if (found1.cart[i].name == npp) {
      //     found1.cart.splice(i, 1)
      //     // console.log(found1.cart)
      //     User.findOneAndUpdate({
      //       _id: req.user._id
      //     }, {
      //       cart: found1.cart
      //     }, {
      //       new: true
      //     }, (err, data) => {
      //       console.log(data)
      //       res.redirect("/cart")
      //     })
      //   }
      // }

    })
  } else res.render("needloginfirst", {
    isLoggedin: "no"
  })
})

// app.get('/payment', (req, res) => {
//   if (req.isAuthenticated()) {
//     User.findOne({
//       _id: req.user._id
//     }, (err, found1) => {

// var instance = new Razorpay({ key_id: 'rzp_test_LR5uE6mamxVSnx', key_secret: 'rVJhk7hQgFW7TK7w2TZLEYzq'})

// var options = {
//   amount: 300,  // amount in the smallest currency unit
//   currency: "INR",
//   receipt: "order_rcptid_11"
// };
// instance.orders.create(options, function(err, order) {
//   console.log(order);
//   res.render("payment", {
//     isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
//     name: (req.isAuthenticated() ? found1.name : "")
//   })

// });




//     })
//   } else res.render("needloginfirst", {
//     isLoggedin: "no"
//   })
// })

app.post('/checkout_post', (req, res) => {
  var len = Object.keys(req.body).length - 1
  console.log(req.body)
  if (req.isAuthenticated()) {
    var arr = req.user.cart
    for (let i = 0; i < Math.min(len, arr.length); ++i) {
      var old_price = arr[i].total_price / arr[i].quantity
      arr[i].quantity = Number(req.body[i + ''])
      arr[i].total_price = arr[i].quantity * old_price

    }
    User.updateOne({
      _id: req.user._id
    }, {
      cart: arr
    }, (err) => {
      if (err) console.log(err)
    })

    User.findOne({
      _id: req.user._id
    }, (err, found1) => {
      const tot_price = req.body.tot_p
      const name = req.user.name.split(' ')
      const fname = name[0]
      const lname = (name.length > 1 ? name[1] : "")
      res.render('payment_middleware', {
        isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
        name: (req.isAuthenticated() ? found1.name : ""),
        tot_price: tot_price,
        fname: fname,
        lname: lname,
        email: req.user.username,
        user: req.user
      })

    })

  } else {
    res.render("needloginfirst", {
      isLoggedin: "no"
    })
  }

})

//****************************** */

app.post('/payment_confirm', (req, res) => {


  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;



  for (let i = 0; i < req.user.cart.length; ++i) {

    const names = req.body.name.split(' ')
    const lname = names[names.length - 1]

               

var raw2 = JSON.stringify({
  "email": "vinay9415756155@gmail.com",
  "password": "Vishuddha@1120"
});

var requestOptions2 = {
  method: 'POST',
  headers: {
    "Content-Type" : "application/json"
  },
  body: raw2,
  redirect: 'follow'
};

fetch("https://apiv2.shiprocket.in/v1/external/auth/login", requestOptions2)
  .then(response => response.text())
  .then(result => {

    const raw = JSON.stringify({
      "order_id": req.body.order_id + "_" + String(i),
      "order_date": today,
      "pickup_location": "WPatelN",
      "billing_customer_name": names[0],
      "billing_last_name": lname,
      "billing_address": req.body.billing_address1,
      "billing_city": req.body.city,
      "billing_pincode": req.body.pincode,
      "billing_state": req.body.state,
      "billing_country": "India",
      "billing_email": String(req.user.username.trim()),
      "billing_phone": req.body.phone,
      "shipping_is_billing": true,
      "order_items": [{
        "name": req.user.cart[i].name,
        "sku": "Alm-Oil-100",
        "units": Number(req.user.cart[i].quantity),
        "selling_price": req.user.cart[i].total_price,
        "discount": String(((req.user.cart[i].original_price - (req.user.cart[i].total_price / req.user.cart[i].quantity)) / req.user.cart[i].original_price) * 100)
      }],
      "payment_method": (req.body.payment_id === "" ? "COD" : "Prepaid"),
      "sub_total": (req.body.payment_id === "" ? req.user.cart[i].total_price + 50 : req.user.cart[i].total_price),
      "length": Number(process.env.LENGTH),
      "breadth": Number(process.env.BREADTH),
      "height": Number(process.env.HEIGHT),
      "weight": Number(process.env.WEIGHT)
    })

    var requestOptions = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer "+JSON.parse(result).token
      },
      body: raw,
      redirect: 'follow'
    };

    fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", requestOptions)
      .then(response => response.text())
      .then(result => {
        const track = new Track({
          order_id: req.body.order_id + "_" + String(i),
          shiprocket_order_info: result
        })
        track.save();
        console.log(result)
      })
      .catch(error => console.log('error', error));

  })





    

  }

















  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'text789456text@gmail.com',
      pass: '1@2@3@4@'
    }
  });
  var mailOptions = {
    from: 'text789456text@gmail.com',
    to: req.user.username,
    subject: 'Order Placed',
    html: "<div marginheight='0' topmargin='0' marginwidth='0' style='margin: 0px; background-color: #f2f3f8;' leftmargin='0'> <table cellspacing='0' border='0' cellpadding='0' width='100%' bgcolor='#f2f3f8' style='@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;'> <tr> <td> <table style='background-color: #f2f3f8; max-width:670px; margin:0 auto;' width='100%' border='0' align='center' cellpadding='0' cellspacing='0'> <tr> <td style='height:80px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <a href='' title='logo' target='_blank'> <img width='60' src='https://img1.wsimg.com/isteam/ip/3347e55c-bce2-49cf-babe-4e156ce94552/favicon/1da8e68b-6374-48c8-8049-d62292c72173.png' title='logo' alt='logo' style='transform : scale(1.5);'> </a> </td></tr><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td> <table width='95%' border='0' align='center' cellpadding='0' cellspacing='0' style='max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);'> <tr> <td style='height:40px;'>&nbsp;</td></tr><tr> <td style='padding:0 35px;'> <h1 style='color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;'>Order Placed!</h1> <span style='display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;'></span> <p style='color:#455056; font-size:15px;line-height:24px; margin:0;'> Click below to see your orders - <br> </p><a href='http://localhost:3000/orders' style='background:#D4B435;text-decoration:none !important; font-weight:500; margin-top:35px; color:#000;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;'>My Orders</a> </td></tr><tr> <td style='height:40px;'>&nbsp;</td></tr></table> </td><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <p style='font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;'>&copy; <strong>www.vishuddhacrops.com</strong></p></td></tr><tr> <td style='height:80px;'>&nbsp;</td></tr></table> </td></tr></table></div>"

  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    }
  })



  User.updateOne({
    _id: req.user._id
  }, {
    billing_address1: req.body.billing_address1,
    city: req.body.city,
    pincode: req.body.pincode,
    state: req.body.state,
    phone: req.body.phone

  }, (err) => {
    if (err) console.log(err)
  })


  ///////orderSMS////////////////
  var a = []
  User.findOne({
    _id: req.user._id
  }, (err, foundx) => {
    // console.log(foundx)

    for (var i = 0; i < foundx.cart.length; i++) {
      a.push(foundx.cart[i].name)
    }
    a = a.join(",")
    console.log(foundx.phone)
    var options = {
      authorization: "89WE7jP3F4HVbLhKtDIAmzqrdYO5cJ2RvpBGNTyoMg0QsS6iZwntmyNAd58o7J94riIPUCLGBqYk2HxT",
      message: 'Your Order for ' + a + ' is Confirmed!\n@VishuddhaCrops',
      numbers: [foundx.phone]
    }
    fast2sms.sendMessage(options).then(response => {
      console.log(response)
    }) //Asynchronous Function
  })


  if (req.body.payment_id == "") {
    console.log(req.body)
    console.log("paid cash")
    const order = new Order({
      order_id: req.body.order_id,
      customer_name: req.body.name,
      customer_email: req.body.email,
      customer_phone: req.body.phone,
      total_amount: String(Number(req.body.amount) + 50),
      billing_address: req.body.billing_address1,
      city: req.body.city,
      pincode: req.body.pincode,
      state: req.body.state,
      payment_signature: req.body.payment_signature,
      payment_id: "COD",
      items: req.user.cart,
      date: today
    })
    order.save();
    var arr = req.user.orders
    for(var i=0;i<req.user.cart.length;i++){
      req.user.cart[i].payment_method="COD"
    }
    arr.push({
      date: today,
      total_price: req.body.amount,
      order_id : req.body.order_id,
      items: req.user.cart
    })
    User.updateOne({
      _id: req.user._id
    }, {
      orders: arr
    }, (err) => {
      if (err) console.log(err);
      else {

        User.updateOne({
            _id: req.user._id
          }, {
            cart: []
          }, (err) => {
            if (err) console.log(err);
            else {
              res.render("payment_success", {
                isLoggedin: "yes",
                name: req.user.name,
                message: "Order Confirmed!"
              });
            }
          }

        )
      }
    })
  } else {
    console.log("paid online")
    const order = new Order({
      order_id: req.body.order_id,
      customer_name: req.body.name,
      customer_email: req.body.email,
      customer_phone: req.body.phone,
      total_amount: req.body.amount,
      billing_address: req.body.billing_address1,
      city: req.body.city,
      pincode: req.body.pincode,
      state: req.body.state,
      payment_signature: req.body.payment_signature,
      payment_id: req.body.payment_id,
      items: req.user.cart,
      date: today
    })
    order.save();
    var arr = req.user.orders
    for(var i=0;i<req.user.cart.length;i++){
      req.user.cart[i].payment_method="Paid Online"
    }
    arr.push({
      date: today,
      total_price: req.body.amount,
      order_id : req.body.order_id,
      items: req.user.cart
    })
    User.updateOne({
      _id: req.user._id
    }, {
      orders: arr
    }, (err) => {
      if (err) console.log(err);
      else {

        User.updateOne({
            _id: req.user._id
          }, {
            cart: []
          }, (err) => {
            if (err) console.log(err);
            else {
              res.render("payment_success", {
                isLoggedin: "yes",
                name: req.user.name,
                message: "Payment Successful!"
              });
            }
          }

        )
      }
    })
  }




})


app.post('/payment_failed', (req, res) => {

  res.render("payment_success", {
    isLoggedin: "yes",
    name: req.user.name,
    message: "Payment Failed!"
  });
})

//**************************** */


app.post('/full_payment', (req, res) => {
  if (req.isAuthenticated()) {
    // if (req.body.phonecheck == "invalid") {
    // res.redirect("/checkout_post")
    // } else if ("valid") {
    var instance = new Razorpay({
      key_id: 'rzp_test_uRdnjYH7dCkuEr',
      key_secret: 'm3hdeo9pIMEg1DMbIvxtlEQa'
    })

    var options = {
      amount: Number(req.body.tot_price) * 100,
      currency: "INR",
      receipt: "order_rcptid_11"
    };
    instance.orders.create(options, function (err, order) {
      console.log(order);
      res.render("payment", {
        isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
        name: (req.isAuthenticated() ? req.user.name : ""),
        order_id: order.id,
        email: req.body.email,
        phone: req.body.phone,
        country: req.body.country,
        state: req.body.state,
        pincode: req.body.pincode,
        city: req.body.city,
        billing_address1: req.body.billing_address1,
        billing_address2: req.body.billing_address2,
        amount: (order.amount) / 100,
        user:req.user


      })

    });
    // }
  } else {
    res.render("needloginfirst", {
      isLoggedin: "no"
    })
  }
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

  User.findOne({
    username: req.body.username
  }, (err, found) => {
    if (found) {
      passport.authenticate("local", {
        failureRedirect: "/auth_failed"
      })(req, res, function () {
        res.redirect("/products");
      })
    } else {
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








app.get("/admin/newsletter", (req, res) => {
  if (req.isAuthenticated() && req.user.username === process.env.ADMIN_USERNAME) {
    res.render("adminnewsletter", {})

  } else {
    res.redirect("/adminfailed")
  }
})
app.post("/send", (req, res) => {
  var x = "";
  mailinglist.find({}, (err, found) => {
    for (var i = 0; i < found.length; i++) {
      x = x + found[i].email + ","
    }

    x = x.slice(0, -1)
    var mailOptions = {
      from: 'text789456text@gmail.com',
      to: x,
      subject: req.body.Subject,
      html: req.body.textarea

    };
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'text789456text@gmail.com',
        pass: '1@2@3@4@'
      }
    });
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error)
      }
      console.log(info)
    })
  })

  res.redirect("/home")
})



app.get("/admin/orders", (req, res) => {

  if (req.isAuthenticated() && req.user.username === process.env.ADMIN_USERNAME) {


    Track.find({}, (e, f) => {

      Order.find({}, (err, found) => {
        // console.log(found[found.length-1])
        res.render("adminorders", {
          orders: found,
          track: f

        })
      })



    })


  } else {
    res.redirect("/adminfailed")
  }

})


/************************************************************************************************************************************************************************* */
function sku(found) {
  var x = found
  var y = x.split(" ")
  for (var j = 0; j < y.length; j++) {
    y[j] = y[j].substring(0, 3)
  }
  var ret = y.join('-');
  return ret;

}

app.post("/order_transition/:id/:j", (req, res) => {

  var id, j;
  id = req.params.id;
  j = req.params.j;
  console.log(j)
  var l, b, h, w;
  l = req.body.length;
  b = req.body.breadth;
  h = req.body.height;
  w = req.body.weight;
  Order.findOne({
    _id: id
  }, (err, found) => {
    if (found) {

      console.log(found.payment_id === "COD" ? "COD" : "Prepaid")
      const item = found.items[j]
      // const ob = JSON.stringify({
      //   "order_id": found.order_id+"_"+String(j),
      //   "order_date": found.date, 
      //   "pickup_location": "WPatelN",
      //   "company_name": "Vishuddha Crops",
      //   "billing_customer_name": found.customer_name,
      //   "billing_address": found.billing_address,
      //   "billing_city": found.city,
      //   "billing_pincode": Number(found.pincode),
      //   "billing_state": found.state,
      //   "billing_country": "INDIA",
      //   "billing_email": found.customer_email,
      //   "billing_phone": found.customer_phone,
      //   "shipping_is_billing": true,
      //   "order_items": [
      //       {
      //           "name": found.items[j].name,
      //           "sku": sku(found.items[j].name),
      //           "units": Number(found.items[j].quantity),
      //           "selling_price": Number(found.items[j].original_price),
      //           "discount": Number(req.body.discount)
      //       }
      //   ],
      //   "payment_method": (found.payment_id==="COD"?"COD":"Prepaid"),
      //   "sub_total": Number(found.items[j].original_price),
      //   "length": Number(l),
      //   "breadth": Number(b),
      //   "height": Number(h),
      //   "weight": Number(w)
      // })

      const names = found.customer_name.split(' ')
      const lname = names[names.length - 1]
      const raw = JSON.stringify({
        "order_id": found.order_id + "_" + String(j),
        "order_date": found.date,
        "pickup_location": "WPatelN",
        "billing_customer_name": names[0],
        "billing_last_name": lname,
        "billing_address": found.billing_address,
        "billing_city": found.city,
        "billing_pincode": found.pincode,
        "billing_state": found.state,
        "billing_country": "India",
        "billing_email": String(found.customer_email.trim()),
        "billing_phone": found.customer_phone,
        "shipping_is_billing": true,
        "order_items": [{
          "name": found.items[j].name,
          "sku": "Alm-Oil-100",
          "units": Number(found.items[j].quantity),
          "selling_price": found.items[j].total_price,
          "discount": req.body.discount
        }],
        "payment_method": (found.payment_id === "COD" ? "COD" : "Prepaid"),
        "sub_total": found.items[j].total_price,
        "length": Number(l),
        "breadth": Number(b),
        "height": Number(h),
        "weight": Number(w)
      })

      var requestOptions = {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjE2MzU2NjksImlzcyI6Imh0dHBzOi8vYXBpdjIuc2hpcHJvY2tldC5pbi92MS9leHRlcm5hbC9hdXRoL2xvZ2luIiwiaWF0IjoxNjI1OTM5NDkzLCJleHAiOjE2MjY4MDM0OTMsIm5iZiI6MTYyNTkzOTQ5MywianRpIjoiRUdQTWNZVWtBR0Jpc1RkZSJ9.GpxBRPpT1V95YAiYR_2gb-dvnBTBM_K6zcQFjdI9QS0"
        },
        body: raw,
        redirect: 'follow'
      };

      fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", requestOptions)
        .then(response => response.text())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));







    }

  })
})
/************************************************************************************************************************************************************************* */













app.get('/auth_failed', (req, res) => {
  res.render("login_failed", {
    isLoggedin: (req.isAuthenticated() ? "yes" : "no"),
    name: (req.isAuthenticated() ? req.user.name : ""),
    message: "Login Failed"
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
    failureRedirect: "/auth_failed"
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/products");
  });



app.get('/admin', (req, res) => {
  res.render("admin")
})

app.post('/admin', (req, res) => {
  passport.authenticate('userLocal', {
    failureRedirect: "/adminfailed"
  })(req, res, function () {
    res.redirect('/admindashboard')

  })
})
app.get('/adminfailed', (req, res) => {
  res.render("admin_login_failed");
})

app.get('/admindashboard', (req, res) => {
  if (req.isAuthenticated() && req.user.username === process.env.ADMIN_USERNAME) {
    res.render("admindashboard", {
      user: req.user.username
    })


  } else {
    res.redirect("/admin")
  }
})






//****************************************************************************************************************************/
// CANCEL ORDER SHIPROCKET

app.get('/shiprocket/:id',(req,res)=>{

  Order.findOne({order_id : req.params.id},(err,found)=>{
    if(found){
      var arr = []
      for(let i = 0;i<found.items.length;++i){
       Track.findOne({order_id : req.params.id+"_"+String(i)},(e,f)=>{
        
         var raw = JSON.stringify({
          "ids": [JSON.parse(f.shiprocket_order_info).order_id]
        });
  

var raw2 = JSON.stringify({
  "email": "vinay9415756155@gmail.com",
  "password": "Vishuddha@1120"
});

var requestOptions2 = {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
  },
  body: raw2,
  redirect: 'follow'
};

fetch("https://apiv2.shiprocket.in/v1/external/auth/login", requestOptions2)
  .then(response => response.text())
  .then(result => {
    var requestOptions = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer "+JSON.parse(result).token
      },
      body: raw,
      redirect: 'follow'
    };
    
    fetch("https://apiv2.shiprocket.in/v1/external/orders/cancel", requestOptions)
      .then(response => response.text())
      .then(result => {
        console.log(result)
         //****************************************************************************************************** */
             
              //CHANGE ORDER STATUS
            
         //****************************************************************************************************** */
      })
      .catch(error => console.log('error', error));
  
  })



        
       })
      }
  
    
    const payment_id = found.payment_id
    if(payment_id !=="COD"){

      const total_amount = Number(found.total_amount)
      var requestOptions = {
        method: 'POST',
      };
      
      fetch("https://"+process.env.KEY_ID+":"+process.env.KEY_SECRET+"@api.razorpay.com/v1/payments/"+found.payment_id+"/refund", requestOptions)
        .then(response => response.text())
        .then(result => {
          console.log(result)
        })
        .catch(error => console.log('error', error));        

    }
    else {

      //*************************************** */
      console.log("NO REFUND NEEDED (Payment mode: COD)")
      //**************************************** */

    }
    
    
    }
  })
    
  //************************************* */
  // AFTER CANCEL REDIRECT AND UPDATE ORDER STATUS
  //************************************** */

 
})


















//*********************************************************************************************************************** */



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