const res = require('express/lib/response');
const connection = require('../utils/db');
const path = require('path');
const fs = require('fs/promises');
const { resolve } = require('path');
const { rejects } = require('assert');

// 請求推薦商品
const getRecommend = async (req, res, next) => {
    try {
        const [data, fields] = await connection.execute(
            'SELECT * FROM products WHERE product_status_id = 1 ORDER BY products.owners DESC LIMIT 8'
        );
        // console.log('data :>> ', data);
        res.json({
            recommend: data,
        });
    } catch (err) {
        console.log('err :>> ', err);
    }
};

// 請求系列標籤
const getList = async (req, res, next) => {
    try {
        const [series, seriesfieds] = await connection.execute(
            'SELECT * FROM product_series'
        );
        // console.log('series :>> ', series);

        const [tags, tagsfileds] = await connection.execute(
            'SELECT * FROM tag'
        );
        // console.log('tags :>> ', tags);

        const [tagProduct, tagProductFileds] = await connection.execute(
            'SELECT * FROM product_tag'
        );
        // console.log('tagProduct :>> ', tagProduct);

        res.json({ series, tags, tagProduct });
    } catch (err) {
        console.log('err :>> ', err);
    }
};

// 請求評論資料
//TODO:根據資料庫img存的「 資料夾路徑 」回傳裡面全部的照片（一條會員評論的照片）
//TODO:回傳此商品顧客上傳的全部照片
const getReviewDetail = async (req, res, next) => {
    const pid = req.params.pid;
    try {
        const [reviewDetail, reviewDetailFields] = await connection.execute(
            `
            SELECT
                reviews.id,
                reviews.title,
                reviews.content,
                reviews.stars,
                reviews.img,
                reviews.likes,
                reviews.user_id,
                reviews.product_id,
                users.name,
                users.figure
            FROM reviews
            LEFT JOIN users ON reviews.user_id = users.id
            WHERE reviews.product_id = ?
        `,
            [pid]
        );
        const rids = reviewDetail.map((v) => {
            return v.id;
        });
        // console.log('rids :>> ', rids);
        Promise.all(
            reviewDetail.map(async function (v) {
                return new Promise((resolve, reject) => {
                    (async () => {
                        const dir = path.join(
                            __dirname,
                            '../public/uploads/reviews',
                            `r-${v.id}`
                        );
                        let files = await fs.readdir(dir);
                        v.photos = files;
                        resolve(v);
                    })();
                });
            })
        ).then((newReviewDetail) => {
            console.log('newReviewDetail :>> ', newReviewDetail);
            res.json({ newReviewDetail });
        });
    } catch (err) {
        console.log('err :>> ', err);
    }
};

const getData = async function (req, res, next) {
    // console.log('req.query:>> ', req.query);
    // 取得 query
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

    // console.log('ids :>> ', ids);
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
    // console.log('limit :>> ', limit);

    // 過濾 query

    // 3 個 SQL
    const sql_count = new sql('SELECT', ['COUNT(id) AS total'], 'products');
    // const sql_tags = new sql('SELECT', ['product_id'], 'product_tag');
    const sql_products = new sql(
        'SELECT',
        [
            'id',
            'name',
            'descp',
            'img',
            'price',
            'currency',
            'favorites',
            'owners',
            'stars',
            'review_counts',
            'created_at',
            'product_series_id',
        ],
        'products'
    );

    // 條件設定
    if (ids) {
        sql_count.id(ids);
        sql_products.id(ids);
    }
    if (keyword) {
        sql_count.keyword(keyword);
        sql_products.keyword(keyword);
    }
    if (series && series > 1) {
        sql_count.series(series);
        sql_products.series(series);
    }
    if (price) {
        sql_count.price(price);
        sql_products.price(price);
    }
    if (orderby) {
        const o = order == 0 ? 0 : 1;
        sql_products.orderby(orderby, o);
    }
    if (limit) {
        sql_products.limit(limit);
    }
    if (offset) {
        sql_products.offset(offset);
    }

    // 發出請求
    let result = true;
    result &= await sql_products.run();
    result &= await sql_count.run();

    // console.log('sql_products.data :>> ', sql_products.data);
    // console.log('sql_count.data :>> ', sql_count.data);

    // 失敗
    if (!result) {
    }

    // 成功
    res.json({
        statusCode: 2002,
        products: sql_products.data,
        total: sql_count.data[0].total,
    });
};

class sql {
    constructor(command, columns, table) {
        this._sql = `${command} ${columns.join(', ')} FROM ${table}`;
        this._values = [];
        this._data = null;
    }

    // JOIN
    join(table, on, methd = 'JOIN') {
        // sql injection (待處理)
        this._sql += ` JOIN ${table} ON ${on}`;
    }

    // WHERE
    id(arr) {
        if (!Array.isArray(arr)) arr = JSON.parse(arr);
        this._sql += this._sql.includes('WHERE') ? ' AND' : ' WHERE';
        this._sql += ` (id IN (${arr.reduce(
            (a, c, i) => (i !== 0 ? a + ', ?' : a),
            '?'
        )}))`;
        arr.forEach((e) => this._values.push(e));
    }

    keyword(str) {
        this._sql += this._sql.includes('WHERE') ? ' AND' : ' WHERE';
        this._sql += ` (name LIKE ?)`;
        this._values.push('%' + str + '%');
    }

    series(str) {
        this._sql += this._sql.includes('WHERE') ? ' AND' : ' WHERE';
        this._sql += ` (product_series_id = ?)`;
        this._values.push(str);
    }

    tags(arr) {
        if (!Array.isArray(arr)) arr = JSON.parse(arr);
        this._sql += this._sql.includes('WHERE') ? ' AND' : ' WHERE';
        this._sql += ` (id IN (${arr.reduce((a, c) => a + ', ?', '')}))`;
        arr.forEach((e) => this._values.push(e));
    }

    price(arr) {
        if (!Array.isArray(arr)) arr = JSON.parse(arr);
        // this._sql += ` (price BETWEEN ? AND ?)`;
        if (arr[0] > 0) {
            this._sql += this._sql.includes('WHERE') ? ' AND' : ' WHERE';
            this._sql += ` (price >= ?)`;
            this._values.push(arr[0]);
        }
        if (arr[1] > 0) {
            this._sql += this._sql.includes('WHERE') ? ' AND' : ' WHERE';
            this._sql += ` (price <= ?)`;
            this._values.push(arr[1]);
        }
    }

    orderby(col, order = 0) {
        const white = [
            'id',
            'name',
            'descp',
            'img',
            'price',
            'currency',
            'favorites',
            'owners',
            'stars',
            'review_counts',
            'created_at',
            'product_series_id',
        ];
        if (white.includes(col)) {
            this._sql += ` ORDER BY ${col} ${order == 1 ? 'DESC' : 'ASC'}`;
        }
    }

    limit(int) {
        this._sql += ` LIMIT ?`;
        this._values.push(int);
    }

    offset(int) {
        this._sql += ` OFFSET ?`;
        this._values.push(int);
    }

    async run() {
        try {
            // console.log('this._sql :>> ', this._sql);
            // console.log('this._values :>> ', this._values);
            const [d, f] = await connection.execute(this._sql, this._values);
            // console.log('d :>> ', d);
            this._data = d;
            return true;
        } catch (err) {
            // console.log('err :>> ', err);
            return false;
        }
    }

    get data() {
        return this._data;
    }
}

module.exports = {
    getData,
    getList,
    getRecommend,
    getReviewDetail,
    // getReviewImgs,
};
