const { Schema, model } = require('mongoose');

const equipmentSchema = new Schema({
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
    rank: {
        type: String,
        enum: ['D','C', 'B', 'A', 'S'], // You can modify this
        required: true
    },
    price: {
        type: Number,
        default: 0
    },
    type: {
        type: String, 
        required: true
    },
    boost: { // Only for equipment that boosts levels
        type: {
            labor: Number,
            hunting: Number,
            luck: Number, 
            strength: Number,
            mentality: Number, 
            dexterity: Number,
            defense: Number,
            hp: Number, 
            stamina: Number,
            combat: Number,
        },
        default: {
            labor: 0,
            hunting: 0,
            luck: 0, 
            strength: 0,
            mentality: 0, 
            dexterity: 0,
            defense: 0,
            hp: 0, 
            stamina: 0,
            combat: 0,
        }
    },
    //only for weapons
    scaling: {
        type: String,
        enum: ['strength','dexterity', 'defense', 'luck', 'combat'], // You can modify this
        default: 'combat',
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

module.exports = model('Equipment', equipmentSchema);
