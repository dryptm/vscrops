const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const productSchema = new mongoose.Schema({
    product_name : String,
    product_price : Number,
    product_image : String,
    product_discount : Number,
    product_sku : String
});
const Product = new mongoose.model("Products",productSchema);
module.exports = Product;