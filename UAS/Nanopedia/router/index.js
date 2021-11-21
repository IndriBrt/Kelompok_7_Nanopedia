const express = require('express')
const crypto = require('crypto');

//fungsi untuk menghash password agar lebih aman 
const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

//fungsi untuk membuat string acak yang akan dipakai untuk token
const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

const ProductModel = require('../models/ProductModel')
const UserModel = require('../models/UserModel');
const TokenModel = require('../models/TokenModel');
const TransactionModel = require('../models/TransactionModel');
const router = express.Router()

//membuat custom middleware 
//router yang menggunakan middleware ini harus login terlebih dahulu
//jika tidak akan dilempar ke page halaman login
const requireAuth = async (req, res, next) => {
    //ambil user dan token dari db sesuai data pada cokie
    const authToken = req.cookies['AuthToken'];
    req.token = await TokenModel.findOne({token : authToken})
    //req.user akan menyimpan data user yang sedang login
    req.user = await UserModel.findOne({_id : req.cookies['UserId']})
    
    if (req.user) {
        next();
        //jika data tidak ada, di lempar ke halaman login
    } else {
        res.render('pages/checkout', {msg : {color: "danger", strong: "", text : "Silahkan Login Terlebih dahulu", user: req.cookies['UserId']}});
    }
};

//router index
router.get('/', async (req, res) => {
    //mengambil data produk dari database
    const products = await ProductModel.find();
    res.render('pages/index',{products:products});
})

//router proses login
router.post('/login',async (req, res) => {
    const {email, password} = req.body;
    const hashedPass = getHashedPassword(password);

    //mengambil user dari db sesuai email dan pass yang di kirim 
    const user = await UserModel.findOne({email:email, password: hashedPass});
    //cek jika user ada
    if(user){
        const authToken = generateAuthToken();
        await TokenModel.create({token: authToken, user : user._id})
        //menyimpan cookie
        res.cookie('AuthToken', authToken);
        res.cookie('UserId', user._id);
        //jika user adalah admin lempar ke halaman admin
        if(user.role == 'admin'){
            res.redirect('/admin');
        }
        res.render('pages/checkout', {msg : {color: "success", strong: "Login Berhasil", text : "", user: req.cookies['UserId']}});
    }
    //jika tidak ada beri pesan eror
    else
        res.render('pages/checkout', {msg : {color: "danger", strong: "Gagal Login", text : "Email atau Password salah", user: req.cookies['UserId']}});
})

//router untuk pross logout
router.get('/logout',async (req, res) => {
    if(!req.cookies['AuthToken'])
        res.redirect('/cart')
    //hapus token dari database
    await TokenModel.findOneAndDelete({token : req.cookies['AuthToken']})
    //hapus cokkie
    res.clearCookie('AuthToken');
    res.clearCookie('UserId');
    res.redirect("/");
})

router.post('/register',async (req, res) => {
    //ambil user dari db dengan email yang di kirim
    let checkUser = await UserModel.find({email : req.body.email });
    //jika user sudah digunakan tampilkan pesan 
    if(checkUser.length > 0){
        res.render('pages/checkout', {msg : {color: "danger", strong: "Gagal Register", text : "Email sudah terdaftar", user: req.cookies['UserId']}});
    }

    //buat data user baru
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
    //render halaman profile dengan data user yang sedang login
    res.render('pages/Profile', {user:req.user});
})

router.get('/checkout', requireAuth,async (req, res) => {
    //mengambil data user di db
    const user = await UserModel.findOne({_id : req.cookies['UserId']})
    //mengambil data produk yang ada di atribut cart pada user 
    let products = await ProductModel.find({
        '_id' : {
            $in: user.cart.map(x => x.id)
        }
    })

    //mengambil atribut size, qty dari user.cart, kemudian di simpan ke data produk
    products = products.map(x => {
        let p = user.cart.find(c => c.id == x._id)
        x = {...x.toObject(), ...p}
        return {...x, ...p}
    })

    res.render('pages/checkout', {products:products, user:req.cookies['UserId'], userData : user});
})

