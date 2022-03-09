const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
// third-part
const path = require('path');
const fs = require('fs');
const compressing = require('compressing');

// FIXME: 測試用中間件（用來設定 req.session.user.id）
router.use('/', function (req, res, next) {
    req.session.user = {
        id: 251,
    };
    next();
});

router.get('/test', function (req, res, next) {
    res.sendFile(path.join(__dirname, 'tmp.html'));
});

// API_POST_MEMBER_DOWNLOAD_DNG
router.post('/', function (req, res, next) {
    // const { userId, dngId } = req.body;
    // console.log('req.body :>> ', req.body);
    const userId = req.body.userId;
    const dngId = !Array.isArray(req.body.dngId)
        ? JSON.parse(req.body.dngId)
        : req.body.dngId;
    const sessionId = req.session.user.id || -1;
    // console.log('userId :>> ', userId);
    // console.log('dngId :>> ', dngId);

    // 驗證前端傳來資料
    if (userId != sessionId) {
        res.json({
            statusCode: 1,
            result: false,
        });
        return;
    }

    // 容器
    // const payload = { statusCode: 2, result: true};

    // 生成壓縮檔名，去目標資料夾 /download 尋找 (尋找到寫入資料庫後，直接返回)
    const zipFile = {
        base: zipPath(dngId),
        where: path.join(__dirname, '../download', zipPath(dngId)),
    };
    // console.log('zipFile :>> ', zipFile);

    if (fs.existsSync(zipFile.where)) {
        console.log('zip file download direct');
        recordDownloadHistory(userId, dngId);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${zipFile.base}"`
        );
        res.statusMessage = zipFile.base;
        // res.status(200);
        fs.createReadStream(zipFile.where).pipe(res);
        // res.download(zipFile.where);
        return;
    }

    // 去目標資料夾 /dng 將符合商品加入打包壓縮流
    const zipStream = new compressing.zip.Stream();
    // console.log('Array.isArray(dngId) :>> ', Array.isArray(dngId));
    dngId.forEach((e) => {
        console.log('here ================================');
        const dng = path.join(__dirname, '../dng', `${e}`);
        console.log('dng :>> ', dng);
        zipStream.addEntry(dng);
    });

    // 將壓縮流中的資料，接上 /download 寫入流，存儲壓縮檔到 download 資料夾
    zipStream
        .pipe(fs.createWriteStream(zipFile.where))
        .on('finish', function () {
            // 將 /download 資料夾中的目標壓縮檔，寫入資料庫後，以寫入流的方式返回前端
            recordDownloadHistory(userId, dngId);
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${zipFile.base}"`
            );
            res.statusMessage = zipFile.base;

            // res.status(200);
            fs.createReadStream(zipFile.where).pipe(res);
            // res.download(zipFile.where);
            return;
        });

    // console.log('end');
});

// 生成壓縮檔名
function zipPath(dngId, ext = 'zip') {
    dngId.sort((a, b) => a - b);
    return `${dngId.join('-')}.${ext}`;
}

// 將下載紀錄寫進資料庫
async function recordDownloadHistory(userId, dngId) {
    try {
        let sql =
            'UPDATE download SET status = 2 WHERE user_id = ? AND product_id IN';
        let values = [userId];

        if (dngId.length > 0) {
            sql += ' (' + new Array(dngId.length).fill('?').join(',') + ')';
            values = values.concat(dngId);

            await connection.execute(sql, values);
        }

        return true;
    } catch (err) {
        console.log('err :>> ', err);
        return false;
    }
}

module.exports = router;
