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
router.get('/', async function (req, res, next) {
    console.log('req.query :>> ', req.query);
    const { userID, orderStatus, date, sortBy, sortType, limit, offset } =
        req.query;

    // 酬載
    const payload = {
        statusCode: 2,
        order: await selectOrdersByUser(userID, req.query),
    };

    // 返回
    res.json(payload);
});

// API_GET_ORDER_DETAIL
router.get('/detail', async function (req, res, next) {
    console.log('req.query :>> ', req.query);
    const { userID, orderID, orderNumber, sortBy, sortType, limit, offset } =
        req.query;
    // 酬載
    const order = await selectOrderByUser(orderID, userID);

    if (!order[0]) {
        res.json({
            statusCode: 1,
            orderDetail: [],
        });
        return;
    }

    const payload = {
        statusCode: 2,
        orderDetail: await selectOrderDetail(order[0].id, req.query),
    };
    // 返回
    res.json(payload);
});

// API_POST_ORDER
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
    data.products = await selectProducts(productIDs);
    // 取得使用者資料
    data.user = (await selectUser(userID))[0];

    // 彙整資料
    data.orderNumber = Number.parseInt(Math.random() * 1000000);
    data.firstProductName = data.products[0].name;
    data.firstProductImg = data.products[0].img;
    data.productsTotal = data.products.length;
    data.priceOrigin = data.products.reduce((acc, curr) => {
        return acc + curr.price;
    }, 0);
    data.priceDiscount = 0;
    data.priceTotal = data.priceOrigin + data.priceDiscount;
    data.paymentMethod = descriptionPayment(5);
    data.purchaserName = req.body.purchaserName;
    data.purchaserEmail = req.body.purchaserEmail;
    data.createdAt = moment().format('YYYY-MM-DD');
    data.orderStatusID = 7;
    data.firstProductID = data.products[0].id;
    // 寫入訂單資料庫
    data.orderID = await insertOrder(data);
    // console.log('data :>> ', data);

    // 寫入訂單細節資料庫
    await insertOrderDetail(data);

    res.json({ statusCode: 2, allowPayment: true });
});

