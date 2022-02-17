// /controllers/product
const connection = require('../utils/db');

//取得全部資料
const getAll = async(req,res,next)=>{
    //全部商品
    let [data,datafileds] = await connection.execute("SELECT * FROM products LIMIT 15");
    //tags種類
    let [tags,tagsfileds] = await connection.execute("SELECT * FROM tag_status");
    //tags商品
    let [tagProduct,tagProductFileds] = await connection.execute("SELECT * FROM tag");
    // console.log('here---------')
    console.log(data);
    res.json({
        data,
        tags,
        tagProduct
    });
}
module.exports = {
    getAll,
  };