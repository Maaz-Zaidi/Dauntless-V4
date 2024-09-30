const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const Equipment = require('../../models/equipment');
const Usables = require('../../models/usable');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Material = require('../../models/material');
const Stocks = require('../../models/stock');
const RecipeBooks = require('../../models/recipeBook');
const Bank = require('../../models/bank');
const Spell = require('../../models/spell');
const Title = require('../../models/title');
const Monsters = require('../../data/monster');




module.exports = {
    name: 'market',
    description: 'Access the market to view or buy items',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Market action you want to perform',
            choices: [
                { name: 'View Items', value: 'view' },
                { name: 'Buy Items', value: 'buy' },
                { name: 'Sell Items', value: 'sell' }
                // Additional choices can be added later for buy, sell, etc.
            ],
            required: true,
        },
        {
            name: 'item',
            type: ApplicationCommandOptionType.String,
            description: 'Name of the item you want to buy/sell (used with the buy and sell command)',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'quantity',
            type: ApplicationCommandOptionType.Integer,
            description: 'Amount of the item you want to buy/sell (used with the buy and sell command)',
            required: false  // It's not required for the 'view' action
        }
    ],
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();
            
            const filter = ['Lost Dream', 'Abyssal Scale', 'Heart of Everlasting Phoenix', 'Void Crown', 'Fragment of the Void', 'Heart of Ancalagon', 'Dragon King\'s Scale', 'Heart of Smough', 'Heart of the Fallen', 'Fragment of Wrath', 'Fragment of Lust', 'Red Horns of Agares', 'Heart of the Kobold Lord', 'Leather', 'Broken Key']
            
            async function fetchRandomDrop(filter) {
                let eligibleMonsters = await Monsters.find({});
                let randomDrop = null;
                
                do {
                    let randomMonster = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)];
                    if (!randomMonster.drops || randomMonster.drops.length === 0) {
                        return fetchRandomDrop(filter); // Or handle no drops scenario
                    }
            
                    randomDrop = randomMonster.drops[Math.floor(Math.random() * randomMonster.drops.length)];
                    const drop = await Material.findOne({_id: randomDrop})
                    // Check if the drop is Equipment or in the filter list
                    const isEquipment = await Equipment.findById(randomDrop);
                    const isFiltered = filter.includes(drop.name); // Assuming the filter is based on names
            
                    if (isEquipment || isFiltered) {
                        randomDrop = null;
                    }
                    
                } while (!randomDrop);
                const drop = await Material.findOne({_id: randomDrop})
                return drop;
            }
            
            
            // Function to update the bank items
            async function updateBankItems(filter) {
                const bank = await Bank.findOne({ name: "Dauntless" });
                if (!bank) return;
                for (let i = 1; i <= 3; i++) {
                    const randomDrop = await fetchRandomDrop(filter);
                    if (randomDrop) {
                        bank[`item${i}`] = {
                            itemId: randomDrop._id,
                            price: randomDrop.price * 10
                        };
                    }
                }
            
                await bank.save();
            }
            
            const action = interaction.options.getString('action');
            const itemName = interaction.options.getString('item'); // Assuming you have this option in the command setup
            
            if(!action){
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid Action')
                    .setDescription("Please select a valid option to perform")
                interaction.editReply({embeds: [embed]})
                return;
            }

            const bank = await Bank.findOne({name: "Dauntless"})

            if(!bank){
                 const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Developer Error')
                    .setDescription("Error with the Dauntless bank, please report to developer.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            const item1 = bank.item1 ? await Material.findById(bank.item1.itemId) : null;
            const item2 = bank.item2 ? await Material.findById(bank.item2.itemId) : null;
            const item3 = bank.item3 ? await Material.findById(bank.item3.itemId) : null;

            const now = new Date();
            const timeSinceLastUpdate = now.getTime() - bank.marketUpdateDate.getTime();
            const daysSinceLastUpdate = Math.floor(timeSinceLastUpdate / (24 * 60 * 60 * 1000));
            console.log(daysSinceLastUpdate)
            // If at least one day has passed since the quest creation
            if (daysSinceLastUpdate >= 1 ) { 
                await updateBankItems(filter);
                bank.marketUpdateDate = new Date(bank.marketUpdateDate.getTime() + (daysSinceLastUpdate * 24 * 60 * 60 * 1000));
                await bank.save()
            }
            console.log(item1)
            const user = await User.findOne({ userId: interaction.user.id });
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            if (action === 'view') {
                // 1. Fetch data
                const allUsables = await Usables.find({ market: true, userId: null });
                const allBooks = await RecipeBooks.find({ market: true, userId: null });
                const allEquipment = await Equipment.find({ market: true, userId: null });
                const allMaterials = await Material.find({ market: true, userId: null });

                // 2. Combine all items with category information
                const allItems = [
                ...allUsables.map(item => ({ name: item.name, price: item.price, category: 'Usables' })),
                ...allBooks.map(item => ({ name: item.name, price: item.price, category: 'Books' })),
                ...allEquipment.map(item => ({ name: item.name, price: item.price, category: 'Equipment' })),
                ...allMaterials.map(item => ({ name: item.name, price: item.price, category: 'Materials' }))
                ];
                if (item3) allItems.unshift({ name: `LIMITED: ${item3.name}`, price: bank.item3.price, category: 'Materials' });
                if (item2) allItems.unshift({ name: `LIMITED: ${item2.name}`, price: bank.item2.price, category: 'Materials' });
                if (item1) allItems.unshift({ name: `LIMITED: ${item1.name}`, price: bank.item1.price, category: 'Materials' });

                let page = 0;
                const itemsPerPage = 5;
                
                const timeSinceLastDaily = new Date() - bank.marketUpdateDate;

                const totalSecondsLeft = (24 * 60 * 60 * 1000 - timeSinceLastDaily) / 1000;
                const hoursLeft = Math.floor(totalSecondsLeft / 3600);
                const minutesLeft = Math.floor((totalSecondsLeft - hoursLeft * 3600) / 60);
                const secondsLeft = Math.round(totalSecondsLeft - hoursLeft * 3600 - minutesLeft * 60);
                // 3. Update the embed function
                const generateEmbed = (start) => {
                const current = allItems.slice(start, start + itemsPerPage);
                const embed = new EmbedBuilder()
                    .setColor('Purple')
                    .setTitle('Marketplace')
                    .setDescription(`Use the \`/wiki [Item Name]\` command to view the description. Buy with \`/Market buy [Item Name]\`.\n\n\`\`\`Limited Items Reset: ${hoursLeft.toString().padStart(2, '0')}h : ${minutesLeft.toString().padStart(2, '0')}m : ${secondsLeft.toString().padStart(2, '0')}s\`\`\``)
                    .setFooter({ text: `Page ${start / itemsPerPage + 1} of ${Math.ceil(allItems.length / itemsPerPage)}`});

                let itemNames = "";
                let itemPrices = "";

                current.forEach(item => {
                    embed.addFields({name: item.name, value: `\`\`\`Price: ${item.price} Doros\nCategory: ${item.category}\`\`\``})
                });

                return embed;
                };
                console.log("here")
                const marketMessage = await interaction.editReply({
                embeds: [generateEmbed(0)],
                fetchReply: true,
                });
                await marketMessage.react('⬅️');
                await marketMessage.react('➡️');

                const filter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;

                // 4. Adjust the pagination
                const collector = marketMessage.createReactionCollector({ filter, time: 100000 });
                collector.on('collect', async (reaction) => {
                reaction.users.remove(interaction.user.id);
                if (reaction.emoji.name === '➡️') {
                    if (page < allItems.length - itemsPerPage) page += itemsPerPage;
                } else if (reaction.emoji.name === '⬅️') {
                    if (page > 0) page -= itemsPerPage;
                }

                interaction.editReply({ embeds: [generateEmbed(page)] });
                });

            }
            else if (action === 'buy') {

                const itemQuantity = interaction.options.getInteger('quantity') || 1;  // default to 1 if not specified

                    if (itemName === null) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: Invalid Item Input`)
                            .setDescription(`Please specify the Item Name which you are trying to purchase`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
                    
                    if (itemName.toLowerCase() === item1.name.toLowerCase() || itemName.toLowerCase() === item2.name.toLowerCase() || itemName.toLowerCase() === item3.name.toLowerCase()){
                        let price = 0;

                        switch(itemName.toLowerCase()) {
                            case item1.name.toLowerCase():
                                price = bank.item1.price
                                break;
                            case item2.name.toLowerCase():
                                price = bank.item2.price
                                break;
                            case item3.name.toLowerCase():
                                price = bank.item3.price
                                break;
                        }

                        const targetItem = await Material.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null });

                        if (!targetItem) {
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Invalid Item')
                                .setDescription(`Item '${itemName}' was not found in the database`)
                            interaction.editReply({embeds: [embed]})
                            return;
                        }

                        if (user.balance < price * itemQuantity) {
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Know your worth')
                                .setDescription(`You don't have enough balance to buy x ${itemQuantity} of ${itemName}. Go back to work slave`)
                                .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                            interaction.editReply({embeds: [embed]})
                            return;
                        }

                        user.balance -= price * itemQuantity;
                        await user.save();

                        const userInventory = await Inventory.findOne({ userId: user.userId });

                        if (!userInventory) {
                            const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Inventory does not exist')
                            .setDescription("Unable to find inventory, report error to the developer")
                        interaction.editReply({embeds: [embed]})
                        return;
                        }

                        const existingItem = await Material.findOne({ name: targetItem.name, userId: user.userId });
                        if (existingItem) {
                            existingItem.quantity += itemQuantity;
                            await existingItem.save();
                        } else {
                            const newItemData = {...targetItem._doc};  // _doc gives you the properties of the mongoose document
                            
                            newItemData.userId = user.userId;
                            delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                            const newItem = new Material(newItemData);
                            newItem.quantity = itemQuantity;
                            await newItem.save();

                            userInventory.materials.push(newItem._id);
                        }

                        await userInventory.save();

                        const embed = new EmbedBuilder()
                            .setColor("Green")
                            .setTitle(`Purchase Reciept: ${targetItem.name} x ${itemQuantity}`)
                            .setDescription(`Thank you for buying our product, your patronage will be remembered. I look forward to your visit in the future as well.`)
                        return interaction.editReply({embeds: [embed]});

                    }

                    // Let's find the item, for simplicity, we'll look in Equipment and Usables only, you can extend this.
                    const targetItem = await RecipeBooks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true, userId: null }) 
                                    || await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true, userId: null }) 
                                    || await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true, userId: null }) 
                                    || await Material.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true, userId: null });

                    

                    if (itemQuantity < 1){
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Amount')
                            .setDescription("Unable to buy less then one of an item, do not play with me bitch.")
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    
                    if (!targetItem) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Item')
                            .setDescription(`Item '${itemName}' was not found in the market`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
        
                    if (user.balance < targetItem.price * itemQuantity) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Know your worth')
                            .setDescription(`You don't have enough balance to buy x ${itemQuantity} of ${itemName}. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
        
                    user.balance -= targetItem.price * itemQuantity;
                    await user.save();
        
                    
                    // Add or update item in user's inventory
                    const userInventory = await Inventory.findOne({ userId: user.userId });

                    if (!userInventory) {
                        const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;
                    }

                    let additionalStatementLuck;
                    if (targetItem instanceof RecipeBooks) {
                        // Check if the item exists in the user's inventory
                        const existingItem = await RecipeBooks.findOne({ name: targetItem.name, userId: user.userId });
                        if (existingItem) {
                            existingItem.quantity += itemQuantity; // Increment the quantity if item exists
                            await existingItem.save();
                        } else {
                            const newItemData = {...targetItem._doc};  // _doc gives you the properties of the mongoose document
                            
                            newItemData.userId = user.userId;
                            delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                            const newItem = new RecipeBooks(newItemData);
                            newItem.quantity = itemQuantity;
                            await newItem.save();

                            userInventory.recipeBooks.push(newItem._id);
                        }
                    } else if (targetItem instanceof Usables) {
                        const existingItem = await Usables.findOne({ name: targetItem.name, userId: user.userId });
                        if(targetItem.name === "Lucky Charm"){
                            user.luckBonus += itemQuantity;
                            additionalStatementLuck += "\n\nGained an additional luck level while this item remains with you"
                            user.save();
                        }
                        if (existingItem) {
                            existingItem.quantity += itemQuantity;
                            await existingItem.save();
                        } else {
                            const newItemData = {...targetItem._doc};  // _doc gives you the properties of the mongoose document
                            
                            newItemData.userId = user.userId;
                            delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                            const newItem = new Usables(newItemData);
                            newItem.quantity = itemQuantity;
                            await newItem.save();

                            userInventory.usables.push(newItem._id);
                        }
                    }
                    else if (targetItem instanceof Equipment) {
                        // Check if the item exists in the user's inventory
                        const existingItem = await Equipment.findOne({ name: targetItem.name, userId: user.userId });
                        if (existingItem) {
                            existingItem.quantity += itemQuantity; // Increment the quantity if item exists
                            await existingItem.save();
                        } else {
                            const newItemData = {...targetItem._doc};  // _doc gives you the properties of the mongoose document
                            
                            newItemData.userId = user.userId;
                            delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                            const newItem = new Equipment(newItemData);
                            newItem.quantity = itemQuantity;
                            await newItem.save();

                            userInventory.equipment.push(newItem._id);
                        }
                    } else if (targetItem instanceof Material) {
                        const existingItem = await Material.findOne({ name: targetItem.name, userId: user.userId });
                        if (existingItem) {
                            existingItem.quantity += itemQuantity;
                            await existingItem.save();
                        } else {
                            const newItemData = {...targetItem._doc};  // _doc gives you the properties of the mongoose document
                            
                            newItemData.userId = user.userId;
                            delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                            const newItem = new Material(newItemData);
                            newItem.quantity = itemQuantity;
                            await newItem.save();

                            userInventory.materials.push(newItem._id);
                        }
                    }
                    else{
                        console.log("error, not equipment or usable item");
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Development Error')
                            .setDescription("Item is neither an 'Equipment', 'Usable', 'Material', or 'Recipe Book', report to the developer.")
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    await userInventory.save();

                    if(itemName.toLowerCase() === "lottery ticket"){
                        
                        bank.lottery += targetItem.price * itemQuantity;
                        await bank.save();
                    }
                    
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Purchase Reciept: ${targetItem.name} x ${itemQuantity}`)
                        .setDescription(`Thank you for buying our product, your patronage will be remembered. I look forward to your visit in the future as well.${additionalStatementLuck}`)
                    interaction.editReply({embeds: [embed]});
            }
            else if (action === 'sell') {
                const itemQuantity = interaction.options.getInteger('quantity') || 1;

                if (itemQuantity < 1){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription("Unable to sell less then one of an item, you cannot scam the scammer.")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
                }
            
                const userInventory = await Inventory.findOne({ userId: user.userId });
                if (!userInventory) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                const targetEquipmentX = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null  });
                const targetUsableX = await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null  });
                const targetMaterialX = await Material.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null  });
                const targetBookX = await RecipeBooks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null  });
                const targetStockX = await Stocks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null  });
                const targetSpellX = await Spell.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null  });
                const targetItemX = targetEquipmentX || targetUsableX || targetMaterialX || targetBookX || targetStockX;
            
                const targetEquipment = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetUsable = await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetMaterial = await Material.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetBook = await RecipeBooks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetStock = await Stocks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetSpell = await Spell.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetItem = targetEquipment || targetUsable || targetMaterial || targetBook || targetStock;

                if(targetStockX){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Category')
                        .setDescription("This item is a stock, please interact with the stock market to handle trades with this category of item.")
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                if(targetSpellX){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Category')
                        .setDescription("This item is a spell, please interact with the Mage Tower (/covenant) to handle trades with this category of item.")
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                if(!targetItemX){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Item')
                            .setDescription(`Item '${itemName}' does not exist within Dauntless`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }
            
                if (!targetItem || !(userInventory.equipment.includes(targetItem._id) || userInventory.usables.includes(targetItem._id) || userInventory.materials.includes(targetItem._id) || userInventory.recipeBooks.includes(targetItem._id))) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You don't have any '${itemName}' in your inventory to sell. Scam me one more time and watch`)
                        .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                    interaction.editReply({embeds: [embed]})
                    return;
                }
            
                if (targetItem.quantity < itemQuantity) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription(`You only have ${targetItem.quantity} of ${itemName}. You can't sell ${itemQuantity} dumbass.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
            
                // Reduce item quantity or remove from inventory
                if (targetItem.quantity === itemQuantity) {
                    if(targetItem.name === "Lucky Charm"){
                        user.luckBonus -= itemQuantity;
                    }
                    if (targetEquipment) userInventory.equipment.remove(targetEquipment._id) && await Equipment.findByIdAndRemove(targetEquipment._id);
                    if (targetUsable) userInventory.usables.remove(targetUsable._id) && await Usables.findByIdAndRemove(targetUsable._id);
                    if (targetMaterial) userInventory.materials.remove(targetMaterial._id) && await Material.findByIdAndRemove(targetMaterial._id);
                    if (targetBook) userInventory.recipeBooks.remove(targetBook._id) && await RecipeBooks.findByIdAndRemove(targetBook._id);
                } else {
                    if(targetItem.name === "Lucky Charm"){
                        user.luckBonus -= itemQuantity;
                    }
                    targetItem.quantity -= itemQuantity;
                    await targetItem.save();
                }

                let itemTaxName = "Tax Evasion";
                const taxItem = await Usables.findOne({ name: itemTaxName, market: true });
                    
                if (!taxItem) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Development Error`)
                        .setDescription(`Tax evasion has not been initialized, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
                let tax = Math.floor((targetItem.price * itemQuantity) * 0.20)
                let taxStatement;
                const taxItemExist = await Usables.findOne({ name: taxItem.name, userId: user.userId });
                if (taxItemExist) {
                    user.balance += targetItem.price * itemQuantity;
                    taxStatement = "You also successfully evaded Dauntless Tax! Good job.";
                } else {
                    user.balance += (targetItem.price * itemQuantity )- tax;
                    bank.balance += tax
                    await bank.save();
                    taxStatement = `Dauntless will charge a rounded 20% tax on these sales (${tax} Doros)`
                }

                //Title Assignment
                let titleAssignment = "";
                const newTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: null})

                if (!newTitleMoneyBags) {
                    const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Existing Registering Title')
                                .setDescription("An error occured, please report to the developer.")
                            interaction.editReply({embeds: [embed]})
                            return;
                }

                const equippedTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: user.userId})

                //Equips the moneybag title:
                if(!equippedTitleMoneyBags && user.balance > 50000) {
                    const newItemData = {...newTitleMoneyBags._doc};  // _doc gives you the properties of the mongoose document
                                        
                    newItemData.userId = user.userId;
                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                    const newItem = new Title(newItemData);
                    await newItem.save();
                    userInventory.titles.push(newItem._id)
                    await userInventory.save()

                    titleAssignment += "\n\nGained the title: *\"Mr. MoneyBags\"*"
                }
            
                // Update user's balance
                await user.save();
                await userInventory.save();

                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Trade Reciept: Sold ${itemName} x ${itemQuantity}`)
                    .setDescription(`Thank you for selling us this item, your patronage will be remembered. I look forward to your visit in the future as well.\n\n Recieved ${targetItem.price * itemQuantity} Doros\n\n${taxStatement}${titleAssignment}`)
                interaction.editReply({embeds: [embed]});
            }
            else{
                console.log("invalid command addition");
            }
    

        } catch (error) {
            console.log(`Error in /market view: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Market could not be accessed`)
                        .setDescription(`Market could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
