const UserModel = require('../models/User');
const OTPModel = require('../models/OTPModel');
const PersonalDetails = require('../models/PersonalDetails');
const UserExpenses = require('../models/UserExpenses');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const moment = require('moment');
const socket = require('socket.io');
const otpgenerator = require('otp-generator');
const { body, validationResult } = require('express-validator');
const NotificationModel = require('../models/NotificationModel');


exports.UserRegisterForm = (req, res) => {
    res.render('register', {
        errors: ''
    });
}

exports.UserLoginForm = (req, res) => {
    res.render('login');
}


// Register User Controller
exports.RegisterUser = [
    // Validation Rules
    body('first_name')
    .notEmpty().withMessage('First Name is required')
    .isLength({ max: 50 }).withMessage('First Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s\-]+$/).withMessage('First Name can only contain alphabets, spaces, and hyphens'),
    body('last_name')
    .notEmpty().withMessage('Last Name is required')
    .isLength({ max: 50 }).withMessage('Last Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s\-]+$/).withMessage('Last Name can only contain alphabets, spaces, and hyphens'),
    body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
    body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage('Password must contain at least 8 characters, including alphabets, numbers, and special characters'),
    body('confirm_password')
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
    body('budget').notEmpty().withMessage('Enter Your Budget'),

    // Handle form submission
    async(req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.render('register', {
                title: 'Register',
                errors: errors.array(),
                userData: req.body
            });
        }

        try {
            const { first_name, last_name, email, password, budget } = req.body;
            const newUser = new UserModel({
                first_name,
                last_name,
                email,
                password,
                budget // Make sure to hash the password before saving
            });
            // Create a new user
            if (req.user && req.user.role === 'admin') {
                // Save the user
                await newUser.save();
                return res.redirect('/users');
            }

            // Save the user
            await newUser.save();

            // Redirect or respond with success
            res.redirect('/login'); // Redirect to login or another page after successful registration
        } catch (error) {
            console.error('Error occurred during user registration:', error);
            res.status(500).send('Server Error');
        }
    }
];



exports.LoginUser = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await UserModel.findOne({ email });

        if (!user) {
            res.render('login', { message: 'Plz Register Your Self' })
        } else {
            if (user.password == password) {
                const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.cookie('jwt', token, { httpOnly: true });
                res.redirect('/');
            } else {
                res.render('login', { message: 'Your Enter Incorrect Password' })
            }
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Server Error');
    }
};

exports.LogoutUser = (req, res) => {
    res.clearCookie('jwt'); // Clear the JWT cookie
    res.redirect('/login');
}


exports.ForgetPassword = async(req, res) => {
    res.render('user/forget-password');
}

exports.ForgetPasswordVerify = async(req, res) => {
    try {
        const email = req.body.email;
        if (email) {
            const user = await UserModel.findOne({ email });
            if (user) {
                let otpcode = otpgenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
                const userotps = await OTPModel.findOne({ user: user._id });
                if (!userotps) {
                    const userotp = new OTPModel({
                        user: user._id,
                        otp: otpcode
                    })
                    await userotp.save();
                    SendPasswordRestEmail(user.first_name, user.email, otpcode);
                    res.render('user/otp', { message: 'Plz check your Email for OTP Code and Enter This' })
                } else {
                    res.render('user/otp', { message: 'Already OTP Are Send On Email' });
                }

            } else {
                res.render('user/forget-password', { message: "Your Email is Not Regsitered" });
            }

        }
    } catch (err) {
        console.log(err.message)
    }
}

const SendPasswordRestEmail = async(first_name, email, token) => {
    const transport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.admin_email,
            pass: process.env.admin_password,
        }
    })
    const mailoptions = {
        from: process.env.admin_email,
        to: email,
        subject: "Password Reset Request", // Corrected subject
        html: `
            <p>Hi <b>${first_name}</b>,</p>
            <p>Click the link below to reset your password:</p>
            <p>This is your OTP Code <b>${token}</b></p>
            <p>This OTP Code Will Expire in 3 Mints</p>
        `
    };

    transport.sendMail(mailoptions, (info, err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Email Send');
        }
    })
}

