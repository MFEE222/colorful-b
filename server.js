const express = require('express');
require('dotenv').config();

// new 一個 app 出來
const app = express();

// regular middleware 一般中間件 callback(req, res, next)

// router middleware 路由中間件 callback(req, res, next)

// error middleware 錯誤中間件 callback(err, req, res, next)

// 啟動伺服器
const port = process.env.SERVER_PORT || 3000;
app.listen(port, function () {
    console.log('Server running at port', port);
});
