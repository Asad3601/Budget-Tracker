const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    otp: {
        type: String,
        required: true,
        maxlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 180 // OTP will expire after 180 seconds (3 minutes)
    }
});

const OTPModel = mongoose.model('OTP', otpSchema);

module.exports = OTPModel;