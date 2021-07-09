const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const adminSchema = new mongoose.Schema({
    username : String,
    password : Number
});

adminSchema.plugin(passportLocalMongoose);
const Admin = new mongoose.model("Admins",adminSchema);
module.exports = Admin;