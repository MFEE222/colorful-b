const express = require('express');
const router = express.Router();

// get, post, delete, put
const routes = {
    login: '/login',
    register: '/register',
    logout: '/logout',
    forgot: '/forgot',
    reset: '/reset',
    auth: '/',
};

router.post(routes.login, function (req, res, next) {
    // TODO: 限制 N 時間內嘗試 N 次
    // TODO: 將登入狀態存儲在 Session 中
    // 已登入
    if (req.session.isLogin) {
        res.json({ login: true });
    }
    // 尚未登入
});

router.post(routes.register, function (req, res, next) {
    // TODO: 驗證前端傳送過來的資料有效性（express-validator）
    console.log(req.body);
    res.json({ message: "ok"});
    // TODO: 寫入資料庫（檢查帳號是否已存在、雜湊密碼）
});

router.post(routes.logout, function (req, res, next) {
    // TODO: 刪除登入狀態 Session
});

router.post(routes.forgot, function (req, res, next) {
    // TODO: 驗證前端傳送過來的資料
});

router.post(routes.reset, function (req, res, next) {
    // TODO: 驗證前端傳送過來的資料有效性
    // TODO: 雜湊，寫入資料庫
});

router.post(routes.auth, function (req, res, next) {
    // TODO: 驗證登入狀態
});

module.exports = router;
