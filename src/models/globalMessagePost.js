const { Schema, model } = require('mongoose');

const globalMessagePostSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    price: {
        type: Number, 
        required: true
    },
    postDate: {
        type: Date, 
        default: new Date()
    }

});

module.exports = model('GlobalMessagePost', globalMessagePostSchema);
