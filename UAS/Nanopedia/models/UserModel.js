const mongoose = require('mongoose');

const Users = new mongoose.Schema({
    firstName : String,
    lastName : String,
    email : String,
    password : String,
    wishlist: Array,
    cart: Array,
    phone: String,
    address1: String,
    address2: String,
    postcode: Number,
    state: String,
    area: String,
    role: String
})

module.exports = mongoose.model("users", Users);