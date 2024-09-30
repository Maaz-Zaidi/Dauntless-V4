const { Schema, model } = require('mongoose');

const monsterSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    rarity: {
        type: String,
        enum: ['D','C', 'B', 'A', 'S'], // You can modify this
        required: true
    },
    appearanceRate: {
        type: Number, // A percentage value, for example: 10 for 10%
        required: true
    },
    levelRequirement: {
        type: Number,
        required: true
    },
    drops: [{
        type: Schema.Types.ObjectId,
        ref: 'Material'
    }],
    lowXP:{
        type: Number,
        required: true
    },
    highXP:{
        type: Number,
        required: true
    },
    boss:{
        type: Boolean,
        default: false
    },
    health:{
        type: Number, 
        default: 100
    },
    attackOptions:[{
        type: String,
        default: ""
    }],
    highDamage:{
        type: Number,
        default: 1
    },
    lowDamage:{
        type: Number,
        default: 1
    },
    negate: {
        type: Boolean,
        default: false
    },
    negateChance:{
        type: Number,
        default: 0
    },
    pic:{
        type: String,
        default: ""
    }
    
});

module.exports = model('Monster', monsterSchema);
