const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/user');
const Table = require('../../models/forgingTable');
const Material = require('../../models/material');
const Equipment = require('../../models/equipment');
const Usable = require('../../models/usable');
const Spell = require('../../models/spell');
const Recipe = require('../../models/recipe');
const Inventory = require('../../models/inventory');
const Bank = require('../../models/bank');
const RecipeBook = require('../../models/recipeBook');

module.exports = {
    name: 'forge',
    description: 'Access the forging table to view or process materials',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'What do you want to perform at the Forge table?',
            choices: [
                { name: 'View Forge', value: 'view' },
                { name: 'Add Material', value: 'add' },
                { name: 'Remove Material', value: 'remove' },
                { name: 'Process Forge', value: 'process'}
                // Additional choices for add, remove, and process will be added later
            ],
            required: true,
        },
        {
            name: 'item',
            type: ApplicationCommandOptionType.String,
            description: 'Name of the material you want to add/remove',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'quantity',
            type: ApplicationCommandOptionType.Integer,
            description: 'Amount of the material you want to add/remove',
            required: false  // It's not required for the 'view' action
        }
    ],
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const action = interaction.options.getString('action');
            const user = await User.findOne({ userId: interaction.user.id });
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            const userTable = await Table.findOne({ userId: user.userId })
                .populate('materials.itemId');
            const userInventory = await Inventory.findOne({ userId: user.userId });

            if (!userInventory) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;
            }
            if (!userTable) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Forging table does not exist')
                        .setDescription("Unable to retrieve your forging table, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                return;
            }
            
            if (action === 'view') {
                const userTable = await Table.findOne({ userId: user.userId })
                .populate('materials.itemId');

                const embed = new EmbedBuilder()
                    .setColor("Grey")
                    .setTitle('Forging Table')
                    .setDescription('View present items inside the forge. Item list must be exact to craft the desired items, but quantities can vary. The forge will use up all your usable materials to craft as many items when processing.\n\n**Materials:**');
                                
                if (userTable.materials && userTable.materials.length) {
                    userTable.materials.forEach(material => {
                        // Assuming each referenced model has a 'name' and 'quantity' field
                        embed.addFields({name: material.itemId.name, value: `\`\`\`Quantity: x ${material.itemId.quantity}\`\`\``});
                    });
                } else {
                    embed.addFields({name: "Empty", value: '\u200B'});
                }

                return interaction.editReply({embeds: [embed]});
            }
            else if (action === 'process') {
                const userTable = await Table.findOne({ userId: user.userId })
                .populate('materials.itemId');
                
                if(userTable.materials.length === 2 && ((userTable.materials[1].refModel === 'Equipment' && (userTable.materials[0].itemId.name === 'Titanite Shard' || userTable.materials[0].itemId.name === 'Large Titanite Shard' || userTable.materials[0].itemId.name === 'Titanite Chunk' )) || (userTable.materials[0].refModel === 'Equipment' && (userTable.materials[1].itemId.name === 'Titanite Shard' || userTable.materials[1].itemId.name === 'Large Titanite Shard' || userTable.materials[1].itemId.name === 'Titanite Chunk' ))) ){
                    console.log('here')
                    let materialInTableIndex;
                    let equipmentToUpgrade
                    let titanite
                    if(userTable.materials[1].refModel === 'Equipment'){equipmentToUpgrade = userTable.materials[1].itemId; titanite = userTable.materials[0].itemId; materialInTableIndex = 1}
                    else{equipmentToUpgrade = userTable.materials[0].itemId; titanite = userTable.materials[1].itemId; materialInTableIndex = 0}
                    console.log('here')
                    if(equipmentToUpgrade.quantity > 1){
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: Upgrade Failure`)
                            .setDescription(`You cannot upgrade more than one of an equipment at once.`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                    console.log('here')
                    const attributes = ['dexterity', 'mentality', 'luck', 'strength', 'defense', 'labour'];
    
                    let requiredTitanite = "Titanite Shard";
                    let requiredQuantity = 2;
                    let bonusGiven = 1;
                    let stat = attributes[Math.floor(Math.random() * attributes.length)];
                    console.log('here')
                    const regex = /\((\w+) \+\s*(\d+)\)/;
                    const match = equipmentToUpgrade.name.match(regex);

                    

                    if (match) {
                        
                        const effect = match[1]; // this will contain "hunting" or "luck"
                        const value = parseInt(match[2], 10) + 1;    // this will contain "+1"
                        console.log(effect)
                        console.log(value)
                        if(value % 3 !== 0){
                            requiredQuantity = (value % 3) * 2
                        }
                        else{
                            requiredQuantity = 6
                        }

                        if(value > 6){
                            requiredTitanite = "Titanite Chunk";
                        }
                        else if(value > 3){
                            requiredTitanite = "Large Titanite Shard";
                        }
                        stat = effect.toLowerCase();
                        bonusGiven = value;
                    }
                    console.log('here')
                    if (bonusGiven > 9){
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: Upgrade Failure`)
                            .setDescription(`You cannot upgrade past the value of + 10.`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    let equipmentNamed = equipmentToUpgrade.name + ` (${stat.charAt(0).toUpperCase() + stat.slice(1)} + ${bonusGiven})`

                    if(bonusGiven > 1){
                        equipmentNamed = equipmentToUpgrade.name.replace(/\+\s*\d+\)/, `+ ${bonusGiven})`);
                    }
                    console.log('here')
                    if(titanite.name === requiredTitanite  && titanite.quantity >= requiredQuantity){
                        const tableTitanite = await Material.findOne({name: requiredTitanite, userId: "F" + user.userId})

                        if(!tableTitanite){
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Error: Upgrade Failure`)
                                .setDescription(`Titanite was present but could not be found? Report error to developer.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }

                        const tableEquipment = await Equipment.findOne({name: equipmentToUpgrade.name, userId: "F" + user.userId})

                        const existingEquipment = await Equipment.findOne({name: equipmentNamed, userId: user.userId})

                        if(!tableEquipment){
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Error: Upgrade Failure`)
                                .setDescription(`Equipment was present but could not be found? Report error to developer.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }

                        if(tableTitanite.quantity > requiredQuantity){
                            console.log(tableTitanite)
                            
                            tableTitanite.quantity -= requiredQuantity;
                            await tableTitanite.save()
                            userTable.materials.splice(materialInTableIndex, 1);
                            console.log(userTable)
                            await userTable.save();
                        }
                        else{
                            userTable.materials.splice(0, 2);
                            await Material.findByIdAndRemove(tableTitanite._id);
                            console.log(userTable)
                            await userTable.save();
                        }

                        const rankValues = {
                            'S': 25,
                            'A': 20, // assuming a linear decrement of 5 for simplicity
                            'B': 15,
                            'C': 10,
                            'D': 5
                        };

                        const randomVal = Math.random() * 100
                        
                        const rank = tableEquipment.rank;  // example rank
                        const valueAdded = rankValues[rank];

                        let chance = Math.ceil(valueAdded + bonusGiven * 10 - ((user.luckBonus + user.luckLevel) * 0.15))

                        if(chance < 0){
                            chance = 0
                        }

                        if(chance > 99) {chance = 99}

                        console.log(chance)

                        if(randomVal > chance){
                            if (existingEquipment){
                                existingEquipment.quantity += 1;
                                await existingEquipment.save()
                            }
                            else{
                                const newItemData = {...tableEquipment._doc};  // _doc gives you the properties of the mongoose document

                                let endBonus = valueAdded
                                console.log(newItemData.type)
                                if((newItemData.type).toLowerCase() === 'chest') {
                                    endBonus = Math.ceil(valueAdded / 1.5)
                                }
                                else if((newItemData.type).toLowerCase() === 'legs') {
                                    endBonus = Math.ceil(valueAdded / 2)
                                }
                                else if((newItemData.type).toLowerCase() === 'arms') {
                                    endBonus = Math.ceil(valueAdded / 2)
                                }
                                else if((newItemData.type).toLowerCase() === 'head') {
                                    endBonus = Math.ceil(valueAdded / 3)
                                }
                                else if((newItemData.type).toLowerCase() === 'ring') {
                                    endBonus = Math.ceil(valueAdded / 4)
                                }

                                let statToUpdate = stat.toLowerCase();
                                if(statToUpdate === "labour"){
                                    statToUpdate = "labor"
                                }
    
                                newItemData.boost[statToUpdate] = (newItemData.boost[statToUpdate]|| 0) + endBonus + bonusGiven;

                                console.log("Creating weapon")
                                
                                delete newItemData._id; 
    
                                const newItem = new Equipment(newItemData);
                                newItem.name = equipmentNamed;
                                newItem.userId = user.userId;
                                await newItem.save();
        
                                userInventory.equipment.push(newItem._id);
                                await userInventory.save();

                                const existingDatabaseItem = await Equipment.findOne({name: equipmentNamed, userId: null})

                                console.log("Updating world database")

                                if(!existingDatabaseItem){
                                    const newItemDatabase = {...newItem._doc};  // _doc gives you the properties of the mongoose document
                                    
                                    delete newItemDatabase._id; 

                                    const newItemDatabase2 = new Equipment(newItemDatabase);
                                    newItemDatabase2.name = equipmentNamed;
                                    newItemDatabase2.userId = null;
                                    await newItemDatabase2.save();
                                }
                            }
                        }

                        console.log("about to delete")
                        await Equipment.findByIdAndRemove(tableEquipment._id);

                        await userTable.save();

                        if(randomVal > chance){
                            const embed = new EmbedBuilder()
                                .setColor('Green')
                                .setTitle(`Success: Upgraded to + ${bonusGiven}`)
                                .setDescription(`Succesfully upgraded '${equipmentToUpgrade.name}' to '${equipmentNamed}'`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }
                        else{
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Failure: Upgrade Failure (${chance}% Fail Rate)`)
                                .setDescription(`Failed to upgrade '${equipmentToUpgrade.name}'. The equipment ended up breaking.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }
                    }
                    else{
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: Upgrade Failure`)
                            .setDescription(`You need ${requiredQuantity} x ${requiredTitanite} to upgrade this weapon.`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                    
                }
                else if(userTable.materials.length === 1  && (userTable.materials[0].itemId.name === 'Large Titanite Shard' || userTable.materials[0].itemId.name === 'Titanite Chunk' )){
                    const titanite = userTable.materials[0].itemId

                    if(titanite.name === "Large Titanite Shard"  && titanite.quantity >= 1){
                        const amountCrafted = titanite.quantity * 2;
                        const tableTitanite = await Material.findOne({name: "Large Titanite Shard", userId: "F" + user.userId})

                        if(!tableTitanite){
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Error: Upgrade Failure`)
                                .setDescription(`Titanite was present but could not be found? Report error to developer.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }

                        const databaseTitanite = await Material.findOne({name: "Titanite Shard", userId: null})
                        
                        if(!databaseTitanite){
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Error: Break Failure`)
                                .setDescription(`Titanite could not be found in the database? Report error to developer.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }
                        
                        userTable.materials.splice(0, 1);
                        await Material.findByIdAndRemove(tableTitanite._id);
                        await userTable.save();

                        const existingTitanite = await Material.findOne({name: "Titanite Shard", userId: user.userId})

                        if(existingTitanite){
                            existingTitanite.quantity += amountCrafted;
                            await existingTitanite.save()
                        }
                        else{
                            const newItemData = {...databaseTitanite._doc};  // _doc gives you the properties of the mongoose document
                            
                            delete newItemData._id; 

                            const newItem = new Material(newItemData);
                            newItem.userId = user.userId;
                            await newItem.save();
    
                            userInventory.materials.push(newItem._id);
                            await userInventory.save();
                        }

                        const embed = new EmbedBuilder()
                            .setColor('Green')
                            .setTitle(`Success: Seperated Large Titatinite Shard(s)`)
                            .setDescription(`Succesfully seperated ${titanite.quantity} x Large Titatinite Shard(s) into ${titanite.quantity * 2} x Titanite Shards`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                    else if(titanite.name === "Titanite Chunk"  && titanite.quantity >= 1){
                        const amountCrafted = titanite.quantity * 2;
                        const tableTitanite = await Material.findOne({name: "Titanite Chunk", userId: "F" + user.userId})
                        console.log("here")
                        if(!tableTitanite){
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Error: Break Failure`)
                                .setDescription(`Titanite was present but could not be found? Report error to developer.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }
                        console.log("here")
                        const databaseTitanite = await Material.findOne({name: "Large Titanite Shard", userId: null})
                        
                        if(!databaseTitanite){
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Error: Break Failure`)
                                .setDescription(`Titanite could not be found in the database? Report error to developer.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }
                        console.log("here")
                        userTable.materials.splice(0, 1);
                        await Material.findByIdAndRemove(tableTitanite._id);
                        await userTable.save();
                        console.log("here")
                        const existingTitanite = await Material.findOne({name: "Large Titanite Shard", userId: user.userId})
                        console.log("here")
                        if(existingTitanite){
                            existingTitanite.quantity += amountCrafted;
                            await existingTitanite.save()
                        }
                        else{
                            const newItemData = {...databaseTitanite._doc};  // _doc gives you the properties of the mongoose document
                            
                            delete newItemData._id; 

                            const newItem = new Material(newItemData);
                            newItem.userId = user.userId;
                            await newItem.save();
    
                            userInventory.materials.push(newItem._id);
                            await userInventory.save();
                        }

                        const embed = new EmbedBuilder()
                            .setColor('Green')
                            .setTitle(`Success: Seperated Titatinite Chunk(s)`)
                            .setDescription(`Succesfully seperated ${titanite.quantity} x Titatinite Chunk(s) into ${titanite.quantity * 2} x Large Titanite Shards`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                }
                //Fetch all recipes
                const recipes = await Recipe.find({});
            
                let matchedRecipe = null;
                let craftMultiplier = 0;
                for (let recipe of recipes) {
                    let tempMultiplier = Infinity
                    let hasAllItems = true;

                    // Check if the number of items in the table is exactly the same as the number of items required by the recipe
                    if (userTable.materials.length !== recipe.items.length) {
                        continue; // Skip to the next iteration
                    }

                    for (let requiredItem of recipe.items) {
                        const itemInTable = userTable.materials.find(mat => mat.itemId && mat.itemId.name === requiredItem.item);
                        if (!itemInTable) {
                            hasAllItems = false;
                            tempMultiplier = 0;
                            break;
                        }
                        else{
                            // For each required item, determine how many times the item can be crafted based on its quantity
                            const item = await findItemByName(itemInTable.itemId.name)
                            if(item.model.modelName === "Spell"){
                                const relatedItem = await item.model.findOne({name: item.item.name})
                                const potentialMultiplier = Math.floor(relatedItem.quantity / requiredItem.quantity);
                                tempMultiplier = 1
                            } 
                            else{
                                const relatedItem = await item.model.findOne({userId: "F" + user.userId, name: item.item.name})
                                const potentialMultiplier = Math.floor(relatedItem.quantity / requiredItem.quantity);
                                if (relatedItem.quantity < requiredItem.quantity) {
                                    hasAllItems = false;
                                    tempMultiplier = 0;
                                    break;
                                }
                                // Update the craftMultiplier if the current item limits the number of crafts
                                if (potentialMultiplier < tempMultiplier) {
                                    tempMultiplier = potentialMultiplier;
                                }
                            }
                            
                            
                        }
                    }
                    if (hasAllItems) {
                        craftMultiplier = tempMultiplier;
                        matchedRecipe = recipe;
                        break;
                    }
                }
            
                if (!matchedRecipe) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Processing Failure`)
                        .setDescription(`The materials in your forge do not point to any existing applicable process.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                const recipeBooks = await RecipeBook.find({userId: user.userId})
                let bookHeld = false;
                let recipeBookMatched;
        
                for (const recipeBook of recipeBooks) {
                    for (const recipeId of recipeBook.recipes) {
                        if (recipeId.toString() === matchedRecipe._id.toString()) {
                            bookHeld = true;
                            recipeBookMatched = recipeBook
                            break;
                        }
                    }
                }

                let bookStatement = "\n\nRequired crafting book was not found in user's inventory (50% forge failure penalty applied)"
                if(bookHeld){
                    bookStatement = `\n\nCrafting book [${recipeBookMatched.name}] found in user's inventory (100% forge success rate applied)`
                }

                
                if(craftMultiplier === Infinity){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Processing Failure`)
                        .setDescription(`Crucial error, item multiplier reached infinity. Report to developer.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
            
                // If we have a matched recipe, create or add the resulting item to user's inventory
                let item = await Material.findOne({ name: matchedRecipe.resultingItem, userId: null });
                if (!item) item = await Equipment.findOne({ name: matchedRecipe.resultingItem, userId: null  });
                if (!item) item = await Usable.findOne({ name: matchedRecipe.resultingItem, userId: null  });
                if (!item) item = await Spell.findOne({ name: matchedRecipe.resultingItem});
                if (!item) item = await RecipeBook.findOne({ name: matchedRecipe.resultingItem, userId: null   });
                if (!item) {
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Ouput')
                            .setDescription(`Item '${matchedRecipe.resultingItem}' was not found in Dauntless, report to developer.`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                let craftinRateStatement
                let title
                let newMultiplier = 0

                if (craftMultiplier === 1 && !bookHeld){
                    const chance = Math.random() * 100
                    if(chance < 50){
                        craftinRateStatement = `Failure in crafting ${craftMultiplier} of ${matchedRecipe.resultingItem}(s) due to proces penalty.${bookStatement}`;
                        title = `Process Failure: Unable to Forge ${matchedRecipe.resultingItem}`
                        const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`Process Failure: Unable to Forge ${matchedRecipe.resultingItem}`)
                            .setDescription(`Failure in crafting ${craftMultiplier} of ${matchedRecipe.resultingItem}(s)${bookStatement}`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                }
                

                if (craftMultiplier > 0) { // If there's enough material for crafting
                    craftinRateStatement = `Succeeded in crafting ${craftMultiplier} of ${matchedRecipe.resultingItem}(s).${bookStatement}`;
                    title = `Process Success: Forged ${matchedRecipe.resultingItem} x ${craftMultiplier}`
                    if(!bookHeld){
                        for (let i = 0; i <= craftMultiplier; i++) {
                            const chance = Math.random() * 100
                            if(chance < 50){
                                newMultiplier += 1;
                            }
                        }
    
                        if(craftMultiplier !== newMultiplier){
                            title = `Partial Process Success: Forged ${matchedRecipe.resultingItem} x ${craftMultiplier}`
                            craftinRateStatement = `Succeeded in crafting only ${newMultiplier} / ${craftMultiplier} of ${matchedRecipe.resultingItem}(s) due to process penalty.${bookStatement}`;
                        }
                        else if(newMultiplier === 0){
                            title = `Process Failure: Unable to Forge ${matchedRecipe.resultingItem}`
                            craftinRateStatement = `Failure in crafting ${craftMultiplier} of ${matchedRecipe.resultingItem}(s), all processes failed due to forging penalty.${bookStatement}}`
                        }
                    }
                    else{
                        newMultiplier = craftMultiplier;
                    }
                    // Add the crafted item to the user's inventory
                    // If we have a matched recipe, create or add the resulting item to user's inventory
                    let existingItem = await Material.findOne({ name: matchedRecipe.resultingItem, userId: user.userId });
                    if (!existingItem) existingItem = await Equipment.findOne({ name: matchedRecipe.resultingItem, userId: user.userId  });
                    if (!existingItem) existingItem = await Usable.findOne({ name: matchedRecipe.resultingItem, userId: user.userId  });
                    if (!existingItem) existingItem = await RecipeBook.findOne({ name: matchedRecipe.resultingItem, userId: user.userId })

                    if (item && item instanceof Spell && userInventory.spells.includes(item._id.toString())) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Incantation already memorized')
                            .setDescription("You have already learnt this spell, you do not need to create it again.")
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                    else if(existingItem){
                        existingItem.quantity += newMultiplier; // Add the crafted quantity
                        await existingItem.save();
                    }
                    else if(newMultiplier > 0) {
                        const newItemData = {...item._doc};  // _doc gives you the properties of the mongoose document
                            
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one
                        console.log('Creating spell')
                        if(item instanceof Spell){
                            if(newMultiplier > 1){
                                const embed = new EmbedBuilder()
                                    .setColor('Red')
                                    .setTitle('Error: Incantation already memorized')
                                    .setDescription(`You cannot craft more than one spell, only one ${newItem.name} was crafted, the remaining items will be left in the crafting table.`)
                                interaction.editReply({embeds: [embed]})
                                craftMultiplier = 1;
                                newMultiplier = 1;
                            }
                            else{
                                userInventory.spells.push(item._id);
                                await userInventory.save();
                            }
                            
                        }
                        else if(item instanceof Usable){
                            const newItem = new Usable(newItemData);
                            newItem.quantity = newMultiplier;
                            await newItem.save();
    
                            userInventory.usables.push(newItem._id);
                            await userInventory.save();
                        }
                        else if(item instanceof Equipment){
                            const newItem = new Equipment(newItemData);
                            newItem.quantity = newMultiplier;
                            await newItem.save();
    
                            userInventory.equipment.push(newItem._id);
                            await userInventory.save();
                        }
                        else if(item instanceof Material){
                            const newItem = new Material(newItemData);
                            newItem.quantity = newMultiplier;
                            await newItem.save();
    
                            userInventory.materials.push(newItem._id);
                            await userInventory.save();
                        }
                        else if(item instanceof RecipeBook){
                            const newItem = new RecipeBook(newItemData);
                            newItem.quantity = newMultiplier;
                            await newItem.save();
    
                            userInventory.recipeBooks.push(newItem._id);
                            await userInventory.save();
                        }
                    }
                    
                    for (let requiredItem of matchedRecipe.items) {
                        let index = -1;
                        let materialInTableIndex = -1;
                        userTable.materials.forEach(mat => {
                            index++;
                            // Assuming each referenced model has a 'name' and 'quantity' field
                            if(mat.itemId && mat.itemId.name === requiredItem.item){
                                materialInTableIndex = index;
                            }
                        });

                        const itemAcrossItems = await findItemByName(requiredItem.item)

                        if(!itemAcrossItems){
                            const embed = new EmbedBuilder()
                            .setColor("Red")
                            .setTitle(`Process Failure: Could not be found`)
                            .setDescription(`Item could not be found. Critical failure at final step. Report to developer`)
                            return interaction.editReply({embeds: [embed]});
                        }

                        const itemModel = itemAcrossItems.model
                        const itemInTable = await itemModel.findOne({ userId: "F" + user.userId, name: itemAcrossItems.item.name });
                        
                        if (itemModel.modelName === "Spell"){
                            userTable.materials.splice(materialInTableIndex, 1);
                        }
                    
                        if (itemInTable) {
                            // Subtract the quantity used for crafting
                            itemInTable.quantity -= requiredItem.quantity * craftMultiplier;
                    
                            if (itemInTable.quantity <= 0) {
                                userTable.materials.splice(materialInTableIndex, 1);
                    
                                await itemModel.findByIdAndRemove(itemInTable._id);
                            } else {
                                await itemInTable.save();
                            }
                        }
                    }                    
                    
                    await userTable.save();
                    const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`${title}`)
                    .setDescription(`${craftinRateStatement}`)
                    return interaction.editReply({embeds: [embed]});
                }
                else{
                    const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`Process Failure: Quantities Not Enough.`)
                    .setDescription(`Failed in crafting ${matchedRecipe.resultingItem}`)
                    return interaction.editReply({embeds: [embed]});
                }
            
                
            }
            else{
                    const materialName = interaction.options.getString('item');
                    const quantity = interaction.options.getInteger('quantity') || 1;

                    if (quantity < 1){
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Amount')
                            .setDescription("Unable to handle less then one of a materia, you cannot scam the scammer.")
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                        
                    }
                
                    if (!materialName) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Material')
                            .setDescription("Input a valid material name in order to interact with the forge.")
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                    
                    const { item: material, model: Model } = await findItemByName(materialName) || {item: null, model: null};
                    

                    if (!material) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Item')
                            .setDescription(`Item '${materialName}' does not exist in Dauntless`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                if (action === 'add') {
                    
                    const materialInTable = await Model.findOne({ name: material.name, userId: "F" +  user.userId }); 

                    const existingMaterial = await Model.findOne({ name: material.name, userId: user.userId });

                    const existingSpell = await Model.findOne({name: material.name})

                    console.log(material.name);
                    console.log(user.userId)
                
                    if(existingMaterial){
                        if(existingMaterial.quantity < quantity) {
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Know your worth')
                                .setDescription(`You don't have enough of ${existingMaterial.name} to add ${existingMaterial.quantity}. Go back to work slave`)
                                .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                            interaction.editReply({embeds: [embed]})
                            return;
                        }
                        else if (existingMaterial.quantity > quantity){
                            existingMaterial.quantity -= quantity;
                            await existingMaterial.save();
                        } else{
                            let invModel = ''
                            if (Model.modelName === "Material") {invModel = 'materials'}
                            else if (Model.modelName === "Equipment") {invModel = 'equipment'}
                            else if (Model.modelName === "Usable") {invModel = 'usables'}
                            else{
                                const embed = new EmbedBuilder()
                                    .setColor('Red')
                                    .setTitle(`Error: Model Error`)
                                    .setDescription(`Report this model error to the developer.`)
                                    .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                                interaction.editReply({embeds: [embed]})
                                return;
                            }
                            userInventory[invModel].remove(existingMaterial._id);
                            await Model.findByIdAndRemove(existingMaterial._id);
                        }
                
                        if (materialInTable) {
                            // Update existing material quantity in the table
                            materialInTable.quantity += quantity;
                            await materialInTable.save();
                        } else {
                            const newItemData = {...existingMaterial._doc};
                            
                            newItemData.userId = "F" + user.userId;
                            delete newItemData._id;  // Remove the _id so mongoose will generate a new one
                
                            const newItem = new Model(newItemData);
                            newItem.quantity = quantity;
                            await newItem.save();
                
                            userTable.materials.push({ itemId: newItem._id, refModel: Model.modelName });
                            await userTable.save();
                        }

                        await userInventory.save()
                        const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Interaction Success: Added ${existingMaterial.name} x ${quantity}`)
                        .setDescription(`Successfully added  ${quantity} of ${existingMaterial.name} to the forging table.`)
                        return interaction.editReply({embeds: [embed]});
                    }
                    else if(existingSpell && Model.modelName === "Spell"){
                        userInventory.spells.remove(existingSpell._id)

                        const slot1 = user.spellSlot1 ? await Spell.findById(user.spellSlot1) : null;
                        const slot2 = user.spellSlot2 ? await Spell.findById(user.spellSlot2) : null;
                        const slot3 = user.spellSlot3 ? await Spell.findById(user.spellSlot3) : null;
                        const slot4 = user.spellSlot4 ? await Spell.findById(user.spellSlot4) : null;

                        if(slot1 && slot1.name === existingSpell.name){

                            if (slot2) {user.spellSlot1 = user.spellSlot2;} else{user.spellSlot1 =null;} 
                            if (slot3) {user.spellSlot2 = user.spellSlot3;} else{user.spellSlot2 =null;} 
                            if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                            user.spellSlot4 = null;
                            
                        } else if(slot2 && slot2.name === existingSpell.name){

                            if (slot3) {user.spellSlot2 = user.spellSlot3;} else{user.spellSlot2 =null;} 
                            if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                            user.spellSlot4 = null;

                        } else if(slot3 && slot3.name === existingSpell.name){

                            if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                            user.spellSlot4 = null;

                        } else if(slot4 && slot4.name === existingSpell.name){

                            user.spellSlot4 = null;
                        } 

                        userTable.materials.push({ itemId: existingSpell._id, refModel: Model.modelName });
                        await userTable.save();
                        await userInventory.save();

                        const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Interaction Success: Added ${existingSpell.name} x 1`)
                        .setDescription(`Successfully added 1 of ${existingSpell.name} to the forging table.`)
                        return interaction.editReply({embeds: [embed]});
                    }             
                    else{
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: ${material.name} is not in possession`)
                            .setDescription(`You don't have any '${material.name}' in your inventory to add. Scam me one more time and watch`)
                            .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                
                    
                }
                else if (action === 'remove') {
                    const userTable = await Table.findOne({ userId: user.userId })
                    .populate('materials.itemId');
                    

                    let index = -1;
                    let materialInTableIndex = -1;

                    userTable.materials.forEach(mat => {
                        console.log(index)
                        index++;
                        // Assuming each referenced model has a 'name' and 'quantity' field
                        if(mat.itemId && mat.itemId.name === material.name){
                            materialInTableIndex = index;
                        }
                    });
                    // const materialInTable = userTable.materials[materialInTableIndex];

                    const materialInTable = await Model.findOne({ userId: "F" + user.userId, name: material.name });
                    const existingSpell = await Model.findOne({name: material.name})
                    
                    if (!materialInTable && !existingSpell){
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: ${materialName} is not in the forge`)
                            .setDescription(`You don't have any '${materialName}' in your forging table to retrieve. Scam me one more time and watch`)
                            .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    if(!materialInTable && existingSpell && userTable.materials.find(mat => mat.itemId && mat.itemId.name === existingSpell.name)){
                        // Check if the item exists in the user's inventory
                        userTable.materials.splice(materialInTableIndex, 1);
                        await userTable.save();
                        if (userInventory.spells.includes(existingSpell._id)) {
                            // USER DOES NOT EXIST
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Incantation already memorized')
                                .setDescription("You have two of them, your officially fucked.")
                            interaction.editReply({embeds: [embed]})
                            return;
                        } else {
                            userInventory.spells.push(existingSpell._id);
                        }
                    }
                    else if (materialInTable && userTable.materials.find(mat => mat.itemId && mat.itemId.name === materialInTable.name)){
                        const existingMaterial = await Model.findOne({ userId: user.userId, name: material.name });
                
                        if (materialInTable.quantity < quantity) {
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Invalid Amount')
                                .setDescription(`You only have ${materialInTable.quantity} of ${existingMaterial.name} in the table. You can't remove ${quantity} dumbass.`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        } else if (materialInTable.quantity === quantity) {
                            userTable.materials.splice(materialInTableIndex, 1);
                            await Model.findByIdAndRemove(materialInTable._id);
                        } else {
                            // Reduce the material quantity in the table
                            materialInTable.quantity -= quantity;
                            await materialInTable.save();
                        }
                        
                        
                        await userTable.save();

                        if(existingMaterial){
                            existingMaterial.quantity += quantity;
                            await existingMaterial.save();
                        } else{
                            const newItemData = {...materialInTable._doc};  // _doc gives you the properties of the mongoose document
                            newItemData.userId = user.userId;
                            delete newItemData._id;  // Remove the _id so mongoose will generate a new one
                    
                            const newMaterial = new Model(newItemData); // We use Model which we got from `findItemByName`
                            newMaterial.quantity = quantity;
                            await newMaterial.save();
                    
                            if (Model.modelName === 'Material') {
                                console.log('pushed')
                                userInventory.materials.push(newMaterial._id);
                            } else if (Model.modelName === 'Equipment') {
                                userInventory.equipment.push(newMaterial._id);
                            } else if (Model.modelName === 'Usable') {
                                userInventory.usables.push(newMaterial._id);
                            } else if (Model.modelName === 'Spell') {
                                userInventory.spells.push(newMaterial._id);  
                            }
                        }
                    }
                    else{
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: ${materialName} is not in the forge`)
                            .setDescription(`You don't have any '${materialName}' in your forging table to retrieve. Scam me one more time and watch`)
                            .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                    await userInventory.save();
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Interaction Success: Removed ${materialName} x ${quantity}`)
                        .setDescription(`Successfully removed  ${quantity} of ${materialName} from the forging table.`)
                        return interaction.editReply({embeds: [embed]});
                }
            }
            // Add, remove, and process actions will come next after this

        } catch (error) {
            console.error(`Error in /forge view: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Forging Table could not be accessed`)
                        .setDescription(`Forging Table could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
}; 

async function findItemByName(itemName) {
    const models = [Material, Equipment, Usable, Spell, RecipeBook];
    for (let model of models) {
        const item = await model.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } });
        if (item) {
            return { item, model };
        }
    }
    return null;
}