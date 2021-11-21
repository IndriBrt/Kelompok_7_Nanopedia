const express = require('express')
const crypto = require('crypto');

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

const ProductModel = require('../models/ProductModel')
const UserModel = require('../models/UserModel');
const TokenModel = require('../models/TokenModel');
const TransactionModel = require('../models/TransactionModel');
const router = express.Router()

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

router.get('/test', async (req, res) => {
    
    res.render('layouts/navbar');
    res.render('layouts/footer');
})

router.get('/', async (req, res) => {
    const products = await ProductModel.find();
    res.render('pages/index',{products:products});
})

router.post('/login',async (req, res) => {
    const {email, password} = req.body;
    const hashedPass = getHashedPassword(password);

    const user = await UserModel.findOne({email:email, password: hashedPass});
    
    if(user){
        const authToken = generateAuthToken();
        await TokenModel.create({token: authToken, user : user._id})
        res.cookie('AuthToken', authToken);
        res.cookie('UserId', user._id);
        if(user.role == 'admin'){
            res.redirect('/admin');
        }
        res.render('pages/checkout', {msg : {color: "success", strong: "Login Berhasil", text : "", user: req.cookies['UserId']}});
    }
        
    else
        res.render('pages/checkout', {msg : {color: "danger", strong: "Gagal Login", text : "Email atau Password salah", user: req.cookies['UserId']}});
})

router.get('/logout',async (req, res) => {
    if(!req.cookies['AuthToken'])
        res.redirect('/cart')
    await TokenModel.findOneAndDelete({token : req.cookies['AuthToken']})
    res.clearCookie('AuthToken');
    res.clearCookie('UserId');
    res.redirect("/");
})

router.post('/register',async (req, res) => {
    let checkUser = await UserModel.find({email : req.body.email });
    
    if(checkUser.length > 0){
        res.render('pages/checkout', {msg : {color: "danger", strong: "Gagal Register", text : "Email sudah terdaftar", user: req.cookies['UserId']}});
    }

    await UserModel.create({
        firstName: req.body.firstName, 
        lastName:req.body.firstName,
        email: req.body.email, 
        role: "user",
        cart: [],
        wishlist: [],
        
        password: getHashedPassword(req.body.password)
    });

    res.render('pages/checkout', {msg : {color: "success", strong: "Register Berhasil", text : "Silahkan login", user: req.cookies['UserId']}});
})

router.get('/about', (req, res) => {
    res.render('pages/about');
})

router.get('/Profile',requireAuth, (req, res) => {
    res.render('pages/Profile', {user:req.user});
})

router.get('/checkout', requireAuth,async (req, res) => {
    const user = await UserModel.findOne({_id : req.cookies['UserId']})
    let products = await ProductModel.find({
        '_id' : {
            $in: user.cart.map(x => x.id)
        }
    })

    products = products.map(x => {
        let p = user.cart.find(c => c.id == x._id)
        x = {...x.toObject(), ...p}
        return {...x, ...p}
    })

    res.render('pages/checkout', {products:products, user:req.cookies['UserId'], userData : user});
})

router.post('/checkout/create',requireAuth,  async (req, res) => {
    req.body.products = JSON.parse(req.body.products)
    await TransactionModel.create(req.body)
    await UserModel.findOneAndUpdate({_id : req.user._id}, {cart : []})
    res.redirect("/checkout");
})

router.get('/contact-us', (req, res) => {
    res.render('pages/contact-us');
})

router.get('/cart',requireAuth, async (req, res) => {
    const user = await UserModel.findOne({_id : req.user._id})
    let products = await ProductModel.find({
        '_id' : {
            $in: user.cart.map(x => x.id)
        }
    })

    products = products.map(x => {
        let p = user.cart.find(c => c.id == x._id)
        x = {...x.toObject(), ...p}
        return {...x, ...p}
    })
    
    res.render('pages/cart',{products : products})
})

router.post('/cart/add',requireAuth, async (req, res) => {
    const {id, size, qty} = req.body;
    
    const nea = await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { "$push": { "cart": {
            id: id,
            size: size,
            qty: qty
        } } }
    );

    res.redirect('/cart')
})

router.get('/cart/add/:id',requireAuth, async (req, res) => {
    const id = req.params.id;
    
    const nea = await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { $push: { cart: {
            id: id,
            size: "M",
            qty: 1
        } } }
    );

    res.redirect('/cart')
})

router.get('/cart/remove/:id',requireAuth, async (req, res) => {
    const id = req.params.id;
    
    await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { $pull: {cart: {  id: id   } } }
    );

    res.redirect('/cart')
})

router.get('/wishlist/:id', requireAuth,async (req, res) => {
    const id = req.params.id;
    
    const nea = await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { "$push": { "wishlist": id } }
    );

    res.redirect('/wishlist')
}) 

router.get('/wishlist/:id/remove', requireAuth,async (req, res) => {
    const id = req.params.id;
    
    await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { $pullAll: {wishlist: [id] } }
    );

    res.redirect('/wishlist')
})

router.get('/wishlist', requireAuth,async (req, res) => {
    const user = await UserModel.findOne({_id : req.user._id})
    const products = await ProductModel.find({
        '_id' : {
            $in: user.wishlist
        }
    })
    
    res.render('pages/wishlist',{products : products})
})

router.get('/shop', async(req, res) => {
    let products
    if(!req.query)
    products = await ProductModel.find();
    else
    products = await ProductModel.find({ "name" : { $regex: new RegExp(req.query.name), $options: 'i' } });
    res.render('pages/shop', {products : products})
})



router.get('/shop-detail/:id', async (req, res) => {
    const id = req.params.id;
    const product = await ProductModel.findOne({_id:id})
    
    if(product)
        res.render('pages/shop-detail', {product : product});
    else
        res.send("gaada");
})

router.get('/profile/edit',requireAuth, (req, res) => {
    res.render('pages/Profile - Copy', {user:req.user})
})

router.post('/profile/update',requireAuth, async (req, res) => {
    
    await UserModel.findByIdAndUpdate({_id: req.user._id} , { $set : {...req.body} } )
    
    res.redirect('/Profile')
})

router.get('/service', (req, res) => {
    res.render('pages/service')
})

router.get('/my-account', requireAuth,(req, res) => {
    res.render('pages/my-account')
})

module.exports = router;