exports.OTPCodeVerify = async(req, res) => {
    try {
        const otp = req.body.otp;
        if (otp) {
            const checkotp = await OTPModel.findOne({ otp: otp });
            if (checkotp && checkotp.otp == otp) {
                res.render('user/reset_password', { user_id: checkotp.user });
            } else {
                res.render('user/otp', { message: 'Your OTP Code does not match!' });
            }
        } else {
            res.render('user/otp', { message: 'Please enter the OTP code.' });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }
};
exports.PasswordReset = [
    // Validation rules
    body('password1')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage('Password must contain alphabets, numbers, and special characters'),
    body('password2')
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => value === req.body.password1).withMessage('Passwords do not match'),

    // Controller logic
    async(req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // If there are validation errors, render the form again with error messages
                return res.render('user/reset_password', {
                    message: errors.array().map(error => error.msg).join(', '),
                    user_id: req.body.user_id
                });
            }

            const { user_id, password1 } = req.body;
            const user = await UserModel.findOne({ _id: user_id });

            if (!user) {
                return res.render('user/reset_password', { message: 'User not found.', user_id });
            }
            // Update the user's password
            await UserModel.findByIdAndUpdate(user_id, { password: password1 });

            // Delete the OTP record after successful password reset
            await OTPModel.deleteOne({ user: user_id });

            // Redirect to the login page after successful password reset
            res.redirect('/login');
        } catch (error) {
            console.error('Error during password reset:', error.message);
            // Handle the error and provide feedback to the user
            res.status(500).render('user/reset_password', { message: 'An error occurred. Please try again.', user_id: req.body.user_id });
        }
    }
];


exports.UserProfile = async(req, res) => {
    const notifications = await NotificationModel.find({ user: req.user._id, marksAsRead: false }).sort({ date: -1 });
    res.render('user/profile', {
        user: req.user,
        notifications
    })
}


