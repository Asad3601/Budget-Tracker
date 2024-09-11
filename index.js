require("dotenv").config();
require('./DB-config/db.js').DB();
const express = require('express');
const app = express();
const path = require('path');
const BodyParser = require('body-parser');
const session = require('express-session');
const CookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const UserRoute = require('./routes/UserRoute');
const AdminRoute = require('./routes/AdminRoute');
const authenticateJWT = require('./middlewares/authenticateJWT.js');
app.set('view engine', 'ejs');
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticateJWT);
app.use(UserRoute);
app.use(AdminRoute);
// app.get('/profile', (req, res) => {
//     console.log(req.user);
//     res.render('user/profile', {
//         user: req.user
//     })
// });

app.get('/', (req, res) => {
    if (req.user && req.user.role == 'admin') {
        res.render('index', {
            title: 'Home',
            user: req.user,
            MainView: 'admin/main-content'
        })
    } else {
        res.render('user_index', {
            title: 'Home',
            user: req.user,
            MainView: 'user/main-content'
        })
    }

})


// function getSecondLargest(nums) {
//     let max = 0;
//     let secoundmax = 0;
//     for (let i = 1; i <= nums.length; i++) {
//         if (nums[i] > max) {
//             secoundmax = max;
//             max = nums[i];
//         } else if (nums[i] > secoundmax && nums[i] < max) {
//             secoundmax = nums[i];
//         }
//     }
//     return secoundmax;
// }

// let nums = [10, 9, 9, 8, 8, 11, 8, 0, 9, 1];
// console.log(getSecondLargest(nums)); // Output: 5





// console.log('Start');

// setImmediate(() => {
//     console.log('Inside process.nextTick');
// });

// setTimeout(() => {
//     console.log('Inside setTimeout');
// }, 0);

// console.log('End');





app.listen(process.env.port_no, () => {
    console.log(`Server Runs on ${process.env.port_no}`);
})