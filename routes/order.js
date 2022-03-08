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
    if (!authUser(userID, req)) {
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
    if (!authUser(userID, req)) {
        res.json({
            statusCode: 1,
            orderDetail: [],
        });
    }
    // 酬載
    const payload = {
        statusCode: 2,
        orderDetailID: selectOrderDetail(orderID, req.query),
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
//     purchaserName,
//     purchaserEmail,
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
    console.log('req.body :>> ', req.body);
    const userID = req.body.userID;
    const productIDs = !Array.isArray(req.body.productIDs)
        ? JSON.parse(req.body.productIDs)
        : req.body.productIDs;

    // 驗證
    if (!authUser(userID, req)) {
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

    // 取得商品資料
    const products = selectProducts(productIDs);
    // 取得使用者資料
    const user = selectUser(userID);

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
                         user_id) 
                    OUTPUT Inserted.ID
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
        // SELECT SCOPE_IDENTITY()
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

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);

        const [data, field] = await connection.execute(sql, values);
        console.log('data :>> ', data);
        console.log('field :>> ', field);
    } catch (err) {
        console.log('err :>> ', err);
    }

    // 寫入 order_detail 多筆資料
    // product_name
    // product_price
    // created_at
    // order_id
    // product_id

    productIDs.forEach(function (e) {
        insertOrderDetail(
            e.productName,
            e.productPrice,
            moment().format('YYYY-MM-DD'),
            3,
            e.id
        );
    });

    res.json(payload);
});

// API_POST_ORDER_PAYMENT
router.post('/payment', function (req, res, next) {
    // download table
    // review table
    //
    // 核對身份
    // 驗證付款資訊
    // 發卡銀行驗證
    // 付款成功
    // 資料庫
    //
});

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
function authUser(userID, eq) {
    if (!req.session.user.id) return false;
    return userID == req.session.user.id;
}

// 取得資料庫訂單資料
async function selectOrderByUser(
    userID,
    { orderStatus, sortBy, limit, offset }
) {
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
        return null;
    }
}

// 使用訂單號碼選擇訂單
async function selectOrder(orderID) {
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
        return null;
    }
}

// 使用訂單號碼選擇訂單細節資料
async function selectOrderDetail(orderID, { sortBy, limit, offset }) {
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
        return null;
    }
}

// 選擇商品資料
async function selectProducts(productIDs) {
    try {
        let sql = `SELECT
                        id, 
                        name,
                        img,
                        price,
                        currency,
                        product_status_id AS productStatusID,
                        product_series_id AS productSeriesID
                    FROM products
                    WHERE id IN`;
        let values = [];
        if (productIDs.length <= 0) {
            new Error('argument productIDs is empty...');
        }
        sql += ' (' + new Array(productIDs.length).fill('?').join(',') + ')';
        values = values.concat(productIDs);

        const [data] = await connection.execute(sql, values);
        if (data.length < 0) {
            new Error('select product failed... productIDs :>>', productIDs);
        }
        return data;
    } catch (err) {
        console.log('err :>> ', err);
        return null;
    }
}

async function selectUser(userID) {
    try {
        let sql = `SELECT * FROM users WHERE id = ?`;
        let values = [userID];

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        const [data] = await connection.execute(sql, values);

        console.log('data :>> ', data);
        if (data.length < 0) {
            new Error('select user failed .... userID:>>', userID);
        }
        return data;
    } catch (err) {
        console.log('err :>> ', err);
        return null;
    }
}

async function insertOrderDetail(
    productName,
    productPrice,
    createdAt,
    orderID,
    productID
) {
    try {
        let sql = `INSERT INTO order_detail
                        (product_name,
                        product_price,
                        created_at,
                        order_id,
                        product_id)
                    VALUES (?, ?, ?, ?, ?)`;
        let values = [productName, productPrice, createdAt, orderID, productID];

        await connection.execute(sql.values);
    } catch (err) {
        console.log('err :>> ', err);
    }
}

module.exports = router;
