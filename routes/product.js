const express = require('express');
const router = express.Router();
const productController=require("../controllers/product")


// RESTful API 的列表
// product/ 
router.get('/',productController.getAll);

module.exports = router;