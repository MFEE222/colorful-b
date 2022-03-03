const path = require('path');
const fs = require('fs');
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const cors = require('cors');
const { url } = require('inspector');
// const fs = require('fs/promises');
const multer = require('multer');

const app = express();

// 使用第三方開發的 cors 中間件 //避免阻擋
app.use(
    cors({
        // 為了要讓 browser 在 CORS 的情況下還是幫我們送 cookie
        origin: ['http://localhost:3000'],
        credentials: true,
    })
);

app.set('views', path.join(__dirname, '../../views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../../public')));

app.get('/', function (req, res, next) {
    console.log('here');
    res.sendFile(path.join(__dirname, './multer.html'));
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, `${req.query.uid}-${req.query.pid}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
        // console.log('req.startUpload++ :>> ', req.startUpload++);
    },
    filename: function (req, file, cb) {
        req.body;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.originalname.split('.').pop();
        // cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
        cb(null, String(req.startUpload++).concat('.', ext));
        // console.log('req.startUpload++ :>> ', req.startUpload++);
    },
});

const upload = multer({ storage: storage });

// app.use('/multer', function (req, res, next) {
//     console.log('here');
//     next();
// });
// 單檔案
// app.post('/multer', upload.single('meow'), function (req, res, next) {
//     res.json({ m: '123' });
// });
// 多檔案
app.post(
    '/multer',
    function (req, res, next) {
        req.startUpload = 1;
        next();
    },
    upload.array('meow', 8),
    function (req, res, next) {
        res.json({ m: '123' });
    }
);

// const storage = multer.diskStorage({
//     // 設定儲存的目的地(檔案夾)
//     destination: function (req, file, cb) {
//         console.log('file :>> ', file);
//         console.log('req :>> ', req);
//         switch (req.params) {
//             case 'profile':
//                 cb(
//                     null,
//                     path.join(
//                         __dirname,
//                         '..',
//                         '..',
//                         'public',
//                         'uploads',
//                         'profile'
//                     )
//                 );
//                 break;
//             case 'reviews':
//                 cb(
//                     null,
//                     path.join(
//                         __dirname,
//                         '..',
//                         '..',
//                         'public',
//                         'uploads',
//                         'reviews'
//                     )
//                 );
//                 break;
//         }
//     },
//     filename: function (req, file, cb) {
//         console.log('file :>> ', file);
//         console.log('req :>> ', req);
//         const ext = file.originalname.split('.').pop();

//         switch (req.params) {
//             case 'profile':
//                 cb(null, 'user-avator-' + req.user.id + ext);
//                 break;
//             case 'reviews':
//                 cb(
//                     null,
//                     'reviews-img-' +
//                         req.user.id +
//                         req.product.id +
//                         req.count-- +
//                         ext
//                 );
//                 break;
//         }
//     },
// });

// const upload = multer({ storage });

// // 接收單一照片
// app.post(
//     '/uploads/profile',
//     upload.single('profile'),
//     function (req, res, next) {}
// );

// // 接收多張照片
// app.post(
//     '/uploads/review',
//     upload.array('review', 8),
//     function (req, res, next) {}
// );

// // 混合
// app.post(
//     '/uploads/:to',
//     upload.fields([
//         { name: 'review', maxCount: 8 },
//         { name: 'profile', maxCount: 1 },
//     ]),
//     function (req, res, next) {}
// );

// // 想一下 request, response, 檔案名規則, 測試

// app.post('/uploads/:type', function (req, res, next) {
//     // console.log('req.params :>> ', req.params);
//     // console.log('req.file :>> ', req.file);
//     // console.log('req :>> ', req);
//     console.log('req.body :>> ', req.body);

//     // console.log('typeof req.body :>> ', typeof req.body);

//     // console.log('req.body.uploadAvator :>> ', req.body.uploadAvator);
//     console.log("req.body['upload-avator'] :>> ", req.body['upload-avator']);

//     res.render('index', {
//         title: 'This is upload image',
//         imgUrl: req.body['upload-avator'],
//     });
// });

const port = process.env.SERVER_PORT;
app.listen(port, function () {
    console.log(`Server running at port: ${port}`);
});
