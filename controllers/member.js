const path = require('path');
const multer = require('multer');
const res = require('express/lib/response');
const connection = require('../utils/db');
const { resourceUsage } = require('process');

//評論區data
const getReview = async (req, res, next) => {
    const { uid, statusId, limit, offset } = req.query; //會員id
    console.log('req.query :>> ', req.query);
    //TODO:判斷session = uid
    let value = [uid];
    let sqlCounts = `SELECT COUNT(*) AS total 
                    FROM reviews
                    WHERE reviews.user_id = ? AND`;

    if (statusId == 1) sqlCounts += ` (review_status_id IN (2,4))`;
    if (statusId == 2) sqlCounts += ` (review_status_id = 2)`;
    if (statusId == 3) sqlCounts += ` (review_status_id = 4)`;

    let sql = `SELECT  reviews.id,
                       reviews.title,
                       reviews.content,
                       reviews.stars,
                       reviews.img AS reviews_img,
                       reviews.likes,
                       reviews.created_at,
                       reviews.user_id,
                       reviews.review_status_id,
                       reviews.product_id,
                       products.name,
                       products.img AS products_img,
                       products.descp
                FROM reviews
                JOIN products ON reviews.product_id = products.id
                WHERE reviews.user_id = ? AND`;

    if (statusId == 1) sql += ` (review_status_id IN (2,4))`;
    if (statusId == 2) sql += ` (review_status_id = 2)`;
    if (statusId == 3) sql += ` (review_status_id = 4)`;

    if (limit) {
        sql += ` LIMIT ?`;
        value.push(limit);
    }
    if (offset) {
        sql += ` OFFSET ?`;
        value.push(offset);
    }
    // console.log('sql :>> ', sql);
    // console.log('sqlCounts :>> ', sqlCounts);

    try {
        const [rows, Rowsfields] = await connection.execute(sqlCounts, [uid]);
        const [data, fields] = await connection.execute(sql, value);
        // console.log('fields :>> ', fields);

        res.json({
            data,
            rows: rows[0].total,
        });
        console.log('rows :>> ', rows[0].total);
    } catch (err) {
        console.log('err :>> ', err);
    }
};

//下載區data
const getDownload = async (req, res, next) => {
    const { uid, statusId, offset } = req.query; //會員id
    console.log('req.query :>> ', req.query);
    //TODO:判斷session = uid
    let value = [uid];
    let sqlCounts = `SELECT COUNT(*) AS total
                    FROM download
                    WHERE user_id = ?`;

    if (statusId == 1) sqlCounts += ` AND status = 1`; //id=1 未下載
    if (statusId == 2) sqlCounts += ` AND status = 2`; //id=2 已下載

    let sql =
        'SELECT download.id,download.status,download.user_id,download.product_id,products.name,products.img AS products_img FROM download  JOIN products ON download.product_id = products.id WHERE download.user_id = ?';
    if (statusId == 0) sql += ` LIMIT 9`;
    if (statusId == 1) sql += ` AND download.status = 1 LIMIT 9`;
    if (statusId == 2) sql += ` AND download.status = 2 LIMIT 9`;

    if (offset) {
        sql += ` OFFSET ?`;
        value.push(offset);
    }
    try {
        // console.log('sqlCounts :>> ', sqlCounts);
        console.log('sql :>> ', sql);
        const [rows, Rowsfields] = await connection.execute(sqlCounts, [uid]);
        const [data, fields] = await connection.execute(sql, value);
        console.log('data :>> ', data);
        // console.log('rows :>> ', rows[0].total);

        res.json({
            data,
            rows: rows[0].total,
        });
        // console.log('rows :>> ', rows[0].total);
    } catch (err) {
        console.log('err :>> ', err);
    }
};

//壓縮Dng
const getDng = async (req, rea, next) => {
    const { uid, dngId } = req.body; //會員id
    console.log('uid :>> ', uid);
    console.log('dngid :>> ', dngId);
    const values = [];
    values.push(uid);
    dngId.forEach((e) => values.push(e));
    //壓縮
    //更新資料庫
    let sql = 'UPDATE download SET status=2 WHERE user_id = ? AND product_id';
    if (!Array.isArray(dngId)) dngId = JSON.parse(dngId);
    sql += ` IN (${dngId.reduce((a, c, i) => (i !== 0 ? a + ', ?' : a), '?')})`;
    console.log('sql :>> ', sql);
    try {
        const [data, fields] = await connection.execute(sql, values);
    } catch (err) {
        console.log('err :>> ', err);
    }
};
module.exports = {
    getReview,
    getDownload,
    getDng,
};
