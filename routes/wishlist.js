const express = require('express');
const router = express.Router();
const connection = require('../utils/db');

// const wishlistController = require('../controllers/wishlist');

//取得全部資料
router.get('/', async (req, res, next) => {
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
});

// router.get('/test', wishlistController.getProducts);

module.exports = router;
