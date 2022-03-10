const fs = require('fs');
const path = require('path');

// 建立資料夾
// (function () {
//     for (let i = 0; i < 132; i++) {
//         const p = path.join(
//             __dirname,
//             '../public/uploads/reviews',
//             `r-${i + 1}`
//         );
//         if (!fs.existsSync(p)) {
//             fs.mkdirSync(p);
//         }
//     }
// })();

// 隨機生成圖片

(async function () {
    // for (let i = 0; i < 132; i++) {
    // 隨機張數 1 ~ 13
    let amount = Number.parseInt(Math.ceil(Math.random() * 12));
    let files = new Array(amount);
    for (let i = 0; i < amount; i++) {
        const p = path.join(__dirname, ``);
    }
    for (let i = 0; i < 132; i++) {
        for (let j = 0; j < amount; j++) {
            src = path.join(__dirname, `../public/demo`, `${j + 1}.jpg`);
            dest = path.join(
                __dirname,
                `../public/uploads/reviews/r-${i + 1}/${j + 1}.jpg`
            );
            fs.copyFileSync(src, dest);
            // console.log(`files[${j}] :>> `, files[j]);
        }
    }
})();
