const { Schema, model } = require('mongoose');

const spellSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    rank: {
        type: String,
        enum: ['D','C', 'B', 'A', 'S'], // You can modify this
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    //attack (shield/heal hp/heal stamina/buff/debuff/negate/reversal)
    type: {
        type: String, 
        required: true
    },
    spellApplication: { // Only for equipment that boosts levels
        type: {
            hp: Number, 
            stamina: Number,
            turns: Number, 
            combat: Number,
            slot: Number,
            reversal: Boolean,
            passive: Boolean,
        },
        default: null
    },
    market: {
        type: Boolean,
        default: false
    }
});

module.exports = model('Spell', spellSchema);
