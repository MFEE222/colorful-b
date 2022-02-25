// /controllers/product
const connection = require('../utils/db');

//取得全部資料
const getData = async (req, res, next) => {
    // const sqlst = ()=>{
    const {
        ids,
        keyword,
        date,
        series,
        price,
        favorites,
        owners,
        stars,
        offset,
        orderby,
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
    // console.log('orderby :>> ', orderby);
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
    // ids [1,2,3]
    if (ids) {
        // 1.           ( id = ?
        // 2 ~ N-1.     OR id = ?
        // N.           OR id = ?)
        for (let i = 0; i < ids.length; i++) {
            if (i === 0) {
                sql += ' AND ( id = ?';
            } else {
                sql += ' OR id = ?';
            }
            values.push(ids[i]);
        }
        sql += ' )';
    }
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

    if (order && orderby) {
        const s = order == 0 ? 'ASC' : 'DESC';
        switch (orderby) {
            case 'id':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY id DESC`)
                        : sql.concat(` ORDER BY id`);
                break;
            case 'name':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY name DESC`)
                        : sql.concat(` ORDER BY name`);
                break;
            case 'descp':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY descp DESC`)
                        : sql.concat(` ORDER BY descp`);
                break;
            case 'img':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY img DESC`)
                        : sql.concat(` ORDER BY img`);
                break;
            case 'price':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY price DESC`)
                        : sql.concat(` ORDER BY price`);
                break;
            case 'currency':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY currency DESC`)
                        : sql.concat(` ORDER BY currency`);
                break;
            case 'favorites':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY favorites DESC`)
                        : sql.concat(` ORDER BY favorites`);
                break;
            case 'owners':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY owners DESC`)
                        : sql.concat(` ORDER BY owners`);
                break;
            case 'stars':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY stars DESC`)
                        : sql.concat(` ORDER BY stars`);
                break;
            case 'review_counts':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY review_counts DESC`)
                        : sql.concat(` ORDER BY review_counts`);
                break;
            case 'created_at':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY created_at DESC`)
                        : sql.concat(` ORDER BY created_at`);
                break;
            case 'product_series_id':
                sql =
                    order == 1
                        ? sql.concat(` ORDER BY product_series_id DESC`)
                        : sql.concat(` ORDER BY product_series_id`);
                break;
        }
        values.push(s);
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
            ? sql.concat(` ${operator} `, '(', condition, ')')
            : sql.concat(' WHERE ', '(', condition, ')');
    }

    try {
        let [data, datafileds] = await connection.execute(sql, values);
        console.log('data :>> ', data);
        // console.log('datafileds :>> ', datafileds);
        // res.json(data);
        res.json({
            statusCode: 2002,
            products: data,
        });
    } catch (err) {
        console.log('err :>> ', err);
    }

    // res.json({ word: 'hi' });
};

//tags 種類
const getList = async (req, res, next) => {
    let [series, seriesfieds] = await connection.execute(
        'SELECT * FROM product_series'
    );
    let [tags, tagsfileds] = await connection.execute('SELECT * FROM tag');
    let [tagProduct, tagProductFileds] = await connection.execute(
        'SELECT * FROM product_tag'
    );
    console.log(series);
    res.json({ series, tags, tagProduct });
};

//推薦
const getRecommend = async (req, res, next) => {
    let [recommend, recommendfields] = await connection.execute(
        'SELECT * FROM products WHERE product_status_id = 1 ORDER BY products.owners DESC LIMIT 8'
    );
    console.log(recommend);
    res.json({
        recommend,
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
    //TODO:根據資料庫img存的「 資料夾路徑 」回傳裡面全部的照片（一條會員評論的照片）
    //TODO:回傳此商品顧客上傳的全部照片
};

module.exports = {
    getData,
    getList,
    getRecommend,
    getReviewDetail,
    // getReviewImgs,
};
