const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');

// RESTful API 的列表
// product/
// router.get('/', productController.getData);
router.get('/recommend', productController.getRecommend);
router.get('/list', productController.getList);
router.get('/review/:pid', productController.getReviewDetail);
// router.get('/review/:pid/imgs', productController.getReviewImgs);
router.get('/', productController.getData);

// router.get('/:id', ....)

module.exports = router;
