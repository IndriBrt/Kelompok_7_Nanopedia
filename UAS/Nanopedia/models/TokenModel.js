const mongoose = require('mongoose');

const Tokens = new mongoose.Schema({
    token : String,
    user : Object
})

module.exports = mongoose.model("tokens", Tokens);