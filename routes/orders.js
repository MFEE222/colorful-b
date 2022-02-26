const express = require('express');
const router = express.Router();

const connection = require('../utils/db');

// Orders
router.post('/', async function (req, res, next) {
    console.log('here');
    console.log('req.query :>> ', req.query);
    // {
    //     user_id: '',
    //     order_id: [],
    //     order_status: 1 ~ 6 | 1:待付款 2: 取消 3: 已付款 4: 退款中 5: 已退款 6: 已關閉
    //     date: [from, to],
    // }

    let sql = `SELECT * FROM orders`;
    const values = [];
    const user_id = 4;

    if (user_id) {
        sql = where(sql, 'user_id = ?');
        values.push(user_id);
    }

    // if (order_status) {
    //     sql += ' WHERE order_status_id = ?';
    //     sql = where(sql, 'order_status_id = ?');
    //     values.push(order_status);
    // }

    // if (date) {

    // }

    // if (limit) {
    //     sql += ' LIMIT ?';
    //     values.push();
    // }

    console.log('sql :>> ', sql);

    try {
        // connection.execute(`SELECT * FROM orders WHERE id = ? OR id = ? OR id = ? `, [2, 3, 5])
        let [data, datafileds] = await connection.execute(sql, values);
        console.log('data :>> ', data);
        // console.log('datafileds :>> ', datafileds);
        res.json(data);
    } catch (err) {
        console.log('err :>> ', err);
    }

    // res.json({
    //     say: 'hey',
    //     query: req.query,
    // });
});

// Order Detail
// TODO: 記得改成 post
router.get('/:id', async function (req, res, next) {
    console.log('req.params :>> ', req.params);

    let sql = `SELECT * FROM orders`;

    const values = [];
    const number = req.params.id;

    console.log(req.params.id);

    if (number) {
        sql = where(sql, 'number = ?');
        values.push(number);
    }

    try {
        // connection.execute(`SELECT * FROM orders WHERE id = ? OR id = ? OR id = ? `, [2, 3, 5])
        let [data, datafileds] = await connection.execute(sql, values);
        console.log('data :>> ', data);
        // console.log('datafileds :>> ', datafileds);
        res.json(data);
    } catch (err) {
        console.log('err :>> ', err);
    }
    // res.json(req.params);
});

function where(sql, condition, operator = 'AND') {
    return sql.includes('WHERE')
        ? sql.concat(` ${operator} `, '(', condition, ')')
        : sql.concat(' WHERE ', '(', condition, ')');
}

module.exports = router;
