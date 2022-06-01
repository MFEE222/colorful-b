const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const knex = require('../utils/knex');

// login -> get profile from db -> generate access token and refresh token

// logout -> get profile frome db -> remove refresh token

// auth 
router.get('/auth', authenticateToken, async function (req, res) {
    const { user } = req;
    knex.select()
        .from(user)
        .where('email', user.email)
        .then(rows => {
            rows.forEach(function (row) {
                return res.json({
                    name: row.name,

                })
            });
        });
});

// token
router.post('/token', function (req, res) {

});


// login
router.post('/login', async function (req, res) {
    const { account, password } = req.body;
    // console.log('account :>> ', account);
    // console.log('password :>> ', password);
    if (!account || !password) {
        return res.sendStatus(401);
    }

    // is existed in database
    try {
        const rows = await knex.select()
            .from('users')
            .where('email', account);

        if (rows.length == 0) {
            throw new Error;
        }

        const user = rows[0];
        if (await argon2.verify(user.password, password)) {
            // generate token
            const access_token = generateAccessToken({ name: user.name, email: user.email });
            const refresh_token = generateRefreshToken({ name: user.name, email: user.email });
            // console.log('refresh_token.length :>> ', refresh_token.length);
            // write token
            const update_result = await knex('users')
                .where('email', user.email)
                .update('refresh_token', refresh_token);
            if (update_result != 1) {
                throw new Error;
            }
            return res.json({ access_token, refresh_token });
        }

    } catch (err) {
        console.log('err :>> ', err);
        return res.sendStatus(403);
    }

    // return res.status(200).send('final');
});


// middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        // console.log('user :>> ', user);
        req.user = user;
        next();
        // for test
        // res.sendStatus(200);
    });
}

// function
function generateAccessToken(payload) {
    console.log('process.env.ACCESS_TOKEN_SECRET :>> ', process.env.ACCESS_TOKEN_SECRET);
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' });
}

function generateRefreshToken(payload) {
    console.log('process.env.REFRESH_TOKEN_SECRET :>> ', process.env.REFRESH_TOKEN_SECRET);
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
}



module.exports = router;