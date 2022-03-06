const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const bcrypt = require('bcrypt');

// get, post, delete, put
const routes = {
    login: '/login',
    register: '/signup',
    logout: '/logout',
    forgot: '/forgot',
    reset: '/reset',
    auth: '/',
};

const { body, validationResult } = require('express-validator');
const registerRules = [
    // 檢查 email 是否符合格式
    body('email').isEmail().withMessage('Email 欄位請填寫正確格式'),
    body('password')
        .isLength({
            min: 8,
        })
        .withMessage('密碼長度至少為 8'),
    body('confirmPassword')
        .custom((value, { req }) => {
            return value === req.body.password;
        })
        .withMessage('密碼驗證不一致'),
];

// 註冊
router.post(routes.register, registerRules, async (req, res, next) => {
    // 驗證前端傳送過來的資料有效性（express-validator）
    //驗證結果
    const validateResult = validationResult(req);
    // console.log(validateResult);
    if (!validateResult.isEmpty()) {
        // validateResult 不是空的
        let error = validateResult.array();
        // console.log("validateResult", error);
        return res.status(400).json({
            code: '4001',
            msg: '帳號或密碼錯誤',
        });
    }

    // 寫入資料庫（檢查帳號是否已存在、雜湊密碼）
    // 檢查email 是否已註冊
    let [users] = await connection.execute(
        'SELECT * FROM users WHERE email=?',
        [req.body.email]
    );

    // console.log('users :>> ', users);
    if (users.length > 0) {
        return res.status(400).send({
            code: '4001',
            msg: '帳號或密碼錯誤',
        });
    }
    // 雜湊 password
    // console.log('req.body.password', req.body.password)
    let hashPassword = await bcrypt.hash(req.body.password, 10);
    let hashPasswordHint = await bcrypt.hash(req.body.passwordHint, 10);

    //存資料庫
    let [result] = await connection.execute(
        'INSERT INTO users (email, password, password_hint, name) VALUES (?, ?, ?, ?)',
        [req.body.email, hashPassword, hashPasswordHint, req.body.name]
    );
    console.log('result :>> ', result);

    res.json({
        code: '4004',
        msg: '註冊成功',
    });
});

// 登入
router.post(routes.login, async (req, res, next) => {
    // console.log('req.body :>> ', req.body);
    const email = req.body.account;
    const password = req.body.password;

    let [users] = await connection.execute(
        'SELECT * FROM users WHERE email=?',
        [email]
    );
    // console.log('users :>> ', users);

    if (users.length === 0) {
        res.status(400).send({
            code: '33003',
            msg: '尚未註冊',
        });
        return;
    }

    //把會員資料拿出來
    let user = users[0];
    const result = await bcrypt.compare(password, user.password);
    // console.log('result :>> ', result);
    if (!result) {
        res.status(400).send({
            code: '4001',
            msg: '帳號或密碼錯誤',
        });
        return;
    }

    //整理資料
    const returnMember = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        birthday: user.birthday,
    };

    // 成功登入
    req.session.user = returnMember;
    req.session.isLogin = true;
    // console.log('req.session :>> ', req.session);
    if (req.session.isLogin) {
        res.json({
            user: returnMember,
            code: '4002',
            msg: '登入成功',
        });
        return;
    }
});

router.get(routes.logout, (req, res, next) => {
    // 刪除登入狀態 Session
    req.session.user = {};
    req.session.isLogin = false;
    res.sendStatus(202);
});

// 忘記密碼
router.post(routes.forgot, async (req, res, next) => {
    // 驗證前端傳送過來的資料
    req.session.allowResetPassword = false;

    const email = req.body.email;
    const passwordHint = req.body.passwordHint;

    let [users] = await connection.execute(
        'SELECT * FROM users WHERE email=?',
        [email]
    );
    // 檢查有無註冊
    if (users.length === 0) {
        res.status(400).send({
            code: '4009',
            msg: '無效帳號或密碼提示關鍵字',
        });
        return;
    }

    //把會員資料拿出來
    let user = users[0];
    // console.log('users :>> ', users);

    // 檢查密碼提示是否正確
    // 解雜湊
    const result = await bcrypt.compare(passwordHint, user.password_hint);
    if (!result) {
        res.status(400).send({
            code: '4009',
            msg: '無效帳號或密碼提示關鍵字',
        });
        return;
    }

    //導向重設密碼頁
    req.session.allowResetPassword = true;
    req.session.allowResetEmail = email;
    // console.log(
    //     'req.session.allowResetEmail :>> ',
    //     req.session.allowResetEmail
    // );
    res.json({
        allowResetPassword: true,
    });
});

// 重設密碼
router.post(routes.reset, async (req, res, next) => {
    const allowed = req.session.allowResetPassword;
    console.log('allowed :>> ', allowed);
    const email = req.session.allowResetEmail;
    console.log('email :>> ', email);
    if (!allowed) {
        // 不允許重設密碼
        res.status(400).send({
            code: '4009',
            msg: '無效帳號',
        });
    }

    //允許重設密碼
    const validateResult = validationResult(req);
    // console.log(validateResult);
    if (!validateResult.isEmpty()) {
        // validateResult 不是空的
        let error = validateResult.array();
        // console.log("validateResult", error);
        return res.status(400).json({
            code: '4001',
            msg: '帳號或密碼錯誤',
        });
    }

    // 是否有此email 在資料庫

    let [users] = await connection.execute(
        'SELECT * FROM users WHERE email=?',
        [email]
    );

    // 雜湊 password
    // console.log('req.body.password', req.body.password)
    let hashPassword = await bcrypt.hash(req.body.password, 10);
    let hashPasswordHint = await bcrypt.hash(req.body.passwordHint, 10);

    //存資料庫
    let [result] = await connection.execute(
        'INSERT INTO users (password, password_hint) VALUES (?, ?)',
        [hashPassword, hashPasswordHint]
    );
    // console.log('result :>> ', result);
    // 回應
    res.json({
        code: '4008',
        msg: '修改密碼成功',
    });

    // ======================================================
    // 前端 ok
    // 1. 忘記密碼
    // 2. 傳 email 和 passworHint 給後端

    // ======================================================
    // 後端 ok
    // 1. 尋找資料庫是否有該用戶
    // 2. 雜湊比對該用戶的密碼提示是否正確
    // 3. 回傳允許重設密碼

    // ======================================================
    // 前端
    // 1.記在狀態中，若狀態有這個email，就導向重設密碼頁，把狀態調回false
    //              若狀態沒有此email，就傳錯誤訊息，留在忘記密碼頁
    // 2. 傳送 email 和 新密碼給後端
    // ======================================================
    // 後端
    // 1. 用 email 尋找資料庫是否有該用戶
    // 2. 驗證密碼是否符合格式
    // 3. 將密碼雜湊存進資料庫
    // 3. 回應客戶端成功修改密碼
    // ======================================================
    // 前端
    // 1. 成功修改密碼就導向登入頁 並將允許重設密碼狀態改為 false
    // 2. 密碼格式不符合就顯示提示 限制修改次數???
});

// 驗證登入狀態
router.post(routes.auth, function (req, res, next) {
    // TODO: 驗證登入狀態
});

module.exports = router;

// TODO: 登入限制 N 時間內嘗試 N 次
