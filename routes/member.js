const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member');

router.get('/download', memberController.getDownload);

module.exports = router;
