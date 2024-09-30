const { Schema, model } = require('mongoose');

const forgingTableSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    materials: [{
        itemId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'materials.refModel'
        },
        refModel: {
            type: String,
            required: true,
            enum: ['Material', 'Equipment', 'Usable', 'Spell'] // Allowed models
        }
    }],
});

module.exports = model('Table', forgingTableSchema);