//router untuk proses data sehabis checkout 
router.post('/checkout/create',requireAuth,  async (req, res) => {
    req.body.products = JSON.parse(req.body.products)
    //menyimpan data ke db
    await TransactionModel.create(req.body)
    //kosongkan cart pada user
    await UserModel.findOneAndUpdate({_id : req.user._id}, {cart : []})
    res.redirect("/checkout");
})

router.get('/contact-us', (req, res) => {
    res.render('pages/contact-us');
})

router.get('/cart',requireAuth, async (req, res) => {
    const user = await UserModel.findOne({_id : req.user._id})
    //mengambil data produk yang ada pada cart user
    let products = await ProductModel.find({
        '_id' : {
            $in: user.cart.map(x => x.id)
        }
    })

    //mengghubungkan attribut
    products = products.map(x => {
        let p = user.cart.find(c => c.id == x._id)
        x = {...x.toObject(), ...p}
        return {...x, ...p}
    })
    
    res.render('pages/cart',{products : products})
})

//router untuk menambahkan produk ke dalam cart sesuai data yang dikirim via form
router.post('/cart/add',requireAuth, async (req, res) => {
    const {id, size, qty} = req.body;
    //tambahkan data yang diterima ke dalam cart user
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

//router untuk menambahkan produk ke dalam cart via link
router.get('/cart/add/:id',requireAuth, async (req, res) => {
    const id = req.params.id;
    
    //tambahkan cart ke dalam cart user
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

//meghapus data dari dalam cart
router.get('/cart/remove/:id',requireAuth, async (req, res) => {
    const id = req.params.id;
    
    //menghapus data dari dalam cart dengan id sesuai dengan yang dikirim via link
    await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { $pull: {cart: {  id: id   } } }
    );

    res.redirect('/cart')
})

//menambahkn produk ke dalam wishlist kita
router.get('/wishlist/:id', requireAuth,async (req, res) => {
    const id = req.params.id;
    
    //tambah produk yang memiliki id yang dikirim via link
    const nea = await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { "$push": { "wishlist": id } }
    );

    res.redirect('/wishlist')
}) 

//router proses hapus produk dari wishlit 
router.get('/wishlist/:id/remove', requireAuth,async (req, res) => {
    const id = req.params.id;
    
    //hapus produk dari dalam wishlist user yang memiliki id sesuai dengan yang dikirim viw link
    await UserModel.findOneAndUpdate(
        { _id: req.user._id }, 
        { $pullAll: {wishlist: [id] } }
    );

    res.redirect('/wishlist')
})

router.get('/wishlist', requireAuth,async (req, res) => {
    //mengambil data user dan semua produk yang ada di atribut wishlist dari user tersebut 
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
    //jika tidak ada data yang dikirim lewat get, tampilakan semua produk
    if(!req.query)
    products = await ProductModel.find();
    //jika ada, filter produk berdasarkan namanya 
    else
    products = await ProductModel.find({ "name" : { $regex: new RegExp(req.query.name), $options: 'i' } });
    res.render('pages/shop', {products : products})
})


//menampilkan detail produk
router.get('/shop-detail/:id', async (req, res) => {
    const id = req.params.id;
    //mengambil produk dari db sesuai id pada link
    const product = await ProductModel.findOne({_id:id})
    //jika data ada tampilkan halaman detail
    if(product)
        res.render('pages/shop-detail', {product : product});
    else
        res.send("gaada");
})

//router menampilkan form edit data 
router.get('/profile/edit',requireAuth, (req, res) => {
    res.render('pages/Profile - Copy', {user:req.user})
})
//router proses update data usernya
router.post('/profile/update',requireAuth, async (req, res) => {
    //update data user dengan data baru yang dikirim
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