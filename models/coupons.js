const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const couponSchema = new mongoose.Schema({
    coupon_code : String,
    coupon_discount : Number
});
const Coupon = new mongoose.model("Coupons",couponSchema);
module.exports = Coupon;