const connection = require('../utils/db');

(async function () {
    let sql = `UPDATE reviews SET product_id =  ? WHERE product_id > 43`;
    const res = await connection.execute(sql, [26]);
    // console.log('res :>> ', res);
})();
