const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member');

router.post('/review/update', memberController.getUpdate);
router.get('/review', memberController.getReview);

module.exports = router;
