const res = require('express/lib/response');
const connection = require('../utils/db');

const getDownload = function (req, res, next) {
    console.log('req.query :>> ', req.query);
};
