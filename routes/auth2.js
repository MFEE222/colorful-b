const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const knex = require('../utils/knex');
const { default: validator } = require('validator');
const { Base64 } = require('js-base64');
const AWS = require('aws-sdk');
const res = require('express/lib/response');
const path = require('path');

// TODO: How to store refresh token on browser http-only cookie ?
// TODO: AWS SES
// TODO: Google-Sign-In

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
        const rows = await knex.select()
            .from('users')
            .where('email', account);
        // already register
        if (rows.length > 0) {
            throw new Error;
        }
    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(403);
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
            throw new Error;
        }

    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(403);
    }

    // email verify
    // const user = JSON.stringify({ email: account });
    const user = { email: account };
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
    const url = process.env.AUTH_CONFIRM_EMAIL_URL + token;
    // send email
    const result = await sendVerifyEmail(account, url);
    if (result instanceof Error) {
        return res.sendStatus(400);
    }
    console.log('result :>> ', result);
    // success
    return res.sendStatus(200);
});

router.get('/signup/:token', async function (req, res) {
    // const { base64 } = req.params;
    // console.log('base64 :>> ', base64);
    const { token } = req.params;

    // console.log('validator.isBase64(base64) :>> ', validator.isBase64(base64));
    // if (!validator.isBase64(base64)) {
    //     return res.sendStatus(401);
    // }
    let user;
    try {
        user = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('user :>> ', user);
    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(403);
    }

    // const { email } = JSON.parse(Base64.decode(base64));
    const { email } = user;
    if (!validator.isEmail(email)) {
        return res.sendStatus(403);
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
        // redirect to frontend sign in pages
    } catch (err) {
        console.log('error :>>', err);
    }

});


// token
// -> verify refresh_token and get payload(user)
// -> compare refresh_token between with database
// -> response
// router.post('/token', async function (req, res) {
router.get('/token', async function (req, res) {
    // check arg validation
    // const { token } = req.body;
    const { refresh_token } = req.cookies;
    console.log('refresh_token :>> ', refresh_token);

    if (!refresh_token) {
        return res.sendStatus(401);
    }
    // verify
    jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
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
            if (row.refresh_token != refresh_token) {
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
            // tell frontend(user) to verify email
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
            if (update_result < 1) {
                throw new Error;
            }
            // set refresh_token to cookie with http-only
            // set access_token to in-memory
            return res
                .cookie('refresh_token', refresh_token, { secure: true, httpOnly: true })
                .json({ access_token });
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
    // const { token } = req.body;
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
        return res.sendStatus(401);
    }

    try {
        const update_result = await knex('users')
            .where('refresh_token', refresh_token)
            .update('refresh_token', '');
        console.log('update_result :>> ', update_result);

        if (update_result != 1) {
            throw new Error;
        }
        return res
            .clearCookie('refresh_token')
            .sendStatus(204);
    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(403);
    }
});

// forgot password
router.post('/forgot', async function (req, res) {
    const { email, hint } = req.body;

    if (!validator.isEmail(email)) {
        return res.sendStatus(401);
    }

    // is existed in db
    try {
        const rows = await knex.select()
            .from('users')
            .where('email', account);

        // already register
        if (rows.length < 1) {
            return res.sendStatus(403);
        }
    } catch (err) {
        console.log('error :>>', err);
    }

    // verify
    const user = rows[0];
    if (await argon2.verify(user.password_hint, hint)) {
        const token = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        const url = process.env.AUTH_FORGOT_PASSWORD_URL + token;
        const result = await sendForgotPasswordEmail(user.email, url);

        if (result instanceof Error) {
            return res.sendStatus(403);
        }

        console.log('result :>> ', result);
        return res.sendStatus(200);
    } else {
        return res.sendStatus(403);
    }
});

// SSR: return reset password page for user forgot password
router.get('/forgot/:token', async function (req, res) {
    const { token } = req.params;

    let user;
    try {
        user = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('user :>> ', user);
    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(404);
    }

    return res.render('forgot', { to: process.env.AUTH_FORGOT_PASSWORD_URL + token });
});

// reset user password
router.post('/forgot/:token', async function (req, res) {
    const { token } = req.params;
    const { new_password, confirm_password } = req.body;

    let user;
    try {
        user = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('user :>> ', user);
    } catch (err) {
        console.log('error :>> ', err);
        return res.sendStatus(403);
    }

    const { email } = user;
    try {
        const rows = await knex.select()
            .from('users')
            .where('account', email);

        if (rows.length < 1) {
            throw new Error;
        }

        if (!validator.isLength(new_password, { min: 8, max: 30 }) ||
            !validator.equals(new_password, confirm_password)) {
            throw new Error;
        }

        const hash = await argon2.hash(new_password);
        console.log('hash.length :>> ', hash.length);

        const update = await knex('users')
            .where('account', email)
            .update('password', hash);

        if (update < 1) {
            throw new Error;
        }

        return res.sendStatus(200);

    } catch (err) {
        console.log('error :>>', err);
        return res.sendStatus(403);
    }
});

// TODO: reset password
// reset password
router.post('/resetpwd', async function (req, res) {

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
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
}

function generateRefreshToken(payload) {
    // console.log('process.env.REFRESH_TOKEN_SECRET :>> ', process.env.REFRESH_TOKEN_SECRET);
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
}

async function sendVerifyEmail(to, url) {
    // config credential and region from .json
    AWS.config.loadFromPath(path.join(__dirname, '../config.json'));
    console.log('AWS.Endpoint :>> ', AWS.Endpoint);

    // create sendEamil params
    const params = {
        Destination: {
            ToAddresses: [
                to,
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `<h1>Confirm your email address.</h1>
                        <p>Please click follow verification link to confirm your email in 30 min.</p>
                        <a href="${url}">${url}</a>`
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Color4 Me'
            }
        },
        Source: process.env.AWS_SES_SENDER,
    };

    // create the promise ann ses service object
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });

    try {
        const data = await ses.sendEmail(params).promise();

        return data;

    } catch (err) {
        console.log('error :>>', err);
        return err;
    }
}

async function sendForgotPasswordEmail(to, url) {
    // config credential and region
    AWS.config.loadFromPath(path.join(__dirname, '../config.json'));


    // create sendEmail params
    const params = {
        Destination: {
            ToAddresses: [
                to,
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `<h1>Reset your password.</h1>
                        <p>Please click follow link to reset your password in 30 min.
                        <a href="${url}">${url}</a>`
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Color4 Me'
            }
        },
        Source: process.env.AWS_SES_SENDER,
    };

    // create the promise and ses service object
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });

    try {
        const data = await ses.sendEmail(params).promise();

        return data;
    } catch (err) {
        console.log('error :>>', err);
        return err;
    }
}


// router.get('/env', (req, res) => {
//     console.log('process.env.ACCESS_TOKEN_SECRET :>> ', process.env.ACCESS_TOKEN_SECRET);
//     console.log('process.env.REFRESH_TOKEN_SECRET :>> ', process.env.REFRESH_TOKEN_SECRET);
//     console.log('process.env.PRODUCTION_URL :>> ', process.env.PRODUCTION_URL);
//     console.log('process.env.AWS_SES_SENDER :>> ', process.env.AWS_SES_SENDER);
//     console.log('process.env.AUTH_CONFIRM_EMAIL_URL :>> ', process.env.AUTH_CONFIRM_EMAIL_URL);
//     console.log('process.env.AUTH_FORGOT_PASSWORD_URL :>> ', process.env.AUTH_FORGOT_PASSWORD_URL);

//     res.sendStatus(200);
// });

module.exports = router;