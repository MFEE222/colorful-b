// /controllers/wishlist
const connection = require('../utils/db');

//取得全部資料
const getData = async (req, res, next) => {
    console.log('123');
    const { userid } = req.query;

    if (!userid) {
        res.json({ error: '請輸入正確的 userid' });
    }
    console.log('userid :>> ', userid);
    let sql = `SELECT
                    id,
                    created_at,
                    product_id,
                    user_id
               FROM wishlist
               WHERE user_id = ?`;

    try {
        let [data, datafileds] = await connection.execute(sql, [userid]);
        console.log('data :>> ', data);
        // console.log('datafileds :>> ', datafileds);
        res.json(data);
    } catch (err) {
        console.log('err :>> ', err);
    }
};

const getProducts = async function (req, res, next) {
    // let sql = `
    //     SELECT *
    //     FROM products
    //     WHERE id = 1 OR id = 2 OR id = 3 ;
    // `;

    const { id } = req.query;

    const sql = `SELECT * FROM products`;
    const value = [];
    // 串聯 sql
    OR(sql, value, id);

    console.log('sql :>> ', sql);
    console.log('value :>> ', value);

    // 資料庫要資料;
    try {
        let [data, datafileds] = await connection.execute(sql, value);
        console.log('data :>> ', data);
        // console.log('datafileds :>> ', datafileds);
        res.json(data);
    } catch (err) {
        console.log('err :>> ', err);
    }

    // res.json({ message: 'abc' });
};

function OR(sql, values, arr_id) {
    if ((arr_id = [1, 2])) {
        if (!sql.includes('WHERE')) sql = sql.concat(` WHERE`);
        arr_id.forEach(function (id, index) {
            if (index === 0) sql = sql.concat(' id = ?');
            else sql = sql.concat(' OR id = ?');

            values.push(id);
        });

        return sql;
    }
}

function or(sql, condition) {
    return sql.includes('WHERE')
        ? sql.concat(' AND ', '(', condition, ')')
        : sql.concat(' WHERE ', '(', condition, ')');
}

module.exports = {
    getData,
    getProducts,
};
