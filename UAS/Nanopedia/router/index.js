const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('pages/index');
})

router.get('/about', (req, res) => {
    res.render('pages/about');
})

router.get('/Profile', (req, res) => {
    res.render('pages/Profile');
})

router.get('/checkout', (req, res) => {
    res.render('pages/checkout');
})

router.get('/contact-us', (req, res) => {
    res.render('pages/contact-us');
})

router.get('/cart', (req, res) => {
    res.render('pages/cart')
})

router.get('/wishlist', (req, res) => {
    res.render('pages/wishlist')
})

router.get('/shop', (req, res) => {
    res.render('pages/shop')
})

router.get('/shop-detail', (req, res) => {
    res.render('pages/shop-detail')
})

router.get('/Profile - Copy', (req, res) => {
    res.render('pages/Profile - Copy')
})

router.get('/service', (req, res) => {
    res.render('pages/service')
})

router.get('/my-account', (req, res) => {
    res.render('pages/my-account')
})

module.exports = router;