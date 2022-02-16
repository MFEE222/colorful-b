// 內建庫 bulit-in
const path = require('path');
// 第三方庫 third-party
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
// 中間件 middlewares
const expressSession = require('./middlewares/session');

// 建立 app 實例
const app = express();

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
app.use('/api/product', function (req, res, next) {
    res.json({
        name: 'liz',
        favoriate: 'cake',
    });
});

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
