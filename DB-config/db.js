const mongoose = require('mongoose');


exports.DB = () => {
    mongoose.connect(process.env.database)
        .then((con) => {
            console.log("Connect With DB");
        })
        .catch((err) => {
            console.log("Not Connect WIth DB");
        })
}