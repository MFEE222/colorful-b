
const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const knex = require('../utils/knex');
// third-part
require('dotenv').config();
const moment = require('moment');
const { default: validator } = require('validator');

// API_GET_CART
router.get('/', async function (req, res, next) {
    const { userID, orderBy, limit, offset } = req.query;
    const { user } = req.session;

    // if (!validator.isInt(userID) || userID != user.id) {
    //     res.status(400).end();
    //     return;
    // }

    // console.log('validator.isEmpty(limit) :>> ', validator.isEmpty(limit));
    console.log('limit === undefined :>> ', limit === undefined);
    try {

        const select = knex
            .select()
            .from('cart')
            .join('products', 'products.id', '=', 'cart.product_id')
            .where('user_id', userID);

        // console.log('select.toSQL().sql :>> ', select.toSQL().sql);

        if (orderBy !== undefined && validator.isJSON(orderBy)) {
            const { column, order } = JSON.parse(orderBy);
            select.orderBy(column, order);
        }

        if (limit !== undefined && validator.isInt(limit) && limit > 0) {
            select.limit(limit);
        }

        if (offset !== undefined && validator.isInt(offset) && offset > 0) {
            select.offset(offset);
        }

        // console.log('select.toSQL().sql :>> ', select.toSQL().sql);

        select.then(rows => {
            res.json(rows);
        });

    } catch (err) {
        console.log('err :>> ', err);
    }
});


module.exports = router;