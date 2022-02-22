const compressing = require('compressing');
const path = require('path');

// 前端指定檔案
// 解析路徑
// 解析壓縮結果
// 搜尋目的資料夾是否已存在壓縮過結果
// 進行打包、壓縮 至目的資料夾
// 返回路徑給路由

// {
//     series: wedding,
//     product: a01,
// }

const compress = function (req, res, next) {
    compressing.zip
        .compressFile(
            path.join(__dirname, '../try/1.json'),
            path.join(__dirname, '../try/1.zip')
        )
        .then(function () {
            next();
        });
};

module.exports = compress;
