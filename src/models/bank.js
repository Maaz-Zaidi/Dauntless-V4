const { Schema, model } = require('mongoose');

const bankSchema = new Schema({
    name: {
        type: String,
        default: "Dauntless"
    },
    balance: {
        type: Number,
        default: 100000,
    },
    lottery: {
        type: Number, 
        default: 50000
    },
    tax: { //percentage
        type: Number, 
        default: 20
    },
    event: {
        type: String,
        default: "No event so far",
    },
    item1: {
        itemId: {
            type: Schema.Types.ObjectId,
            ref: 'Material'
        },
        price: {
            type: Number,
            required: true,
        }
    },
    item2: {
        itemId: {
            type: Schema.Types.ObjectId,
            ref: 'Material'
        },
        price: {
            type: Number,
            required: true,
        }
    },
    item3: {
        itemId: {
            type: Schema.Types.ObjectId,
            ref: 'Material'
        },
        price: {
            type: Number,
            required: true,
        }
    },
    marketUpdateDate: {
        type: Date,
        default: new Date()
    },

});

module.exports = model('Bank', bankSchema);
