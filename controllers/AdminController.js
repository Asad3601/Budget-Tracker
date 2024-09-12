const moment = require('moment');
const UserModel = require('../models/User');
const UserExpenses = require('../models/UserExpenses');



exports.AllUsers = async(req, res) => {
    try {
        // Fetch users with role 'user' from the database
        let users = await UserModel.find({ role: 'user' });

        // Log user information (example: logging the first name of all users)
        // users.forEach(user => console.log(user.first_name));
        // Render the view with users data
        res.render('index', {
            title: 'Users',
            user: req.user,
            users: users,
            MainView: 'admin/users'
        });
    } catch (error) {
        // Handle errors (e.g., log error, send error response)
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.AllUserExpenses = async(req, res) => {
    res.render('index', {
        title: 'Expenses',
        user: req.user,
        MainView: 'admin/expenses'
    })
}


exports.User_Expense = async(req, res) => {
    let user_id = req.params.id;

    try {
        let user = await UserModel.findById(user_id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        let user_expense = await UserExpenses.find({ user: user._id });

        // Calculate total expenses
        let totalExpenses = user_expense.reduce((acc, expense) => acc + expense.price, 0);

        // Prepare expenses with percentage used for each expense and formatted date
        let expensesWithDetails = user_expense.map(expense => ({
            ...expense._doc,
            percentage: ((expense.price / user.budget) * 100).toFixed(2),
            formattedDate: moment(expense.date).format('DD MMM YYYY') // Format the date
        }));
        // console.log(expensesWithDetails);
        // Render the view with additional information
        res.render('index', {
            title: 'Expenses',
            user_expenses: expensesWithDetails,
            user: req.user,
            userData: user,
            MainView: 'admin/user_expenses',
            totalExpenses,
            budget: user.budget,
            percentageUsed: ((totalExpenses / user.budget) * 100).toFixed(2),
            isOverBudget: totalExpenses >= user.budget // Add this flag
        });

    } catch (error) {
        console.error('Error fetching user expenses:', error);
        res.status(500).send('Server Error');
    }
};


// Route handler to add expenses
exports.AddUserExpenseByAdmin = async(req, res) => {
    const { title, price, date, user_id } = req.body;

    try {
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

        // Parse and adjust the date to discard the time part
        // Set time to midnight

        // If everything is okay, add the expense
        const user_expense = new UserExpenses({
            title,
            price,
            date: new Date(date), // Store only the date part
            user: user_id
        });

        await user_expense.save();

        res.redirect(`/user_expense/${user_id}`); // Redirect to the user expenses page
    } catch (error) {
        console.error('Error occurred during user expense creation:', error);
        res.status(500).send('Server Error');
    }
};


exports.getUserExpensesByAdmin = async(req, res) => {
    try {
        // let user_id = req.params.id;
        const user = await UserModel.findOne({ _id: req.params.id });
        // console.log(user);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Extract query parameters
        const { sort, date, search } = req.query;
        let query = { user: user._id };

        // Add date filter if provided
        if (date) {
            // End of the specific day
            query.date = new Date(date);
            // console.log(new Date(date)); // Date range query for the entire day
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

// const moment = require('moment');

// const moment = require('moment'); // Make sure moment is required

// Ensure you have moment.js included
exports.UserAnalysisByAdmin = async(req, res) => {

    try {
        const userId = req.params.id;
        const user = await UserModel.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Fetch user expenses
        let user_expenses = await UserExpenses.find({ user: user._id });

        // Convert DD-MM-YYYY to YYYY-MM-DD format


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
        res.render('index', {
            user: req.user,
            userdata: user,
            title: 'Analysis',
            MainView: 'admin/analysis',
            lineChartDates: dates, // Convert dates array to JSON string
            lineChartPrices: prices // Convert prices array to JSON string
        });
        // console.log(dates.typeof);
    } catch (error) {
        console.error('Error fetching user expenses for plot:', error);
        res.status(500).send('Server Error');
    }
};

exports.UserAnalysisBySorting = async(req, res) => {
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
        // console.log(expenses);
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


exports.UserExpenseDeleteByAdmin = async(req, res) => {
    const id = req.params.id;

    try {
        // Step 1: Find the record by ID
        let user_expense = await UserExpenses.findById(id);

        if (!user_expense) {
            return res.status(404).send('Expense not found');
        }

        // Step 2: Get the user field value
        let user = user_expense.user;

        // Step 3: Delete the record
        await UserExpenses.findByIdAndDelete(id);

        // Step 4: Redirect using the user value
        res.redirect('/user_expense');
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).send('Server Error');
    }
};