// API_POST_ORDER_PAYMENT
router.post('/payment', async function (req, res, next) {
    console.log('req.body :>> ', req.body);
    const { userID, orderID, creditCard, csv, expiredDate } = req.body;
    // 驗證付款資訊
    if (!creditCard || !csv || !expiredDate) {
        res.json({
            statusCode: 1,
            resultPayment: false,
        });
    }
    // 發卡銀行驗證
    // 付款成功

    // 變數
    const data = {
        creditCard,
        csv,
        expiredDate,
        order: '',
        orderDetail: '',
        products: '',
        user: '',
    };

    // 取得使用者資料
    data.user = (await selectUser(userID))[0];
    console.log('data.user :>> ', data.user);

    // 取得訂單資料
    data.order = (await selectOrderByUser(orderID, userID))[0];
    console.log('data.order :>> ', data.order);

    // 取得訂單細節資料 []
    data.orderDetail = await selectOrderDetail(orderID, req.body);
    console.log('data.orderDetail :>> ', data.orderDetail);

    // 取得商品資料
    // const p = data.orderDetail.map((e) => e.productID);
    const p = [11, 22];
    data.products = await selectProducts(p);
    console.log('data.products :>> ', data.products);
    console.log('here');
    // 資料庫（orders, download, reviews）
    await updateOrderStatus(3, orderID);

    await insertDownload(data);

    await insertReviews(data);

    res.json({
        statusCode: 2,
        resultPayment: true,
    });
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
async function selectOrdersByUser(
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
        // console.log('sql :>> ', sql);
        // console.log('values :>> ', values);
        // execute
        const [data] = await connection.execute(sql, values);
        // console.log('data :>> ', data);
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
async function selectOrderByUser(orderID, userID) {
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
                FROM orders WHERE id = ? AND user_id = ?`;
        let values = [orderID, userID];

        // console.log('sql :>> ', sql);
        // console.log('values :>> ', values);
        const [data] = await connection.execute(sql, values);
        // console.log('data :>> ', data);
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
            sql += ' ORDER BY ?';
            values.push(sortBy);
        }

        if (limit) {
            sql += ' LIMIT ?';
            values.push(limit);
        }

        if (offset) {
            sql += ' OFFSET ?';
            values.push(offset);
        }

        // console.log('sql :>> ', sql);
        // console.log('values :>> ', values);
        const [data] = await connection.execute(sql, values);
        // console.log('data :>> ', data);
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
    // console.log('productIDs :>> ', productIDs);
    try {
        let sql = `SELECT
                        id, 
                        name,
                        img,
                        price,
                        currency,
                        created_at AS createdAt,
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

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        const [data] = await connection.execute(sql, values);
        if (data.length < 0) {
            new Error('select product failed... productIDs :>>', productIDs);
        }
        console.log('data :>> ', data);
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

        // console.log('sql :>> ', sql);
        // console.log('values :>> ', values);
        const [data] = await connection.execute(sql, values);

        // console.log('data :>> ', data);
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

        // console.log('sql :>> ', sql);
        // console.log('values :>> ', values);
        const [row] = await connection.execute(sql, values);
        // console.log('row :>> ', row);
        return row.insertId;
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
            .fill(' (?, ?, ?, ?, ?) ')
            .join(',');

        // console.log('data.products :>> ', data.products);
        data.products.forEach(function (e) {
            values = values.concat([
                e.name,
                e.price,
                e.createdAt,
                data.orderID,
                e.id,
            ]);
        });

        // console.log('sql :>> ', sql);
        // console.log('values :>> ', values);
        const [rows] = await connection.execute(sql, values);

        // console.log('rows :>> ', rows);
    } catch (err) {
        console.log('err :>> ', err);
    }
}

// 更新 Orders 表
async function updateOrderStatus(orderID, orderStatus) {
    try {
        let sql = `UPDATE orders SET order_status_id = ? WHERE id = ?`;
        let values = [orderStatus, orderID];

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        const [rows] = await connection.execute(sql, values);
        console.log('rows :>> ', rows);
    } catch (err) {
        console.log('err :>> ', err);
    }
}
// 新增 Download 表
async function insertDownload(data) {
    try {
        let sql = `INSERT INTO download
                         (status,
                         created_at,
                         user_id,
                         product_id)
                    VALUES`;
        let values = [];

        sql += new Array(data.products.length).fill(' (?, ?, ?, ?) ').join(',');
        data.products.forEach(function (e) {
            values = values.concat([
                1,
                '2000-01-01',
                data.user.id,
                e.id, // 商品 id
            ]);
        });

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);
        const [rows] = await connection.execute(sql, values);

        console.log('rows :>> ', rows);
        return rows.insertId;
    } catch (err) {
        console.log('err :>> ', err);
        return null;
    }
}
// 新增 Reviews 表
async function insertReviews(data) {
    try {
        let sql = `INSERT INTO reviews
                         (title,
                         content,
                         stars,
                         img,
                         likes,
                         created_at,
                         review_status_id,
                         user_id,
                         product_id)
                    VALUES`;
        let values = [];

        sql += new Array(data.orderDetail.length)
            .fill(' (?, ?, ?, ?, ?, ?, ?, ?, ?) ')
            .join(',');
        data.orderDetail.forEach(function (e) {
            values = values.concat([
                '',
                '',
                0,
                '',
                0,
                0,
                1,
                data.user.id,
                e.productID,
            ]);
        });

        console.log('sql :>> ', sql);
        console.log('values :>> ', values);

        const [rows] = await connection.execute(sql, values);
        console.log('rows :>> ', rows);
        return rows.insertId;
    } catch (err) {
        console.log('err :>> ', err);
        return null;
    }
}

module.exports = router;
