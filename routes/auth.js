const express = require('express');
const { route } = require('../app');
const router = express.Router();

// get, post, delete, put
const route = {
    login: '/login',
    register: '/register',
    logout: '/logout',
    forgot: '/forgot',
    reset: '/reset',
    auth: '/',
};

route.post(route.login, function (req, res, next) {
    // TODO: 限制 N 時間內嘗試 N 次
    // TODO: 將登入狀態存儲在 Session 中
});

router.post(route.register, function (req, res, next) {
    // TODO: 驗證前端傳送過來的資料有效性（express-validator）
    console.log(req.body);
    res.json({ message: "ok"});
    // TODO: 寫入資料庫（檢查帳號是否已存在、雜湊密碼）
});

route.post(route.logout, function (req, res, next) {
    // TODO: 刪除登入狀態 Session
});

route.post(route.forgot, function (req, res, next) {
    // TODO: 驗證前端傳送過來的資料
});

route.post(route.reset, function (req, res, next) {
    // TODO: 驗證前端傳送過來的資料有效性
    // TODO: 雜湊，寫入資料庫
});

route.auth(route.auth, function (req, res, next) {
    // TODO: 驗證登入狀態
});

module.exports = router;