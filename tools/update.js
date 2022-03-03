const connection = require('../utils/db');

(async function () {
    const sql = 'UPDATE `products` SET `review_counts` = ? ';

    connection.execute(sql, [Math.random()]);
    // for (let i = 0; i < 50; i++) {
    //     const val = Math.random() * 150;
    //     connection.execute(sql, [val]);
    // }
})();
