const express = require('express');
const router = express.Router();

const wishlistController = require('../controllers/wishlist');

router.get('/', wishlistController.getData);

router.get('/test', wishlistController.getProducts);

module.exports = router;
