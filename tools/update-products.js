const connection = require('../utils/db');

// const letter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

// const count = [0, 0, 0, 0, 0, 0, 0];

const img = [
    '',
    '',
    'images/food/',
    'images/wedding/',
    'images/film/',
    'images/scenery/',
    'images/portrait',
];

// 更新商品資料目錄
// (async function () {
//     try {
//         for (let i = 2; i < 7; i++) {
//             await connection.execute(
//                 'UPDATE products SET img = ? WHERE product_series_id = ?',
//                 [img[i], i]
//             );
//         }
//     } catch (err) {
//         console.log('err :>> ', err);
//     }
// })();
