const jwt = require('jsonwebtoken');
const UserModel = require('../models/User'); // Adjust the path to your UserModel

const authenticateJWT = async(req, res, next) => {
    const token = req.cookies.jwt || req.headers.authorization; // Check both cookie and header

    if (!token) {
        return next();
    } // If no token, continue without attaching user

    jwt.verify(token, process.env.JWT_SECRET, async(err, decoded) => {
        if (err) return res.redirect('/');

        // Fetch user from database based on ID in token
        req.user = await UserModel.findById(decoded.userId).populate('personalDetails');
        // await UserModel.findById(user_id).populate('personalDetails');

        // Adjust fields as needed
        next();
    });
};

module.exports = authenticateJWT;