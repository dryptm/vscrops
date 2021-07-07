const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const orderSchema = new mongoose.Schema({
   order_id : String,
   customer_name : String,
   customer_email : String,
   customer_phone : String,
   total_amount : String,
   billing_address: String,
   city:String,
   pincode:String,
   state:String,
   payment_signature:String,
   payment_id:String,
   items:Array,
   date:String


});
const Order = new mongoose.model("Orders",orderSchema);
module.exports = Order;