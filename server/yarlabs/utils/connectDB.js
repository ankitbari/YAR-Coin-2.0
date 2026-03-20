const mongoose = require('mongoose');

const { MONGO_URI } = require('./env');

function connectDB() {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('Mongoose kicked in...!'))
        .catch((err) => console.log(err));
}

module.exports = connectDB;