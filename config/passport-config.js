// configuring passport js
require('dotenv').config()
var nodemailer = require('nodemailer')
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Admin = require('../models/admin')

const User = require('../models/users');
module.exports = function (passport) {
  passport.use(User.createStrategy());

  passport.use('userLocal', new LocalStrategy(Admin.authenticate()));

  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(function (id, done) {
    User.findOne({_id : id},(err,user)=>{
    if(user){
      return done(err,user)

    }
    else {
      Admin.findOne({_id : id},(err2,user2)=>{
        if(user2){
          return done(err2,user2);
        }
        else {
          return done(err2,null);
        }
      })
    }

    })
    
  });
  passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID_GOOGLE,
      clientSecret: process.env.CLIENT_SECRET_GOOGLE,
      callbackURL: "http://localhost:3000/auth/google/google_login",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {

      User.findOne({
        username: profile.emails[0].value,
      }, (err, ff) => {
        if (ff && typeof ff.Id === "undefined") {
          return cb(err, null)
        } else {
          User.findOne({
            username: profile.emails[0].value,
            name: profile.displayName,
            Id: profile.id
          }, (err, found) => {
            if (found) {
              return cb(err, found._id)
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
                to: profile.emails[0].value,
                subject: 'Welcome to Vishuddha Crops',
                html: "<div marginheight='0' topmargin='0' marginwidth='0' style='margin: 0px; background-color: #f2f3f8;' leftmargin='0'> <table cellspacing='0' border='0' cellpadding='0' width='100%' bgcolor='#f2f3f8' style='@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;'> <tr> <td> <table style='background-color: #f2f3f8; max-width:670px; margin:0 auto;' width='100%' border='0' align='center' cellpadding='0' cellspacing='0'> <tr> <td style='height:80px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <a href='' title='logo' target='_blank'> <img width='60' src='https://img1.wsimg.com/isteam/ip/3347e55c-bce2-49cf-babe-4e156ce94552/favicon/1da8e68b-6374-48c8-8049-d62292c72173.png' title='logo' alt='logo' style='transform : scale(1.5);'> </a> </td></tr><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td> <table width='95%' border='0' align='center' cellpadding='0' cellspacing='0' style='max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);'> <tr> <td style='height:40px;'>&nbsp;</td></tr><tr> <td style='padding:0 35px;'> <h1 style='color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;'>Thank you for choosing us!</h1> <span style='display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;'></span> <p style='color:#455056; font-size:15px;line-height:24px; margin:0;'> We are happy to inform you that you have now become an essential part of Vishuddha Crops. <br> </p><a href='http://localhost:3000/login' style='background:#D4B435;text-decoration:none !important; font-weight:500; margin-top:35px; color:#000;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;'>Login</a> </td></tr><tr> <td style='height:40px;'>&nbsp;</td></tr></table> </td><tr> <td style='height:20px;'>&nbsp;</td></tr><tr> <td style='text-align:center;'> <p style='font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;'>&copy; <strong>www.vishuddhacrops.com</strong></p></td></tr><tr> <td style='height:80px;'>&nbsp;</td></tr></table> </td></tr></table></div>"

              };
              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                }
              })
              const user = new User({
                username: profile.emails[0].value,
                name: profile.displayName,
                Id: profile.id,
                orders: [],
                cart: [],
                billing_address1: "",
                city: "",
                pincode: "",
                state: "",
                phone: ""

              })
              user.save();
              return cb(err, user._id);
            }
          })
        }
      })


    }
  ));


}