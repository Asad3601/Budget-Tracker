const mongoose = require('mongoose');
const moment = require('moment');
const { Schema } = mongoose;

// Define the UserExpenses schema
const userExpensesSchema = new Schema({
    title: {
        type: String,
        required: true,
        maxlength: 30,
        match: /^[A-Za-z\s-]+$/ // Regex to match alphabets, spaces, and hyphens
    },
    price: {
        type: Number,
        required: true,
        validate: {
            validator: function(value) {
                return /^[0-9]+$/.test(value.toString()); // Validate that price is a number
            },
            message: props => `${props.value} is not a valid number.`
        }
    },
    date: {
        type: Date, // Store the date as a Date type
        required: true,
        set: function(value) {
            // Convert the input date to UTC, ensuring only the date part is saved
            const date = new Date(value);
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        }
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

});

// Create the model from the schema
const UserExpenses = mongoose.model('UserExpenses', userExpensesSchema);

module.exports = UserExpenses;