const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const bcrypt = require("bcrypt");
const mysql = require('mysql2');


// get, post, delete, put
const routes = {
    login: '/login',
    register: '/signup',
    logout: '/logout',
    forgot: '/forgot',
    reset: '/reset',
    auth: '/',
};

const {
    body,
    validationResult
} = require("express-validator");
const registerRules = [
    // 檢查 email 是否符合格式
    body("email").isEmail().withMessage("Email 欄位請填寫正確格式"),
    body("password").isLength({
        min: 8
    }).withMessage("密碼長度至少為 8"),
    body("confirmPassword")
    .custom((value, {
        req
    }) => {
        return value === req.body.password;
    })
    .withMessage("密碼驗證不一致"),
];

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
            code: "33001",
            msg: error[0].msg,
        });
    }

    // 寫入資料庫（檢查帳號是否已存在、雜湊密碼）
    // 檢查email 是否已註冊
    let [users] = await connection.execute(
        "SELECT * FROM users WHERE email=?",
        [account]
    );
    console.log(users);
    if (users.length > 0) {
        return res.status(400).send({
            code: "33002",
            msg: "這個 email 已經註冊過了",
        });
    }
    // 雜湊 password
    let hashPassword = await bcrypt.hash(req.body.password, 10);

    //存資料庫
    let [result] = await connection.execute(
        "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
        [account, hashPassword, req.body.name]
    );
    console.log(result);

    res.json({
        message: "ok "
    });

});


router.post(routes.login, async (req, res, next) => {
    // TODO: 限制 N 時間內嘗試 N 次

    console.log('req.body :>> ', req.body);
    const account = req.body.account;
    const password = req.body.password;

    let [users] = await connection.execute(
        "SELECT * FROM users WHERE email=?",
        [account]
    );
    console.log(users);
    if (users.length === 0) {
        return res.statusMessage(400).send({
            code: "33003",
            msg: "尚未註冊",
        });
    }
    //把會員資料拿出來
    let user = users[0];
    console.log(user);


    let result = await bcrypt.compare(req.body.password, user.password);
    if (!result) {
        return res.status(400).send({
            code: "33004",
            msg: "帳號密碼錯誤",
        });
    }


    

    //整理資料
    let returnMember = {
        id: user.id,
        name: user.name,
    }
    // 將登入狀態存儲在 Session 中
    req.session.user = returnMember;


    // 已登入
    if (req.session.isLogin) {
        res.json({
            login: true
        });
    }
    res.json({
        code: "0",
        data: returnMember,
    });
    // 尚未登入
    // res.json({
    //     message: "ok "
    // });
});



router.get(routes.logout, (req, res, next) => {
    // 刪除登入狀態 Session
    req.session.user = null;
    res.sendStatus(202);
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