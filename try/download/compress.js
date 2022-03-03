// 內建庫 bulit-in
const path = require('path');
const fs = require('fs');
const { access } = require('fs/promises');

// 第三方庫 third-party
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const cors = require('cors');

// 壓縮
const compressing = require('compressing');
const { Router } = require('express');

// 建立 app 實例
const app = express();
// 使用第三方開發的 cors 中間件 //避免阻擋
app.use(
    cors({
        // 為了要讓 browser 在 CORS 的情況下還是幫我們送 cookie
        origin: ['http://localhost:3000'],
        credentials: true,
    })
);

// 樣版引擎設定 view engin setup
app.set('views', path.join(__dirname, '../..', 'views'));
app.set('view engine', 'pug');

// 一般中間件
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../..', 'public')));

// app.use('/download', async function (req, ues, next) {
//     console.log('here');
//     try {
//         const src1 = path.join(__dirname, '../..', 'download', '1-3-5');
//         // const src2 = path.join(__dirname, '../..', 'download', '2-4-6');
//         // const src = path.join(__dirname, '../..', 'download', '1');
//         const dest = path.join(__dirname, '../..', 'download', 'DLC.zip');

//         await compressing.zip.compressDir(src1, dest);

//         req.dest = dest;
//     } catch (err) {
//         console.log('err :>> ', err);
//     }
//     next();
// });

app.get('/download', async function (req, res, next) {
    console.log('here');
    try {
        const src1 = path.join(__dirname, '../..', 'download', '1-3-5');
        const src2 = path.join(__dirname, '../..', 'download', '2-4-6');
        // const src = path.join(__dirname, '../..', 'download', '1');
        const dest = path.join(__dirname, '../..', 'download', 'DLC.zip');

        // await compressing.zip.compressDir(src1, dest);

        // req.dest = dest;

        const zipStream = new compressing.zip.Stream();

        zipStream.addEntry(src1);
        zipStream.addEntry(src2);
        // zipStream.pip(res);

        zipStream.pipe(fs.createWriteStream(dest)).on('finish', function () {
            console.log('"finish" :>> ', 'finish');
            next();
        });
        // zipStream
        // .on('error', (err) => console.log(err))
        // .pipe(fs.createWriteStream(dest));
        // .pipe()
        // .on('error', (err) => console.log(err));
        // pump(zipStream, destStream, handleError);
    } catch (err) {
        console.log('err :>> ', err);
    }

    // next();
});

app.get('/download', function (req, res, next) {
    const dest = path.join(__dirname, '../..', 'download', 'DLC.zip');
    if (fs.existsSync(dest)) {
        // res.download(path.join(__dirname, '../../download/DLC.zip'));
        // Content-Disposition
        // Content-Disposition: attachment; filename="filename.jpg"
        res.setHeader('Content-Disposition', 'filename="DLC2.zip"');
        fs.createReadStream(dest).pipe(res);
    }
    // res.json({ say: 'hi' });
});

app.get('/', function (req, res, next) {
    res.render('index', {
        title: 'This is Download Page',
    });
});

const port = process.env.SERVER_PORT;
app.listen(port, function () {
    console.log(`Server listen at port ${port}`);
});

// 前端發送請求
// 我要特定幾筆資料下載
// req + session_id
// {
//     product_id: [1, 2, 3, 4, 5],
//     user_id: 3
// }

// 生成壓縮檔案名稱
function zipPath(products, ext = 'zip') {
    // console.log('products :>> ', products);
    products.sort((a, b) => a - b);
    const cat = products.join('-') + '.' + ext;
    return cat;
}
const zip = zipPath([1, 5, 3]);
// 檢查 download 資料夾中是否已存在壓縮，存在的話直接 response
if (fs.existsSync(zip)) {
    res.download(zip);
    return;
}

// 抓取特定檔案，建立特定資料夾，將抓取的特定檔案都放到裡面

// res.download

// const fs = require('fs');

// const path = './file.txt';

// fs.access(path, fs.F_OK, (err) => {
//     if (err) {
//         console.error(err);
//         return;
//     }

//     //file exists
// });
