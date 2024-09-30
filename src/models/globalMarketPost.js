const { Schema, model } = require('mongoose');

const globalMarketPostSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    bidItem: {
        type: String,
        required: true
    },
    bidUser: {
        type: String,
        required: true
    },
    item: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'onModel' // This will point to the name of the model the ObjectId refers to.
    },
    onModel: {
        type: String,
        required: true,
        enum: ['Equipment', 'Material', 'Usable', "RecipeBook"]  // Add other model names as needed.
    },
    saleTimeStamp: {
        type: Date,
        default: new Date()
    },
    saleEnd: {
        type: Number, 
        default: 1
    },
    quantity: {
        type: Number, 
        default: 1,
    },
    price: {
        type: Number, 
        required: true 
    },
    bids: [{
        type: {userId: String,
            bid: Number, 
            bidTimeStamp: Date,
        },
        default: null
    }]
});

module.exports = model('GlobalMarketPost', globalMarketPostSchema);
