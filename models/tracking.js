const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose')
const trackingSchema = new mongoose.Schema({
    order_id : String,
    shiprocket_order_info : Object
});
const Track = new mongoose.model("Tracks",trackingSchema);
module.exports = Track;