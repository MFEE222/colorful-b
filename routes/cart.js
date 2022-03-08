const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
// third-part
const moment = require('moment');

// FIXME: 測試用中間件（用來設定 req.session.user.id）
router.use('/', function (req, res, next) {
    req.session.user = {
        id: 3,
    };
    next();
});

// API_GET_CART
router.get('/', async function (req, res, next) {
    const userId = req.query.userId;
    const sessionId = req.session.user.id ? req.session.user.id : -1; // FIXME: 和 auth 中間件討論登入狀態如何儲存
    // console.log('userId :>> ', userId);
    // console.log('sessionId :>> ', sessionId);
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
        const { orderby, order, limit, offset } = req.query ? req.query : {};
        // console.log('req.query :>> ', req.query);
        // console.log('orderby :>> ', orderby);
        // console.log('order :>> ', order);
        // console.log('limit :>> ', limit);
        // console.log('offset :>> ', offset);
        const values = [];

        let sql = `SELECT products.* FROM cart JOIN products ON cart.product_id = products.id WHERE user_id = ?`;
        values.push(userId);
        if (orderby) {
            sql = sql.concat(' ORDER BY ?');
            values.push(orderby);
        }
        if (order) {
            // FIXME: 待修復
            // sql = order == 1 ? sql.concat(' ORDER DESC') : sql;
        }
        if (limit) {
            sql = sql.concat(' LIMIT ?');
            values.push(limit);
        }
        if (offset) {
            sql = sql.concat(' OFFSET ?');
            values.push(offset);
        }
        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        const [data] = await connection.execute(sql, values);
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
        // console.log('total :>> ', data[0].TOTAL); // FIXME: 不確定返回結果，待測試
        payload.total = data[0].TOTAL;
    } catch (err) {
        console.log('err :>> ', err);
        payload.statusCode = 1;
    }
    // 返回
    // console.log('payload :>> ', payload);
    res.json(payload);
});

// API_POST_CART
router.post('/', async function (req, res, next) {
    // console.log('req.body :>> ', req.body);

    const userId = req.body.userId;
    const diff = JSON.parse(req.body.diff);
    // const diff = Array.isArray(req.body.diff)
    //     ? JSON.parse(req.body.diff)
    //     : req.body.diff;
    console.log('diff :>> ', diff);
    const sessionId = req.session.user.id ? req.session.user.id : -1; // FIXME: 和 auth 中間件討論登入狀態如何儲存
    // console.log('userId :>> ', userId);
    // console.log('diff :>> ', diff);
    // console.log('Array.isArray(diff) :>> ', Array.isArray(diff));
    if (userId != sessionId) {
        res.json({
            statusCode: 1,
            result: false,
        });
        return;
    }
    // 容器
    const payload = { statusCode: 2, result: true };
    // 資料庫新增資料
    try {
        let sql = 'INSERT INTO cart (created_at, product_id, user_id, valid)';
        let values = [];

        const add = diff.filter((e) => e > 0);
        // console.log('add :>> ', add);
        if (add.length > 0) {
            add.forEach(function (e, i) {
                sql += i === 0 ? ' VALUES (?, ?, ?, ?)' : ', (?, ?, ?, ?)';
                const date = moment().format('YYYY-MM-DD');
                const pid = e;
                const uid = userId;
                const valid = 1;
                values = values.concat([date, pid, uid, valid]);
            });
            // FIXME: 待測試 資料庫語法組合結果
            // console.log('sql :>> ', sql);
            // console.log('values :>> ', values);
            await connection.execute(sql, values);
        }
    } catch (err) {
        console.log('err :>> ', err);
        payload.statusCode = 1;
        payload.result = false;
    }
    // 資料庫刪除資料
    try {
        let sql = 'DELETE FROM cart WHERE product_id IN';
        let values = [];

        const remove = diff.filter((e) => e < 0);
        // console.log('remove :>> ', remove);
        if (remove.length > 0) {
            sql += ' (' + new Array(remove.length).fill('?').join(',') + ')';
            // console.log('sql :>> ', sql);
            values = values.concat(
                remove.map((e) => {
                    return -1 * e;
                })
            );
            // console.log('values :>> ', values);
            // FIXME: 待測試 資料庫語法組合結果
            // console.log('sql :>> ', sql);
            // console.log('values :>> ', values);
            await connection.execute(sql, values);
        }
    } catch (err) {
        console.log('err :>> ', err);
        payload.statusCode = 1;
        payload.result = false;
    }

    res.json(payload);
});

module.exports = router;
