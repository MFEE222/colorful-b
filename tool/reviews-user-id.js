const connection = require('../utils/db');

(async function reviewsImg() {
    let sql = `UPDATE reviews SET user_id = 260 WHERE id > 120 AND id < 133`;
    const res = await connection.execute(sql, []);
    console.log('res :>> ', res);
})();
