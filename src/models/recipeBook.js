const { Schema, model } = require('mongoose');

const recipeBookSchema = new Schema({
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
    recipes: [{
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
    }],
    price: {
        type: Number, 
        default: 1
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

module.exports = model('RecipeBook', recipeBookSchema);