require("dotenv").config();
require('./DB-config/db.js').DB();
const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const socket = require('./socket.js');

// Initialize Socket.io

const io = socket.init(server);
const NotificationModel = require('./models/NotificationModel.js');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const UserRoute = require('./routes/UserRoute');
const AdminRoute = require('./routes/AdminRoute');
const authenticateJWT = require('./middlewares/authenticateJWT.js');
const { stringify } = require("querystring");
app.set('view engine', 'ejs');
app.use('/media', express.static(path.join(__dirname, 'media')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authenticateJWT);
app.use(UserRoute);
app.use(AdminRoute);
app.get('/', async(req, res) => {
    if (req.user && req.user.role === 'admin') {
        // Admin user case
        res.render('index', {
            title: 'Home',
            user: req.user,
            MainView: 'admin/main-content'
        });
    } else if (req.user) {
        // Regular logged-in user case
        const notifications = await NotificationModel.find({ user: req.user._id, marksAsRead: false }).sort({ date: -1 });
        res.render('user_index', {
            title: 'Home',
            notifications, // Send notifications
            user: req.user, // Send user data
            userData: req.user,
            MainView: 'user/main-content'
        });
    } else {
        // User is not logged in
        res.render('user_index', {
            title: 'Home',
            notifications: [], // Empty notifications
            user: null, // Empty user data
            userData: null, // Empty user data
            MainView: 'user/main-content'
        });
    }
});




// let arr = [12, 32, 34, 6, 17, 19, 20, 4];
// let min = arr[0];
// let secound_min; // Initialize second_min to a large value

// for (let index = 1; index < arr.length; index++) {
//     if (arr[index] < min) {
//         // Update second_min to the current min before updating min
//         secound_min = min;
//         min = arr[index];
//         // console.log(min);
//     } else if (arr[index] > min && arr[index] < secound_min) {
//         // Update second_min only if it's greater than min and smaller than second_min
//         secound_min = arr[index];
//     }
// }

// console.log('min ', min);
// console.log('second_min ', secound_min);


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


io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', (user_id) => {
        if (user_id) {
            socket.join(user_id);
            console.log(`User with ID ${user_id} joined their room`);
        }

    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
server.listen(process.env.port_no, () => {
    console.log(`Server Runs on ${process.env.port_no}`);
})