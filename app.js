// 內建庫 bulit-in
const path = require('path');
// 第三方庫 third-party
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const cors = require('cors');

// 中間件 middlewares
const expressSession = require('./middlewares/session');
const res = require('express/lib/response');
const productRouter = require('./routes/product');
const authRouter = require('./routes/auth');
const homeRouter = require('./routes/home');
const memberRouter = require('./routes/member');
const cartRouter = require('./routes/cart');
const wishlistRouter = require('./routes/wishlist');

// 建立 app 實例
const app = express();
// 使用第三方開發的 cors 中間件 //避免阻擋
app.use(
    cors({
        // 為了要讓 browser 在 CORS 的情況下還是幫我們送 cookie
        origin: ['http://localhost:3000'],
        // origin: '*',
        credentials: true,
    })
);

// 樣版引擎設定 view engin setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// 一般中間件
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession);

// 路由中間件
// app.use('/api', function (req, res, next) {
//     res.json({
//         name: 'liz',
//         favoriate: 'cake',
//     });
// });

app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/home', homeRouter);
app.use('/api/member', memberRouter);
app.use('/api/products', productRouter);
app.use('/api/wishlist', wishlistRouter);

// app.use('/api/product',(req,res,next)=>{
//     console.info('hi')
//     res.json({
//         name: 'i am product'
//     });

// });

// 錯誤中間件
app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
