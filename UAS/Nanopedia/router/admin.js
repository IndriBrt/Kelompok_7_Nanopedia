const express = require('express')
const ProductModel = require('../models/ProductModel')
const UserModel = require('../models/UserModel');
const TokenModel = require('../models/TokenModel');
const path = require('path');
const router = express.Router()

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
    const products = await ProductModel.find()
    res.render('admin/pages/index',{products:products})
})

router.get('/add', requireAuth ,async (req, res) => {
    res.render('admin/pages/add')
})

router.get('/edit/:id', requireAuth ,async (req, res) => {
    const product = await ProductModel.findOne({_id : req.params.id})
    res.render('admin/pages/edit',{product : product})
})

router.get('/delete/:id', requireAuth ,async (req, res) => {
    const id = req.params.id
    await ProductModel.deleteOne({_id : id})
    res.redirect("/admin");
})

router.post('/create', requireAuth ,upload.array('images',10),async (req, res) => {
    
    await ProductModel.create({
        ...req.body, images: req.files.map(f => f.filename)
    })
    res.redirect("/admin")  
})

router.post('/update', requireAuth ,upload.array('images',10),async (req, res) => {
    await ProductModel.updateOne({_id : req.body.id},
        {
        ...req.body,
        "$push": { "images": req.files.map(f => f.filename) }
        }
    )
    res.redirect("/admin")  
})

module.exports = router