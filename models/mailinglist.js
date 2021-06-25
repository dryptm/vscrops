const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const mailschema = new mongoose.Schema({
    email:String
});
const Mail = new mongoose.model("mail",mailschema);
module.exports = Mail;