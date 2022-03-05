const express = require('express');
const router = express.Router();
const connection = require('../utils/db');

// API_GET_CART
router.get('/', async function (req, res, next) {
    const userId = req.query.userId;
    const sessionId = req.session.user.id; // FIXME: 和 auth 中間件討論登入狀態如何儲存

    // 請求者，登入者不同人
    if (userId != sessionId) {
        res.json({
            statusCode: 1,
            cart: [],
        });
        return;
    }

    // 容器
    const payload = { statusCode: 2 };
    // 資料庫請求購物車
    try {
        const { orderby, order, limit, offset } = req.query.option;
        const values = [];

        const sql = 'SELECT product_id FROM cart WHERE user_id = ?';
        if (orderby) {
            sql = sql.concat(' ORDER BY ?');
            values.push(orderby);
        }
        if (order) {
            sql = sql.concat(' ORDER DESC');
        }
        if (limit) {
            sql = sql.concat(' LIMIT ?');
            values.push(limit);
        }
        if (offset) {
            sql = sql.concat(' OFFSET ?');
            values.push(offset);
        }

        const [data] = await connection.execute(sql, [userId]);
        console.log('data :>> ', data);
        payload.cart = data;
    } catch (err) {
        console.log('err :>> ', err);
        payload.statusCode = 1;
    }
    // 資料庫計算符合條件總數
    try {
        const sql = 'SELECT COUNT(id) AS TOTAL FROM cart WHERE user_id = ?';
        const [data] = await connection.execute(sql, [userId]);
        console.log('data :>> ', data); // FIXME: 不確定返回結果，待測試
        payload.total = data.total;
    } catch (err) {
        console.log('err :>> ', err);
        payload.statusCode = 1;
    }
    // 返回
    res.json(payload);
});

// API_POST_CART
router.post('/', function (req, res, next) {
    const userId = req.body.userId;
    const diff = req.body.diff;
    const sessionId = req.session.user.id; // FIXME: 由 auth 模組決定如何存儲

    if (userId != sessionId) {
        res.json({
            statusCode: 1,
            result: false,
        });
    }

    // 容器
    const payload = { statusCode: 2, result: true };
    // 資料庫更新
    try {
        const sql = "UPDATE cart "

        const add = diff.filter(e => e > 0);
        const remove = diff.filter(e => e < 0).map(e => -1 * e);

        // 新增
        await connection.execute('INSERT INTO cart (created_at, product_id, user_id, valid) VALUES (?, ?, ?, ?), VALUES (?, ?, ?, ?) ')
        // 刪除
        await connection.execute('DELETE cart WHERE product_id IN ()')

    }
    // 資料庫購物車新增
    // try {
    //     add.forEach(function () {

    //     })
    // } catch (err) {}
});

module.exports = router;
