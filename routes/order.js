const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
// third-part
const moment = require('moment');

// FIXME: 測試用中間件（用來設定 req.session.user.id）
// router.use('/', function (req, res, next) {
//     req.session.user = {
//         id: 3,
//     };
//     next();
// });

// API_GET_ORDERS
// 取得訂單資料
// Req
// {
//     sessionID, (header 會自動帶過去)
//     userID,
//     orderStatus,
//     date,
//     sortBy,
//     sortType,
//     limit,
//     offset
// }
// Res
// {
//     userID,
//     orderID / orderNumber,
//     sortBy,
//     sortType,
//     limit,
//     offset
// }
router.get('/', async function (req, res, next) {
    console.log('req.query :>> ', req.query);
    const { userID, orderStatus, date, sortBy, sortType, limit, offset } =
        req.query;
    // 驗證
    if (!authUser(userID)) {
        res.json({
            statusCode: 1,
            orders: [],
        });
    }

    // 酬載
    const payload = {
        statusCode: 2,
        orders: selectOrderByUser(userID, req.query),
    };

    // 返回
    res.json(payload);
});

// API_GET_ORDER_DETAIL
// Req
// {
//     sessionID, (header 會自動帶過去)
//     userID,
//     orderID / orderNumber,
//     sortBy,
//     sortType,
//     limit,
//     offset
// }
// Res
// {
//     statusCode,
//     orderDetail: []
// }

//     orderDetailID,
//     productName,
//     productPrice,
//     createdAt,
//     orderID,
//     productID
router.get('/detail', async function (req, res, next) {
    console.log('req.query :>> ', req.query);
    const { userID, orderID, orderNumber, sortBy, sortType, limit, offset } =
        req.query;
    // 驗證
    if (!authUser(userID)) {
        res.json({
            statusCode: 1,
            orderDetail: [],
        });
    }
    // 酬載
    const payload = {
        statusCode: 2,
        orderDetailID: selectOrderDetail(orderID),
    };
    // 返回
    res.json(payload);
});

