const { Schema, model } = require('mongoose');

const questSchema = new Schema({
    userId: {
        type: String,
        default: null,
    },
    description:{
        type: String,
        default: "",
    },
    itemName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    date:{
        type: Date,
        default: new Date()
    },
    completed: {
        type: Boolean,
        default: false,
    },
    reward: {
        type: Number,
        required: true
    }
});

module.exports = model('Quest', questSchema);
