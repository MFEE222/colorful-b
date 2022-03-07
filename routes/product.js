const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');

// 請求推薦商品
router.get('/recommend', productController.getRecommend);

// 請求系列標籤
router.get('/list', productController.getList);

// 請求評論資料
router.get('/review/:pid', productController.getReviewDetail);

// 請求商品資料
router.get('/', productController.getData);

module.exports = router;
