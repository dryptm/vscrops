const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const findOrCreate = require("mongoose-findorcreate");
const userSchema = new mongoose.Schema({
    username : String,
    name : String,
    Id : String,
    password : String,
    orders : Array,
    cart : Array
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User = new mongoose.model("Users",userSchema);
module.exports = User;