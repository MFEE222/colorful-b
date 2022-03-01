const res = require('express/lib/response');
const connection = require('../utils/db');

const getReview = async (req, res, next) => {
    const { uid, statusId, limit, offset } = req.query; //會員id
    console.log('req.query :>> ', req.query);
    //TODO:判斷session = uid
    let value = [uid];
    let sql = `SELECT  reviews.id,
                       reviews.title,
                       reviews.content,
                       reviews.stars,
                       reviews.img AS reviews_img,
                       reviews.likes,
                       reviews.created_at,
                       reviews.user_id,
                       reviews.product_id,
                       products.name,
                       products.img AS products_img,
                       products.descp
                FROM reviews
                LEFT JOIN products ON reviews.product_id = products.id
                WHERE reviews.user_id = ? AND`;

    if (statusId == 1) sql += ` (review_status_id IN (2,4))`;
    if (statusId == 2) sql + ` (review_status_id = 2)`;
    if (statusId == 3) sql + ` (review_status_id = 4)`;
    if (limit) {
        sql += ` Limit ?`;
        value.push(limit);
    }
    if (offset) {
        sql += ` OFFSET ?`;
        value.push(offset);
    }

    console.log('sql :>> ', sql);
    try {
        const [data, fields] = await connection.execute(sql, value);
        const counts = data.length;
        res.json({
            data,
            counts,
        });
    } catch (err) {
        console.log('err :>> ', err);
    }
};
module.exports = {
    getReview,
};