exports.PersonalDetails = async(req, res) => {
    const { user_id, first_name, last_name, ...details } = req.body;

    try {
        // Update User first_name and last_name
        const user = await UserModel.findByIdAndUpdate(user_id, {
            $set: {
                first_name,
                last_name
            }
        }, { new: true });

        // Find and update or create PersonalDetails
        let userPersonalDetails = await PersonalDetails.findOne({ user: user_id });

        if (userPersonalDetails) {
            // Update existing personal details
            userPersonalDetails = await PersonalDetails.findOneAndUpdate({ user: user_id }, { $set: {...details } }, { new: true });
        } else {
            // Create new personal details
            userPersonalDetails = new PersonalDetails({
                user: user_id,
                ...details
            });
            await userPersonalDetails.save();

            // Link personal details to the user
            user.personalDetails = userPersonalDetails._id;
            await user.save();
        }

        // Populate personal details in the user object
        const populatedUser = await UserModel.findById(user_id).populate('personalDetails').exec();

        // Render the profile page with user data
        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.EditProfileForm = async(req, res) => {
    const notifications = await NotificationModel.find({ user: req.user._id, marksAsRead: false }).sort({ date: -1 });
    res.render('user/edit-profile', {
        user: req.user,
        notifications

    });
}


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'media');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const user_upload = multer({ storage: storage });
exports.user_upload = user_upload;


exports.UpdateProfilePic = async(req, res) => {
    try {
        const image = req.file ? req.file.filename : null;
        const user = req.user;
        await UserModel.findByIdAndUpdate({ _id: user._id }, { $set: { image: image } }, { new: true });
        res.redirect('/profile');
    } catch (error) {

    }
}



exports.AddUserExpense = async(req, res) => {

    try {
        const { title, price, date, user_id } = req.body;

        // Find the user and update their budget
        const user = await UserModel.findById(user_id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        let user_expenses = await UserExpenses.find({ user: user._id });
        let totalExpenses = user_expenses.reduce((acc, expense) => acc + expense.price, 0);

        // Check if adding the new expense will exceed the budget
        if (totalExpenses + parseFloat(price) > user.budget) {
            return res.status(400).send('Expenses exceed the budget!');
        }
        // Check if an expense already exists for the user on the given date
        const existingExpense = await UserExpenses.findOne({
            user: user_id,
            date: new Date(date)
        });

        if (existingExpense) {
            // If an expense exists, return an error
            return res.status(400).send('An expense for this date already exists.');
        }

        // Update the user’s budget

        // Create and save the new user expense
        const user_expense = new UserExpenses({
            title,
            price,
            date: new Date(date), // Save the formatted date
            user: user_id
        });

        await user_expense.save();

        // Redirect or respond with success
        res.redirect('/user_expenses'); // Redirect to another page or handle success
    } catch (error) {
        console.error('Error occurred during user expense creation:', error);
        res.status(500).send('Server Error');
    }
};



exports.UserExpenses = async(req, res) => {
    try {
        let user = req.user;
        if (!user) {
            return res.status(404).send('User not found');
        }

        let user_expenses = await UserExpenses.find({ user: user._id });

        // Calculate total expenses
        let totalExpenses = user_expenses.reduce((acc, expense) => acc + expense.price, 0);
        const notifications = await NotificationModel.find({ user: req.user._id, marksAsRead: false }).sort({ date: -1 });
        // Prepare expenses with percentage used for each expense
        let expensesWithPercentage = user_expenses.map(expense => ({
            ...expense._doc,
            percentage: ((expense.price / user.budget) * 100).toFixed(2),
            formattedDate: moment(expense.date).format('DD MMM YYYY')
        }));

        // Controller
        res.render('user_index', {
            title: 'User Expenses',
            user_expenses: expensesWithPercentage,
            user,
            userData: req.user,
            notifications,
            MainView: 'user/user_expenses',
            totalExpenses,
            budget: user.budget,
            percentageUsed: ((totalExpenses / user.budget) * 100).toFixed(2),
            isOverBudget: totalExpenses >= user.budget // Add this flag
        });

    } catch (error) {
        console.error('Error fetching user expenses:', error);
        res.status(500).send('Server Error');
    }
}
exports.getUserExpenses = async(req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Extract query parameters
        const { sort, date, search } = req.query;
        let query = { user: user._id };

        // Add date filter if provided
        if (date) {
            query.date = new Date(date); // Use formatted date directly
        }

        // Add search filter if provided
        if (search) {
            const priceSearch = parseInt(search);
            // Convert search to float
            if (!isNaN(priceSearch)) {
                // If search is a valid number, search by price or title
                query.$or = [
                    { title: { $regex: search, $options: 'i' } }, // Case-insensitive search on title
                    { price: priceSearch } // Exact match on price
                ];
            } else {
                // If search is not a number, only search by title
                query.title = { $regex: search, $options: 'i' }; // Case-insensitive search on title
            }
        }

        // Fetch user expenses based on the query
        let user_expenses = await UserExpenses.find(query);

        // Convert DD-MM-YYYY to sortable format YYYY-MM-DD


        // Apply sorting
        if (sort) {
            switch (sort) {
                case 'date_asc':
                    user_expenses = user_expenses.sort((a, b) => new Date(b.date) - new Date(a.date)); // Oldest to newest
                    break;
                case 'date_desc':
                    user_expenses = user_expenses.sort((a, b) => new Date(a.date) - new Date(b.date)); // Newest to oldest
                    break;
                case 'price_asc':
                    user_expenses.sort((a, b) => b.price - a.price); // Lowest to highest
                    break;
                case 'price_desc':
                    user_expenses.sort((a, b) => a.price - b.price); // Highest to lowest
                    break;
            }
        }

        // Calculate total expenses
        let totalExpenses = user_expenses.reduce((acc, expense) => acc + expense.price, 0);

        // Prepare expenses with percentage used for each expense
        let expensesWithPercentage = user_expenses.map(expense => ({
            ...expense._doc,
            percentage: ((expense.price / user.budget) * 100).toFixed(2),
            formattedDate: moment(expense.date).format('DD MMM YYYY')
        }));

        // Respond with JSON data
        res.json({
            expenses: expensesWithPercentage,
            budget: user.budget,
            totalExpenses: totalExpenses,
            isOverBudget: totalExpenses >= user.budget // Add this flag
        });

    } catch (error) {
        console.error('Error fetching user expenses:', error);
        res.status(500).send('Server Error');
    }
};




exports.UserAnalysis = async(req, res) => {
    try {

        const user = req.user;

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Fetch user expenses
        let user_expenses = await UserExpenses.find({ user: user._id });

        // Convert DD-MM-YYYY to YYYY-MM-DD format

        const notifications = await NotificationModel.find({ user: req.user._id, marksAsRead: false }).sort({ date: -1 });
        // Prepare data arrays for line chart
        const dates = [];
        const prices = [];

        user_expenses.forEach(expense => {
            try {
                dates.push(expense.date);
                prices.push(expense.price);
            } catch (error) {
                console.error(`Error converting date: ${expense.date}, error`);
            }
        });

        // Render the view and pass the line chart data
        res.render('user_index', {
            user,
            userData: req.user,
            notifications,
            title: 'Analysis',
            MainView: 'user/user_analysis',
            lineChartDates: dates, // Convert dates array to JSON string
            lineChartPrices: prices // Convert prices array to JSON string
        });
        // console.log(dates.typeof);
    } catch (error) {
        console.error('Error fetching user expenses for plot:', error);
        res.status(500).send('Server Error');
    }
};

exports.AnalysisBySorting = async(req, res) => {
    try {
        const { range, userId } = req.query;
        let months = 4; // Default is last 4 months

        // Set the months based on the selected range
        if (range === 'last_8months') months = 8;
        else if (range === 'last_12months') months = 12;

        // Fetch all user expenses
        const userExpenses = await UserExpenses.find({ user: userId }).sort({ date: 1 }); // Sort in ascending order
        if (!userExpenses.length) {
            return res.json({ success: false, message: 'No expense records found' });
        }

        // Get the latest expense date as the `endDate`
        const latestExpense = userExpenses[userExpenses.length - 1]; // Last record in the sorted array
        const endDate = moment(latestExpense.date).endOf('day').toDate(); // Use the end of the day for the latest d
        console.log(endDate);
        // Calculate `startDate` by subtracting the number of months
        const startDate = moment(endDate).subtract(months, 'months').startOf('month').toDate();
        console.log(startDate);
        // Fetch expenses between `startDate` and `endDate`
        const expenses = await UserExpenses.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }); // Sort by date ascending
        // Extract dates and prices for the chart
        const lineChartDates = expenses.map(exp => moment(exp.date).format('DD MMM YYYY')); // Format date as "22 Jun 2024"
        const lineChartPrices = expenses.map(exp => exp.price);

        // Send response
        res.json({ success: true, lineChartDates, lineChartPrices });
    } catch (error) {
        console.error('Error in UserAnalysisBySorting:', error);
        res.json({ success: false, message: 'Failed to retrieve expenses data' });
    }
};

exports.UserExpenseDeleteById = async(req, res) => {
    const id = req.params.id;
    await UserExpenses.findByIdAndDelete({ _id: id });
    res.redirect('/user_expenses');
};

exports.UpdateUserExpense = async(req, res) => {
    let user_id = req.user._id;
    let { title, price, date, expense_id } = req.body;
    let user = await UserModel.findById(user_id);
    if (!user) {
        return res.status(404).send('User not found');
    }

    let user_expenses = await UserExpenses.find({ user: user._id });
    let totalExpenses = user_expenses.reduce((acc, expense) => acc + expense.price, 0);

    // Check if adding the new expense will exceed the budget
    if (totalExpenses + parseFloat(price) > user.budget) {
        return res.status(400).send('Expenses exceed the budget!');
    }
    let expense = await UserExpenses.findByIdAndUpdate(expense_id, {
        $set: {
            title,
            price,
            date: new Date(date)
        }
    }, {
        new: true
    });
    res.redirect('/user_expenses');


}

exports.NotificationsMarksAsRead = async(req, res) => {
    try {
        const userId = req.user._id; // Assuming you're storing the user's ID in the session

        // Update all notifications for the user to mark them as read
        await NotificationModel.updateMany({ user: userId }, { marksAsRead: true });

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};