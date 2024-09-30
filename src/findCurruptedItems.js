const Equipment = require("./models/equipment");
const Material = require("./models/material");
const Usable = require("./models/usable");
const Inventory = require("./models/inventory");
const User = require("./models/user");
const Stock = require("./models/stock");
const RecipeBook = require("./models/recipeBook");


async function findCorruptedItems() {
    const inventories = await Inventory.find();

    for (const inventory of inventories) {
        await checkItemsCorruption(Material, 'materials', inventory.userId);
        await checkItemsCorruption(Equipment, 'equipment', inventory.userId);
        await checkItemsCorruption(Usable, 'usables', inventory.userId);
        await checkItemsCorruption(Stock, 'stocks', inventory.userId);
        await checkItemsCorruption(RecipeBook, 'recipeBooks', inventory.userId);

    }
    
    // Additional check for the User's equipment
    const users = await User.find();
    for (const user of users) {
        await checkUserEquipmentCorruption(user);
    }
}

async function checkItemsCorruption(Model, fieldName, userId) {
    const userItems = await Model.find({ userId });
    const baseItems = await Model.find({ userId: null });
    const userInventory = await Inventory.findOne({ userId });

    // 1. Check if the user's items have a corresponding base item
    for (const item of userItems) {
        const hasBaseItem = baseItems.some(baseItem => baseItem.name === item.name);
        if (!hasBaseItem) {
            console.log(`Corrupted ${fieldName}: ${item.name} (ID: ${item.id}) of User ${userId} doesn't have a corresponding base item.`);
        }
    }

    // 2. Check if the items exist in the user's inventory and remove any that don't exist in the collection
    for (let i = 0; i < userInventory[fieldName].length; i++) {
        const itemId = userInventory[fieldName][i];
        const itemExists = userItems.some(item => item.id === itemId.toString());
        if (!itemExists) {
            console.log(`Corrupted ${fieldName}: ID ${itemId} in User ${userId}'s inventory doesn't exist in the ${fieldName} collection. Removing it from inventory...`);
            userInventory[fieldName].splice(i, 1);
            i--;  // Adjust the index due to the removal
        }
    }

    // 3. Check if all items in the collection exist in the user's inventory and add any that are missing
    for (const item of userItems) {
        const existsInInventory = userInventory[fieldName].includes(item.id.toString());
        if (!existsInInventory) {
            console.log(`Corrupted ${fieldName}: ${item.name} (ID: ${item.id}) of User ${userId} exists in the collection but not in the user's inventory. Adding it to inventory...`);
            userInventory[fieldName].push(item.id);
        }
    }

    await userInventory.save();  // Save the updated user inventory
}




async function checkUserEquipmentCorruption(user) {
    const equipmentFields = ['ring1', 'ring2', 'ring3', 'ring4', 'ring5', 'weapon', 'chest', 'head', 'arms', 'legs'];
    
    for (const fieldName of equipmentFields) {
        const equipmentId = user[fieldName];
        
        if (equipmentId) {
            const equipmentItem = await Equipment.findById(equipmentId);
            
            // Check if the equipment item exists
            if (!equipmentItem) {
                console.log(`Corrupted equipment: ID ${equipmentId} in User ${user.userId}'s ${fieldName} slot doesn't exist in the Equipment collection.`);
                continue;  // If the item doesn't exist, we can't perform further checks for this item
            }

            // Check if the equipment item's ID is prefixed with "E" followed by the user's ID
            if (equipmentItem.userId !== `E${user.userId}`) {
                console.log(`Corrupted equipment: Equipment with ID ${equipmentId} in User ${user.userId}'s ${fieldName} slot doesn't match expected ID structure.`);
            }
            else if(equipmentItem.quantity !== 1){
                console.log(`Corrupted equipment: Equipment with ID ${equipmentId} in User ${user.userId}'s ${fieldName} slot has a quantity of more than 1.`);
            }
        }
    }
}

module.exports = findCorruptedItems;
