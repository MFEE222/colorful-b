const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const knex = require('../utils/knex');


// auth
// -> verify access_token and get payload (user)
// -> compare payload(user) to row of database
// -> response
router.get('/', authenticateToken, async function (req, res) {
    const { user } = req;
    // check user profile in db
    try {
        const rows = await knex.select()
            .from('users')
            .where('email', user.email);
        // console.log('rows :>> ', rows);
        if (rows.length == 0) {
            throw new Error;
        }

        return res.sendStatus(200);

    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(403);
    }
});

// register
router.post('/register', async function (req, res) {

});

// token
// -> verify refresh_token and get payload(user)
// -> compare refresh_token between with database
// -> response
router.post('/token', async function (req, res) {
    // check arg validation
    const { token } = req.body;
    if (!token) {
        return res.sendStatus(401);
    }
    // verify
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);

        try {

            const rows = await knex.select()
                .from('users')
                .where('email', user.email);

            if (rows.length == 0) {
                throw new Error;
            }
            const row = rows[0];
            // console.log('row.refresh_token :>> ', row.refresh_token);
            if (row.refresh_token != token) {
                throw new Error;
            }

            // return new access token
            return res.json({ access_token: generateAccessToken({ name: user.name, email: user.email }) });

        } catch (err) {
            console.log('err :>> ', err);
            return res.sendStatus(403);
        }
    });
});


// login
// -> verify account and password (argon2)
// -> generate access_token and refresh_token
// -> update refresh_token on user of database
// -> response
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

});

// logout
// -> remove user's refresh_token in database
// -> response
router.delete('/logout', async function (req, res) {
    const { token } = req.body;
    if (!token) {
        return res.sendStatus(401);
    }

    try {
        const update_result = await knex('users')
            .where('refresh_token', token)
            .update('refresh_token', '');
        console.log('update_result :>> ', update_result);
        if (update_result != 1) {
            throw new Error;
        }

        return res.sendStatus(204);
    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(403);
    }
});

// middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        console.log('user :>> ', user);
        req.user = user;
        next();
        // for test
        // res.sendStatus(200);
    });
}

// function
function generateAccessToken(payload) {
    // console.log('process.env.ACCESS_TOKEN_SECRET :>> ', process.env.ACCESS_TOKEN_SECRET);
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '20s' });
}

function generateRefreshToken(payload) {
    // console.log('process.env.REFRESH_TOKEN_SECRET :>> ', process.env.REFRESH_TOKEN_SECRET);
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
}

module.exports = router;