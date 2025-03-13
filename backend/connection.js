const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGO_URL;

mongoose.connect(url)
    .then((result) => {
        console.log('Database connected');
    }).catch((err) => {
        console.log(err);
    });

module.exports = mongoose;