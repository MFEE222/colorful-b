const express = require('express');
const router = express.Router();
const Connection = require('../utils/db');

// get, post, delete, put
const routes = {
    login: '/login',
    register: '/register',
    logout: '/logout',
    forgot: '/forgot',
    reset: '/reset',
    auth: '/',
};

const { body, validationResult } = require("express-validator");
const registerRules = [
  // 檢查 email 是否符合格式
  body("email").isEmail().withMessage("Email 欄位請填寫正確格式"),
  body("password").isLength({ min: 8 }).withMessage("密碼長度至少為 8"),
  body("confirmPassword")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("密碼驗證不一致"),
];


router.post(routes.register, registerRules, async (req, res, next) => {
    // TODO: 驗證前端傳送過來的資料有效性（express-validator）
    //驗證結果
    const validateResult = validationResult(req);
    if (!validateResult.isEmpty()) {
      // validateResult 不是空的
      let error = validateResult.array();
      console.log("validateResult", error);
      return res.status(400).json({
        code: "33001",
        msg: error[0].msg,
      });
    }

    
    // TODO: 寫入資料庫（檢查帳號是否已存在、雜湊密碼）
    // 檢查email 是否已註冊
    let [ member ] = await Connection.execute(
        "SELECT * FROM member WHERE email=?",
        [req.body.email]
    );
    console.log(members);
    if(member.length > 0 ) {
        return res.status(400).send({
            code: "33002",
            msg: "這個 email 已經註冊過了",
        });
    }
    // 雜湊 password
    let hashPassword = await bcrypt.hash(req.body.password, 10);
    
    let [result] = await connection.excute(
        "INSERT INTO members (email, password, name) VALUES (?, ?, ?, ?)",
        []
    )

});


router.post(routes.login, function (req, res, next) {
    // TODO: 限制 N 時間內嘗試 N 次
    // TODO: 將登入狀態存儲在 Session 中
    // 已登入
    if (req.session.isLogin) {
        res.json({
            login: true
        });
    }
    // 尚未登入
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