const express = require('express');
const router = express.Router();
const path = require('path');

const compress = require('../middlewares/compress');

router.get('/', compress, function (req, res) {
    // res.json({
    //     message: req.message + ' welcome to Express World',
    // });
    // console.log(path.join(__dirname, '../try/3.json'));
    res.download(path.join(__dirname, '../try/1.zip'), function (err) {
        if (err) {
            console.log('download failed :>>', err);
        } else {
            console.log('download success');
        }
    });
});

module.exports = router;
