const { Schema, model } = require('mongoose');

const usableSchema = new Schema({
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
    },
    consumable:{
        type: Boolean,
        default: false
    },
    effect:{
        type: Schema.Types.ObjectId,
        ref: 'Effect',
    }
});

module.exports = model('Usable', usableSchema);
