// configuring passport js
require('dotenv').config()
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require('passport-local').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../models/users');
module.exports = function (passport) {
  passport.use(User.createStrategy());
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
  passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID_GOOGLE,
      clientSecret: process.env.CLIENT_SECRET_GOOGLE,
      callbackURL: "https://vscrop.herokuapp.com/auth/google/google_login",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOne({
        username: profile.emails[0].value,
        name: profile.displayName,
        Id: profile.id
      }, (err, found) => {
        if (found) {
          return cb(err, found)
        } else {
          const user = new User({
            username: profile.emails[0].value,
            name: profile.displayName,
            Id: profile.id,
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

          })
          user.save();
          return cb(err, user);
        }
      })
    }
  ));


}