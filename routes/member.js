const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member');

router.get('/review', memberController.getReview);

module.exports = router;
