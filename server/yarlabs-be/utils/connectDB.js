const mongoose = require('mongoose');

function connectDB() {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('Mongoose kicked in...!'))
        .catch((err) => console.log(err));
}

module.exports = connectDB;