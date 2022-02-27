const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

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

// 接收下載請求（會員）
router.post('/', compress, function (req, res) {
    console.log('req.body :>> ', req.body);
    const p = path.join(__dirname, '../download', zipPahth(req.body.pid));
    console.log('p :>> ', p);

    // 存在檔案直接返回
    if (fs.existsSync(p)) {
        const fname = 'user-dng.zip';
        res.setHeader('Content-Disposition', `filename=${fname}`);
        fs.createReadStream(p).pipe(res);
    }

    const zipStream = new compressing.zip.Stream();

    req.body.pid.forEach(function (e) {
        zipStream.addEntry(path.join('../dng', e));
    });

    zipStream.pipe(fs.createWriteStream(p)).on('finish', function () {
        res.setHeader('Content-Disposition', `filename=${fname}`);
        fs.createReadStream(p).pipe(res);
    });
});

// 接收下載請求（非會員）

module.exports = router;

// 內部函數
function zipPath(products, ext = 'zip') {
    products.sort((a, b) => a - b);
    const cat = products.join('-') + '.' + ext;
    return cat;
}

// 接收請求 (會員)
//  request
//      pid: []
//      user: {id, name, }
//      session: user

// 接收請求（非會員）
//  request
//      link: ""

// 驗證使用者身份

// 生成壓縮檔名稱

// 尋找 download 是否已存在壓縮檔，已存在則返回

// 壓縮檔不存在則到 dng 資料夾將對應商品加入壓縮流

// 將檔案壓縮後存放到 download 資料夾

// 返回檔案下載流
