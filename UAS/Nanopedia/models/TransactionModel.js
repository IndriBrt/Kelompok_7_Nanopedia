const mongoose = require('mongoose');

const Transaction = new mongoose.Schema({
    card: Object,
    user : Object,
    products : Array,
    grandTotal : Number
})

module.exports = mongoose.model("transactions", Transaction);