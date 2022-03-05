const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const memberController = require('../controllers/member');
const multer = require('multer');
const fsPromises = require('fs/promises');
const { toUnicode } = require('punycode');

// 設定檔案上傳路徑、命名規則
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // console.log('req.query :>> ', req.query);
        const dir = path.join(
            __dirname,
            '../public/uploads/reviews',
            `r-${req.query.rid}`
        );
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },

    filename: function (req, file, cb) {
        !req.count ? (req.count = 1) : req.count++;
        const ext = file.originalname.split('.').pop();
        cb(null, String(req.count).concat('.', ext));
    },
});

// 生成檔案上傳中間件
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // console.log('file.mimetype :>> ', file.mimetype);
        if (
            file.mimetype !== 'image/jpeg' &&
            file.mimetype !== 'image/jpg' &&
            file.mimetype !== 'image/png'
        ) {
            cb(new Error('只允許 .jpeg, .jpg, .png'), false);
        } else {
            cb(null, true);
        }
    },
    limits: {
        // 200K
        fileSize: 1000 * 1024,
    },
});

router.post(
    '/review/update',
    upload.array('photos', 8),
    function (req, res, next) {
        res.json({ m: 'success' });
    }
);
router.post('/review/update/detail', memberController.getUpdateDetail);

// router.post('/review/update', memberController.getUpdate);
router.get('/review', memberController.getReview);
module.exports = router;

// ! 目前上傳數超過 multer 會清空目標資料夾，待優化
