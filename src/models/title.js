const { Schema, model } = require('mongoose');

const titleSchema = new Schema({
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
    }
});

module.exports = model('Title', titleSchema);
