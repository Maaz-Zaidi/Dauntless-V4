const { Schema, model } = require('mongoose');

const stockSchema = new Schema({
    userId: {
        type: String,
        default: null,
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    change: {
        type: String, 
        default: "No change"
    },
    quantity: {
        type: Number,
        default: 1
    },
    history: [{
        type: Number,
        default: 0
    }]
});

module.exports = model('Stock', stockSchema);
