const { Schema, model } = require('../connection');
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
});

module.exports = model('users', userSchema);