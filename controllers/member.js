const path = require('path');
const multer = require('multer');
const res = require('express/lib/response');
const connection = require('../utils/db');
const { resourceUsage } = require('process');
const fs = require('fs/promises');

// 評論細節
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

const getUpdateDetail = async (req, res, next) => {
    console.log('req.body :>> ', req.body);
    //更新資料庫
    const { rid, stars, title, content } = req.body;
    //圖片位置
    let imgPath = `uploads/reviews/r-${rid}`;
    console.log('imgPath :>> ', imgPath);
    //更新edited_at 時間
    let date = new Date();
    const formatDate = (date) => {
        let formatted_date =
            date.getFullYear() +
            '/' +
            (date.getMonth() + 1) +
            '/' +
            date.getDate();
        return formatted_date;
    };
    const editDate = formatDate(date);
    console.log(editDate);

    try {
        //更新 DB
        const [data, fields] = await connection.execute(
            'UPDATE reviews SET stars = ? ,title = ? ,content = ?, img = ?, edited_at = ?, review_status_id = 4 WHERE id = ?',
            [stars, title, content, imgPath, editDate, rid]
        );
        //讀取資料夾裡檔案數量
        const dir = path.join(
            __dirname,
            '../public/uploads/reviews',
            `r-${rid}`
        );
        //readdir (promise)
        const files = await fs.readdir(dir);
        res.json({ message: 200, imgPath, imgName: files });
    } catch (err) {
        console.log('err :>> ', err);
    }
    // res.json('ok');
};
module.exports = {
    getReview,
    getUpdateDetail,
};
//TODO:讀取檔案r-id檔案 看有多少圖片->回傳->前端圖片寫法更新
