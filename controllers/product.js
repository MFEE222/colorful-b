// /controllers/product
const connection = require('../utils/db');

//取得全部資料
const getAll = async(req,res,next)=>{
    let [data,fileds] = await connection.execute("SELECT * FROM products ORDER BY id DESC LIMIT 16");
    // console.log('here---------')
    console.log(data);
    res.json(data);
}
module.exports = {
    getAll,
  };