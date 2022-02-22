const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');

// RESTful API 的列表
// product/
// router.get('/', productController.getData);
router.get('/rank', productController.getRanking);
router.get('/detail/:pid', productController.getReviewDetail);

router.get('/',productController.getData);

module.exports = router;
