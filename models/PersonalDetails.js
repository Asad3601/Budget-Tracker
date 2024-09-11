// models/PersonalDetails.js
const mongoose = require('mongoose');

const personalDetailsSchema = new mongoose.Schema({
    about: { type: String, required: false },
    father_name: { type: String, required: false },
    education: { type: String, required: false },
    position: { type: String, required: false },
    phone_no: { type: String, required: false },
    city: { type: String, required: false },
    zip_code: { type: String, required: false },
    address: { type: String, required: false },
    website: { type: String, required: false },
    dob: { type: Date, required: false }, // Date of birth field
    // Reference to the User model
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('PersonalDetails', personalDetailsSchema);