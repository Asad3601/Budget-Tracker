const mongoose = require('mongoose');
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
        type: String,
        required: true,

        validate: {
            validator: function(value) {
                return /^\d{2}-\d{2}-\d{4}$/.test(value);
            },
            message: props => `${props.value} is not a valid date format.`
        }
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

}, {
    timestamps: true
});

// Create the model from the schema
const UserExpenses = mongoose.model('UserExpenses', userExpensesSchema);

module.exports = UserExpenses;