const { Schema, model } = require('mongoose');

const materialSchema = new Schema({
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
    quantity: {
        type: Number,
        default: 1
    },
    market: {
        type: Boolean,
        default: false
    }
});

module.exports = model('Material', materialSchema);
