const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
// third-part
const moment = require('moment');

// FIXME: 測試用中間件（用來設定 req.session.user.id）
router.use('/', function (req, res, next) {
    req.session.user = {
        id: 4,
    };
    next();
});

// 驗證身份
router.use('/', authUser);

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

    // 酬載
    const payload = {
        statusCode: 2,
        orders: await selectOrderByUser(userID, req.query),
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

    // 變數
    const data = {
        orderID: '', // 資料庫訂單成立後 ID
        orderNumber: '', // 資料庫訂單成立後號碼
        firstProductName: '', // 商品陣列中第一筆商品名稱，用來當作列表封面
        firstProductImg: '', // 商品陣列中第一筆商品圖片，用來當作列表封面
        firstProductID: '', // 商品陣列中第一筆商品 ID，用來當作列表封面
        productsTotal: '', // 本筆訂單總商品數量
        priceOrigin: '', // 本筆訂單原始總金額
        priceDiscount: '', // 本筆訂單折扣金額
        priceTotal: '', // 本筆訂單最後總金額
        paymentMethod: '', // 本筆訂單付款方式
        purchaserName: '', // 購買者名稱
        purchaserEmail: '', // 購買者電郵
        createdAt: '', // 訂單成立時間
        orderStatusID: '', // 訂單狀態，初始化狀態
        user: '', // 使用者資料
    };

    // 取得商品資料
    data.products = selectProducts(req.body.productsIDs);
    // 取得使用者資料
    data.user = selectUser(req.body.userID);

    // 彙整資料
    data.number = Number.parseInt(Math.random() * 1000000);
    data.firstProductName = products[0].name;
    data.firstProductImg = products[0].img;
    data.productsTotal = products.length;
    data.priceOrigin = products.reduce((acc, curr) => {
        return acc + curr.price;
    }, 0);
    data.priceDiscount = 0;
    data.priceTotal = priceOrigin + priceDiscount;
    data.paymentMethod = descriptionPayment(5);
    data.purchaserName = req.body.purchaserName;
    data.purchaserEmail = req.body.purchaserEmail;
    data.createdAt = moment().format('YYYY-MM-DD');
    data.orderStatusID = 7;
    data.firstProductID = products[0].id;
    // 寫入訂單資料庫
    data.orderID = insertOrder(data);
    console.log('data :>> ', data);

    // 寫入訂單細節資料庫
    insertOrderDetail(data);

    res.json({ statusCode: 2, allowPayment: true });
});

// API_POST_ORDER_PAYMENT
router.post('/payment', function (req, res, next) {
    // 驗證付款資訊
    // 發卡銀行驗證
    // 付款成功
    // 資料庫（orders, download, reviews）
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

// 驗證身分 中間件
function authUser(req, res, next) {
    const userID = req.userID;
    if (!req.session.user.id) {
        res.json({
            statusCode: 1,
            result: false,
        });
    }
    next();
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
                    product_name,
                    product_img,
                    products_total,
                    price_origin,
                    price_discount,
                    price_total,
                    payment_method,
                    purchaser_name,
                    purchaser_email,
                    created_at,
                    order_status_id,
                    product_id,
                    user_id 
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
                    product_name,
                    product_img,
                    products_total,
                    price_origin,
                    price_discount,
                    price_total,
                    payment_method,
                    purchaser_name,
                    purchaser_email,
                    created_at,
                    order_status_id,
                    product_id,
                    user_id 
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

// 選擇使用者資料
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

// 寫入訂單資料庫
async function insertOrder(data) {
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
                         purchaser_name,
                         purchaser_email,
                         created_at,
                         order_status_id,
                         product_id,
                         user_id)
                    VALUES
                         (?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?,
                          ?)`;
        let values = [
            data.orderNumber,
            data.firstProductName,
            data.firstProductImg,
            data.productsTotal,
            data.priceOrigin,
            data.priceDiscount,
            data.priceTotal,
            data.paymentMethod,
            data.purchaserName,
            data.purchaserEmail,
            data.createdAt,
            data.orderStatusID,
            data.firstProductID,
            data.user.id,
        ];

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        const [data] = await connection.execute(sql, values);

        console.log('data :>> ', data);
        return data.insertId;
    } catch (err) {
        console.log('err :>> ', err);
        return -1;
    }
}

// 寫入訂單細節資料庫
async function insertOrderDetail(data) {
    try {
        let sql = `INSERT INTO order_detail
                        (product_name,
                         product_price,
                         created_at,
                         order_id,
                         product_id)
                    VALUES`;
        let values = [];

        sql += new Array(data.products.length)
            .fill('(?, ?, ?, ?, ?)')
            .join(',');

        data.products.forEach(function (e) {
            values = values.concat([
                e.name,
                e.prodcut_price,
                e.created_at,
                e.order_id,
                e.product_id,
            ]);
        });

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        const [rows] = await connection.execute(sql, values);

        console.log('rows :>> ', rows);
    } catch (err) {
        console.log('err :>> ', err);
    }
}

module.exports = router;