// API_POST_ORDER
// 請求訂單成立
// Req
// {
//     sessionID,
//     userID,
//     productIDs,
// }
// Res
// {
//     statusCode,
//     allowPayment,
//     orderID,
//     orderNumber,
//     orderStatus, // 7: mount 待確認, 1: pending 待付款, 2: cancel 已取消, 3: paid 已付款, 4: refund 退款中, 5: refunded 已退款, 6: close 已關閉
// }
router.post('/', async function (req, res, next) {
    const userID = req.body.userID;
    const productIDs = !Array.isArray(req.body.productIDs)
        ? JSON.parse(req.body.productIDs)
        : req.body.productIDs;
    const sessionID = req.session.user.id ? req.session.user.id : -1;

    if (userID != sessionID) {
        res.json({
            statusCode: 1,
            allowPayment: false,
            orderID: '',
            orderNumber: '',
            orderStatus: -1,
        });
    }
    // Res
    // {
    //     statusCode,
    //     allowPayment,
    //     orderID,
    //     orderNumber,
    //     orderStatus, // 7: mount 待確認, 1: pending 待付款, 2: cancel 已取消, 3: paid 已付款, 4: refund 退款中, 5: refunded 已退款, 6: close 已關閉
    // }
    // 酬載
    const payload = { statusCode: 2, allowPayment: true };
    // 變數
    let products = [];
    let user = {};
    // 獲取 product 商品資料
    try {
        let sql = `SELECT * FROM products WHERE id IN`;
        let values = [];
        if (productIDs.length > 0) {
            sql +=
                ' (' + new Array(productIDs.length).fill('?').join(',') + ')';

            values = values.concat(productIDs);

            const [data] = await connection.execute(sql, values);
            if (data) products = data;
        }
    } catch (err) {
        console.log('err :>> ', err);
        payload.statusCode = 1;
    }
    // 獲取 user 資料
    try {
        let sql = `SELECT * FROM users WHERE id = ?`;
        values = [userID];

        console.log('sql :>> ', sql);

        const [data] = await connection.execute(sql, values);
        if (data) {
            user = data;
        }
    } catch (err) {
        console.log('err :>> ', err);
        payload.statusCode = 1;
    }

    // 寫入 orders 表一筆資料
    try {
        let sql = `INSERT INTO orders
                        (number,
                         product_name,
                         product_img,
                         products_total,
                         price_origin,
                         price_discount,
                         price_total,
                         payment_method,
                         user_name,
                         user_email,
                         created_at,
                         order_status_id,
                         product_id,
                         user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        let values = [];
        const number = Number.parseInt(Math.random() * 1000000);
        const productName = products[0].name;
        const productImg = products[0].img;
        const productsTotal = products.length;
        const priceOrigin = products.reduce((acc, curr) => {
            return acc + curr.price;
        }, 0);
        const priceDiscount = 0;
        const priceTotal = priceOrigin + priceDiscount;
        const paymentMethod = descriptionPayment(5);
        const userName = user.name;
        const userEmail = user.email;
        const createdAt = moment().format('YYYY-MM-DD');
        const orderStatusID = 7;
        const productID = products[0].id;
        // const userID = user.id;
        console.log('number :>> ', number);
        console.log('productName :>> ', productName);
        console.log('productImg :>> ', productImg);
        console.log('productsTotal :>> ', productsTotal);
        console.log('priceOrigin :>> ', priceOrigin);
        console.log('priceDiscount :>> ', priceDiscount);
        console.log('priceTotal :>> ', priceTotal);
        console.log('paymentMethod :>> ', paymentMethod);
        console.log('userName :>> ', userName);
        console.log('userEmail :>> ', userEmail);
        console.log('createdAt :>> ', createdAt);
        console.log('orderStatusID :>> ', orderStatusID);
        console.log('productID :>> ', productID);
        console.log('userID :>> ', userID);
        values = values.concat([
            number,
            productName,
            productImg,
            productsTotal,
            priceOrigin,
            priceDiscount,
            priceTotal,
            paymentMethod,
            userName,
            userEmail,
            createdAt,
            orderStatusID,
            productID,
            userID,
        ]);

        console.log('=====================================');
        console.log('sql :>> ', sql);
        console.log('values :>> ', values);

        await connection.execute(sql, values);
    } catch (err) {
        console.log('err :>> ', err);
    }

    // 寫入 order_detail 多筆資料
    try {
    } catch (err) {
        console.log('err :>> ', err);
    }

    res.json(payload);
});

// API_POST_ORDER_PAYMENT
router.post('/payment', function (req, res, next) {});

// 函數 Function
// 付款方式描述
function descriptionPayment(paymentID) {
    switch (paymentID) {
        case 1:
            return 'Apple 支付';
        case 2:
            return 'Google 支付';
        case 3:
            return 'Line 第三方支付';
        case 4:
            return '代碼繳費';
        case 5:
            return '信用卡';
        default:
            return '其它';
    }
}

// 驗證身分
function authUser(userID) {
    if (!req.session.user.id) return false;
    return userID == req.session.user.id;
}

// 取得資料庫訂單資料
function selectOrderByUser(userID, { orderStatus, sortBy, limit, offset }) {
    try {
        let sql = `SELECT  
                    id,
                    number,
                    productName,
                    productImg,
                    productsTotal,
                    priceOrigin,
                    priceDiscount,
                    priceTotal,
                    paymentMethod,
                    userName,
                    userEmail,
                    createdAt,
                    orderStatusID,
                    productID,
                    userID 
                FROM orders WHERE user_id = ?`;
        let values = [userID];
        // filter
        if (orderStatus) {
            sql = sql.concat(' AND order_status_id = ?');
            values.push(orderStatus);
        }
        if (sortBy) {
            sql = sql.concat(' ORDER BY ?');
            values.push(sortBy);
        }
        if (limit) {
            sql = sql.concat(' LIMIT ?');
            values.push(limit);
        }
        if (offset) {
            sql = sql.concat(' OFFSET ?');
            values.push(offset);
        }
        // test
        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        // execute
        const [data] = await connection.execute(sql, values);
        console.log('data :>> ', data);
        if (data.length < 0) {
            new Error('select order failed... userID :>>', userID);
        }

        return data;
    } catch (err) {
        console.log('err :>> ', err);
    }

    return null;
}

// 使用訂單號碼選擇訂單
function selectOrder(orderID) {
    try {
        let sql = `SELECT  
                    id,
                    number,
                    productName,
                    productImg,
                    productsTotal,
                    priceOrigin,
                    priceDiscount,
                    priceTotal,
                    paymentMethod,
                    userName,
                    userEmail,
                    createdAt,
                    orderStatusID,
                    productID,
                    userID 
                FROM orders WHERE id = ?`;
        let values = [orderID];

        const [data] = await connection.execute(sql, values);
        if (data.length < 0) {
            new Error('select order failed... userID :>>', userID);
        }

        return data;
    } catch (err) {
        console.log('err :>> ', err);
    }

    return null;
}

// 使用訂單號碼選擇訂單細節資料
function selectOrderDetail(orderID, { sortBy, limit, offset }) {
    try {
        let sql = `SELECT
                        id,
                        product_name AS productName,
                        product_price AS productPrice,
                        created_at AS createdAt,
                        order_id AS orderID,
                        product_id AS productID
                    FROM order_detail
                    WHERE order_id = ?`;
        let values = [orderID];

        if (sortBy) {
            sql = sql.concat(' ORDER BY ?');
            values.push(sortBy);
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

        if (data.length < 0) {
            new Error('select order detail failed... orderID :>>', orderID);
        }

        return data;
    } catch (err) {
        console.log('err :>> ', err);
    }

    return null;
}

module.exports = router;
