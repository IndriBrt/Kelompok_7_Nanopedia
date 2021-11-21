const express = require('express')
const ProductModel = require('../models/ProductModel')
const UserModel = require('../models/UserModel');
const TokenModel = require('../models/TokenModel');
const path = require('path');
const router = express.Router()

//menggunakan multer untuk proses upload gambar
const multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
  })
const upload = multer({ storage: storage });

//middleware autentikasi agar jika belum login tidak bisa masuk ke halaman admin
const requireAuth = async (req, res, next) => {
    const authToken = req.cookies['AuthToken'];
    req.token = await TokenModel.findOne({token : authToken})
    req.user = await UserModel.findOne({_id : req.cookies['UserId']})
    
    if (req.user) {
        next();
    } else {
        res.render('pages/checkout', {msg : {color: "danger", strong: "", text : "Silahkan Login Terlebih dahulu", user: req.cookies['UserId']}});
    }
};

router.get('/', requireAuth ,async (req, res) => {
    //ambil semua data produk
    const products = await ProductModel.find()
    res.render('admin/pages/index',{products:products})
})

//route tambah produk
router.get('/add', requireAuth ,async (req, res) => {
    res.render('admin/pages/add')
})

//route edit data produk
router.get('/edit/:id', requireAuth ,async (req, res) => {
    //ambil data produk dengan id sesuai link
    const product = await ProductModel.findOne({_id : req.params.id})
    res.render('admin/pages/edit',{product : product})
})

//proses hapus data produknya
router.get('/delete/:id', requireAuth ,async (req, res) => {
    const id = req.params.id
    await ProductModel.deleteOne({_id : id})
    res.redirect("/admin");
})

//proses tambah produknya
router.post('/create', requireAuth ,upload.array('images',10),async (req, res) => {
    //membuat data produk baru di db nya
    await ProductModel.create({
        ...req.body, images: req.files.map(f => f.filename)
    })
    res.redirect("/admin")  
})

//proses update data nya
router.post('/update', requireAuth ,upload.array('images',10),async (req, res) => {
    await ProductModel.updateOne({_id : req.body.id},
        //update data produk dengan data baru jika ada gambar yang di kirim akan di tambah ke atribut gambar
        {
        ...req.body,
        "$push": { "images": req.files.map(f => f.filename) }
        }
    )
    res.redirect("/admin")  
})

module.exports = router