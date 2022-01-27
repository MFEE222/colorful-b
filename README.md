API (RESTful json)
---


<!-- json -->
<!-- GET / PUT / POST / DELETE -->
/api/products       :>> 返回商品列表資料
/api/product/xxx    :>> 商品細節
/api/orders         :>> 訂單列表
/api/order/xxx      :>> 訂單細節
/api/


<!-- login register -->
<!-- order search -->
<!-- product search / filter -->
<!-- favorite, cart -->
<!-- checkout -->
<!-- download -->



## 商品資料 (單純的返回、搜尋、篩選)
- method: GET
- path: /food, /wedding, /negative, /scenary, /vintage, /... 
- query: ?keyword=
> 待討論回傳資料內容要有什麼，筆數要幾筆
> 應該要有的資料：資料 data / 描述資料的資料(資料的資訊) meta data (總筆數...)

## 蒐藏商品、購物車商品（登入狀態？）
- method: GET
- path: /favorite, /cart
- query: 
<!-- app.post('/products/favoriate' function (req, res, next) {
    req.post.
}) -->

<!-- app.router('/product')

app.get('/product', function (req, res, next) {
    const keyword = req.query.keyword;

    if (query) {
        const [rows, fileds] = await connection.execute(
            'SELECT * FROM products WHERE name LIKE %:keyword%'
        )

        res.render('product', rows);
        res.json(rows);
    }

    res.sendFile('product.html');
})

app.get('/product/:series') {
    conse keyword= req.query.keyword
} -->

## 商品細節（單純返回）
- method: GET
- path: /food, /wedding, /...
- path: /id, /productname, /
- query: ...
> 待討論：資料內容、回傳筆數、資料資訊、資料庫設計

## 訂單資料（單傳返回、搜尋、篩選）

## 訂單細節（單傳返回）

## 登入
- method: POST
- path: /member/signin
> 建議使用第三方 Google / Facebook / Twitter / Line / Telegram / Discord / QQ / ...
> 取得憑證、API Key
> 可以用 email or account 登入

## 忘記、重設密碼
- method: GET / PUT
- path: /member/reset
- query: ?account="chris"&auth=MY123I343134DJIJE3 
- data: email or account
> 給這個 URL 一個過期期限

## 註冊
- method: POST / PUT
- path: /member/signup
- query:
> 註冊完成寄發系統信

## 登出
- method: POST
- path: member/logout
- query:
> 刪除 session

## 會員資料
- method: GET / POST
- path: /member
- query:
> GET 取得資料，POST 修改會員資料

## 下載 (打包壓縮、下載、stream 流)
- method: GET
- path: /download
- query: 

## 付款
- method: GET
-
> 付款完成寄發系統信

## 追蹤器
- method: PUT
- path: /trace
> 定義回傳條件，達幾次之後就回傳商品資料

## 問題
- Express 如何紀錄登入狀態（Session）?
    > Express 如何讀取、寫入 Session
    > 使用 第三方套件提供的 session 中介函式

- Express 如何接收 POST, PUT, DELETE 傳送資料？
    > 訪問 request 物件取得？

- Express 要如何動態生成 router？
    > 用 query 解決

- Node.js 伺服器要怎麼建資料庫？

## 套件
- passport