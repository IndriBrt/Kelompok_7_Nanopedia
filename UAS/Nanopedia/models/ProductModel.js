const mongoose = require('mongoose');

const Products = new mongoose.Schema({
    name : String,
    desc : String,
    prevPrice : Number,
    price : Number,
    stock : Number,
    sold : Number,
    images : Array,

})

module.exports = mongoose.model("products", Products);