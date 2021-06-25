const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const saleSchema = new mongoose.Schema({
    is_sale : Boolean,
    discount : Number
});
const Sale = new mongoose.model("Sales",saleSchema);
module.exports = Sale;