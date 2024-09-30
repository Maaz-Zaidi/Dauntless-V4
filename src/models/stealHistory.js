const { Schema, model } = require('mongoose');

const stealHistory = new Schema({
    userId: {
        type: String,
        required: true
    },
    history: [{
        type: {userId: String,
            heistNetGain: Number, 
            heistDate: Date,
            result: Boolean,
            probability: Number,
        },
        default: null
    }],
    totalGain: {
        type: Number,
        default: 0,
    },
    totalLoss: {
        type: Number,
        default: 0,
    }
});

module.exports = model('StealHistory', stealHistory);
