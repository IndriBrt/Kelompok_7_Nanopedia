const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const app = express()

app.use(bodyParser.urlencoded({extended : true}));
//middleware untuk mengakses cokie
app.use(cookieParser())

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.json())

const indexRouter = require('./router/index');
const adminRouter = require('./router/admin');
const TokenModel = require('./models/TokenModel');
const port = process.env.PORT || 3000

app.use('/', indexRouter);
//menggunakan router untuk halaman admin
app.use('/admin', adminRouter);

//koneksi ke database
mongoose.connect("mongodb+srv://admin:admin@cluster0.08mya.mongodb.net/nanopedia?retryWrites=true&w=majority", () => {
    app.listen(port, () => {
        console.log('Server sudah berjalan di port 3000')
    })
})


