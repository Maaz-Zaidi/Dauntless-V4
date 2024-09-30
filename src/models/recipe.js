const { Schema, model } = require('mongoose');

const recipeSchema = new Schema({
    userId: {
        type: String,
        default: null,
    },
    items: {
        type: [{
            item: String,
            quantity: Number,
        }],
        required: true
    },
    resultingItem: {
        type: String,
        required: true
    }
});

module.exports = model('Recipe', recipeSchema);
