const connection = require('../utils/db');

(async function reviewsImg() {
    for (let i = 0; i < 250; i++) {
        let sql = `UPDATE reviews SET img = 'uploads/reviews/r-${
            i + 1
        }' WHERE id = ${i + 1}`;
        const [rows] = await connection.execute(sql, []);
        console.log('rows :>> ', rows);
    }
})();
