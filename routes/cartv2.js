
const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const knex = require('../utils/knex');
// third-part
require('dotenv').config();
const moment = require('moment');
const { default: validator } = require('validator');

// Check Identity
router.use('/', function (req, res, next) {
    const { userID } = req.query;
    const { user } = req.session;

    // if (userID === undefined || user === undefined ||
    //     !validator.isInt(userID) || userID != user.id) {
    //     res.status(400).end();
    //     return;
    // }

    next();
});

// API_CART_GET
router.get('/', async function (req, res, next) {
    const { userID, orderBy, limit, offset } = req.query;
    const { user } = req.session;

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

// API_CART_POST
router.post('/', async function (req, res, next) {
    const { userID, action } = req.body;
    const { user } = req.session;

    if (action === undefined || !validator.isJSON(action)) {
        res.status(400).end();
        return;
    }

    // console.log('userID :>> ', userID);
    // console.log('action :>> ', action);

    try {
        const { method, productID } = JSON.parse(action);

        switch (method) {
            case 'delete':
                const del = knex('cart').where({ 'user_id': userID, 'product_id': productID }).del();

                // console.log('del.toSQL().sql :>> ', del.toSQL().sql);
                del.then(rows => {
                    res.json(rows);
                });

                return;

            case 'insert':
                const ins = knex('cart').insert({
                    'created_at': moment().format('YYYY-MM-DD'),
                    'product_id': productID,
                    'user_id': userID,
                    'valid': 1
                });

                // console.log('ins.toSQL().sql :>> ', ins.toSQL().sql);

                ins.then(rows => {
                    res.json(rows);
                });
                return;
            default:
                res.status(400).end();
                return;
        }
    } catch (err) {
        console.log('err :>> ', err);
    }
});

module.exports = router;