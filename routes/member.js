const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const memberController = require('../controllers/member');
const multer = require('multer');

const fsPromises = require('fs/promises');

// 設定檔案上傳路徑、命名規則
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('destination...');
        console.log('req.body :>> ', req.body);
        console.log('req.body.rid :>> ', req.body.rid);
        const dir = path.join(
            __dirname,
            '../public/uploads/reviews',
            `rid-${req.body.rid}`
        );
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },

    filename: function (req, file, cb) {
        console.log('filename...');
        const ext = file.originalname.split('.').pop();
        cb(null, String(req.countStart++).concat('.', ext));
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // cb(null, file.fieldname + uniqueSuffix + '.' + ext);
    },
});

// 生成檔案上傳中間件
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log('file.mimetype :>> ', file.mimetype);
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

function countStart(req, res, next) {
    console.log('req.body :>> ', req.body);
    console.log('req.body.rid :>> ', req.body.rid);
    console.log('req.body.message :>> ', req.body.message);
    req.countStart = 1;
    next();
}

router.post(
    '/review/update',
    countStart,
    upload.array('photo', 8),
    function (req, res, next) {
        res.json({ m: 'success' });
    }
);

// router.post('/review/update', memberController.getUpdate);
router.get('/review', memberController.getReview);
module.exports = router;
