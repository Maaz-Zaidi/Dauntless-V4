const { Schema, model } = require('mongoose');

const effectSchema = new Schema({
    userId: {
        type: String,
        default: null,
    },
    name: {
        type: String,
        required: true
    },
    timeUsed: {
        type: Date,
        default: new Date()
    },
    useTime: { //in minutes
        type: Number,
        default: 1
    },
    effectedType: {
        type: String,
        enum: ['Work', 'Gambling', 'Hunt', 'Steal', 'Addition', 'Subtraction', 'Buff'], // You can modify this
        required: true
    },
    relativeAttribute: {
        type: String, 
        default: null
    },
    relativeValue: {
        type: Number, 
        default: null
    }
    

});

module.exports = model('Effect', effectSchema);
