const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const knex = require('../utils/knex');
const { default: validator } = require('validator');
const { Base64 } = require('js-base64');

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

// sign up
router.post('/signup', async function (req, res) {
    const { name, account, password, confirm_password, hint } = req.body;

    // validate
    if (!name || !account || !password || !confirm_password) {
        return res.sendStatus(401);
    }
    if (!validator.isLength(name, { min: 1 })) {
        return res.sendStatus(401);
    }
    if (!validator.isEmail(account)) {
        return res.sendStatus(401);
    }
    if (!validator.isLength(password, { min: 8, max: 30 }) ||
        !validator.equals(password, confirm_password)) {
        return res.sendStatus(401);
    }
    if (!validator.isLength(hint, { min: 0, max: 10 })) {
        return res.sendStatus(401);
    }
    // is existed in db ?
    try {
        const rows = knex.select()
            .from('users')
            .where('email', account);
        // already register
        if (rows.length < 1) {
            return res.sendStatus(403);
        }
    } catch (err) {
        console.log('error :>>', err);
    }

    // hash
    const hash_password = await argon2.hash(password);
    const hash_hint = await argon2.hash(hint);
    console.log('hash_password.length :>> ', hash_password.length);
    console.log('hash_hint.length :>> ', hash_hint.length);

    // store to db
    try {
        const insert = await knex('users')
            .insert({
                name: name,
                account: account,
                email: account,
                password: hash_password,
                password_hint: hash_hint,
                registered: 0,
            });
        // console.log('insert :>> ', insert);
        if (insert.length < 1) {
            return res.sendStatus(403);
        }

    } catch (err) {
        console.log('error :>>', err);
    }

    // email verify
    const user = JSON.stringify({ email: account });
    const encoded = Base64.encode(user);
    const url = 'http://localhost:3003/api/auth/signup/' + encoded;
    // send email
    return res.send(url);

    // response
    return res.sendStatus(200);
});

router.get('/signup/:base64', async function (req, res) {
    const { base64 } = req.params;
    // console.log('base64 :>> ', base64);

    // console.log('validator.isBase64(base64) :>> ', validator.isBase64(base64));
    if (!validator.isBase64(base64)) {
        return res.sendStatus(401);
    }

    const { email } = JSON.parse(Base64.decode(base64));
    if (!validator.isEmail(email)) {
        return res.sendStatus(401);
    }

    // update db
    try {
        const update = await knex('users')
            .where('email', email)
            .update('registered', 1);
        console.log('update :>> ', update);
        if (update < 1) {
            return res.sendStatus(403);
        }

        return res.sendStatus(200);
    } catch (err) {
        console.log('error :>>', err);
    }

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


// sign in
// -> verify account and password (argon2)
// -> generate access_token and refresh_token
// -> update refresh_token on user of database
// -> response
router.post('/signin', async function (req, res) {
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

        // unverify email
        // console.log('user.registered :>> ', user.registered);
        if (!user.registered) {
            return res.sendStatus(403);
        }

        // confirm password
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

// sign out
// -> remove user's refresh_token in database
// -> response
router.delete('/signout', async function (req, res) {
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