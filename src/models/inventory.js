const { Schema, model } = require('mongoose');

const inventorySchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    equipment: [{
        type: Schema.Types.ObjectId,
        ref: 'Equipment'
    }],
    usables: [{
        type: Schema.Types.ObjectId,
        ref: 'Usable'
    }],
    materials: [{
        type: Schema.Types.ObjectId,
        ref: 'Material'
    }],
    recipeBooks: [{
        type: Schema.Types.ObjectId,
        ref: 'RecipeBook'
    }],
    spells: [{
        type: Schema.Types.ObjectId,
        ref: 'Spell'
    }],
    titles: [{
        type: Schema.Types.ObjectId,
        ref: 'Title'
    }],
    stocks: [{
        type: Schema.Types.ObjectId,
        ref: 'Stock'
    }],
});

module.exports = model('Inventory', inventorySchema);