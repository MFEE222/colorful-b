// /controllers/product
const connection = require('../utils/db');

//取得全部資料
const getData = async (req, res, next) => {
    // const sqlst = ()=>{
    const {
        keyword,
        date,
        series,
        price,
        favorites,
        owners,
        stars,
        offset,
        order,
        limit,
    } = req.query;
    const values = [];
    // console.log('req.query :>> ', req.query);
    // console.log('keyword :>> ', keyword);
    // console.log('date :>> ', date);
    // console.log('series :>> ', series);
    // console.log('price :>> ', price);
    // console.log('favorites :>> ', favorites);
    // console.log('owners :>> ', owners);
    // console.log('stars :>> ', stars);
    // console.log('offset :>> ', offset);
    // console.log('order :>> ', order);
    // console.log('limit :> ', limit);

    let sql = `SELECT 
                    id,
                    name,
                    descp,
                    img,
                    price,
                    currency,
                    favorites,
                    owners,
                    stars,
                    review_counts,
                    created_at,
                    product_series_id
               FROM products
               WHERE product_status_id = 1`;
    // keyword
    if (keyword) {
        sql = where(sql, 'name LIKE ?');
        values.push('%' + keyword + '%');
    }
    // series
    if (series) {
        sql = where(sql, 'product_series_id = ?');
        values.push(series);
    }
    // price (>=, <= [200, ASC or DESC])
    if (price) {
        if (price[0] > 0) {
            sql = where(sql, 'price >= ?');
            values.push(price[0]);
        }
        if (price[1] > 0) {
            sql = where(sql, 'price <= ?');
            values.push(price[1]);
        }
    }

    if (order) {
        sql =
            order == 0
                ? sql.concat(` ORDER BY price ASC`)
                : sql.concat(` ORDER BY price DESC`);
    }
    // favorite (>=, <=)
    // TODO:前端用升冪降冪
    // owners
    // TODO:前端用升冪降冪
    // limit
    if (limit) {
        sql = sql.concat(' LIMIT ?');
        values.push(limit);
    }
    console.log('sql :>> ', sql);
    console.log('values :>> ', values);

    function where(sql, condition, operator = 'AND') {
        return sql.includes('WHERE')
            ? sql.concat(' AND ', '(', condition, ')')
            : sql.concat(' WHERE ', '(', condition, ')');
    }

    try {
        let [data, datafileds] = await connection.execute(sql, values);
        console.log('data :>> ', data);
        // console.log('datafileds :>> ', datafileds);

        // res.json(data);
    } catch (err) {
        console.log('err :>> ', err);
    }

    res.json({ word: 'hi' });
};

//全部商品
// let [data,datafileds] = await connection.execute("SELECT * FROM products LIMIT 15");
// //tags種類
// let [tags,tagsfileds] = await connection.execute("SELECT * FROM tag");
// // tags商品
// let [tagProduct,tagProductFileds] = await connection.execute("SELECT * FROM product_tag");
// // console.log('here---------')
// console.log(data);
// res.json({
//     data,
//     tags,
//     tagProduct,

// });

//推薦
const getRanking = async (req, res, next) => {
    let [rank, rankFileds] = await connection.execute(
        'SELECT * FROM products ORDER BY products.owners DESC LIMIT 8'
    );
    console.log(rank);
    res.json({
        rank,
    });
};
//review 詳細
const getReviewDetail = async (req, res, next) => {
    const pid = req.params.pid;
    console.log(req);
    let [reviewDetail, reviewDetailFields] = await connection.execute(
        `
            SELECT
                review.id as r_id,
                review.title as r_title,
                review.content as r_content,
                review.stars as r_stars,
                review.img as r_img,
                review.likes as r_likes,
                review.created_at as r_created_at,
                review.user_id as r_user_id,
                review.product_id as r_product_id,
                users.name as u_name,
                users.figure as u_figur
            FROM review
            LEFT JOIN users ON review.user_id = users.id
            WHERE review.product_id = ?
        `,
        [pid]
    );

    res.json({ reviewDetail });

    // let [reviewDetail, reviewDetailFields] = await connection.execute(
    //     `
    //         SELECT *
    //         FROM review
    //     `,
    //     [pid]
    // );
};
module.exports = {
    getData,
    getRanking,
    getReviewDetail,
};
