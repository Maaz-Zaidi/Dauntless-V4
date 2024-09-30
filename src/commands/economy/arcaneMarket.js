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

module.exports = {
    name: 'covenant',
    description: 'Browse the Mage Tower to access incantations',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Market action you want to perform',
            choices: [
                { name: 'View Incantations', value: 'view' },
                { name: 'Buy Incantations', value: 'buy' },
                { name: 'Sell Incantations', value: 'sell' }
                // Additional choices can be added later for buy, sell, etc.
            ],
            required: true,
        },
        {
            name: 'spell',
            type: ApplicationCommandOptionType.String,
            description: 'Name of the item you want to buy/sell (used with the buy and sell command)',
            required: false  // It's not required for the 'view' action
        },
    ],
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();
        
            const action = interaction.options.getString('action');
            const itemName = interaction.options.getString('spell'); // Assuming you have this option in the command setup

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
                const allItems = await Spell.find({ market: true});
    
                let page = 0;
                const itemsPerPage = 5;
    
                const generateEmbed = (start) => {
                    const current = allItems.slice(start, start + itemsPerPage);
                    const embed = new EmbedBuilder()
                        .setColor('Purple')
                        .setTitle('Welcome to the Mage Tower')
                        .setDescription("To view the discription for each of these, use the `/wiki [Spell Name]` command. To buy them, use `/covenant buy [Spell Name]`")
                        .setFooter({ text: `Page ${start / itemsPerPage + 1} of ${Math.ceil(allItems.length / itemsPerPage)}`} );
    
                    let itemNames = "";
                    let itemDescriptions = "";
                    let itemPrices = "";
                    let itemQuantities = "";

                    current.forEach(item => {
                        embed.addFields(
                            {name: `${item.name} [${item.rank} Rank]`, value: `\`\`\`Price: ${item.price} Doros\nType: ${item.type}\`\`\``},
                        );
                    });

                    return embed;
                };
                const marketMessage = await interaction.editReply({
                    embeds: [generateEmbed(0)],
                    fetchReply: true,
                });
                await marketMessage.react('⬅️');
                await marketMessage.react('➡️');
    
                const filter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;
    
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
                    // Let's find the item, for simplicity, we'll look in Equipment and Usables only, you can extend this.
                    const targetItem = await Spell.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true })

                    if (itemName === null) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Incantation')
                            .setDescription("Input a valid incantation in order to attempt a purchase.")
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
        
                    if (!targetItem) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Incantation')
                            .setDescription(`Incantation '${itemName}' was not found in the covenant market`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }
        
                    if (user.balance < targetItem.price) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Know your worth')
                            .setDescription(`You don't have enough balance to buy ${itemName}. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

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

                    // Check if the item exists in the user's inventory
                    if (userInventory.spells.includes(targetItem._id)) {
                        // USER DOES NOT EXIST
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Incantation already memorized')
                            .setDescription("You have already learnt this spell, you do not need to buy it again.")
                        interaction.editReply({embeds: [embed]})
                        return;
                    } else {
                        userInventory.spells.push(targetItem._id);
                    }

                    user.balance -= targetItem.price;
                    await user.save();

                    await userInventory.save();

                    const embed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle(`Incantation Reciept: ${itemName}`)
                        .setDescription("Thank you for buying our this spell, your patronage will be remembered. I look forward to your visit in the future as well.")
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

                const targetItem = await Spell.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }  })
            
                const userInventory = await Inventory.findOne({ userId: user.userId });
                if (!userInventory) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;
                }
            
                if (!targetItem || !userInventory.spells.includes(targetItem._id)) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You don't have any '${itemName}' spell in your inventory to sell. Scam me one more time and watch`)
                        .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                    interaction.editReply({embeds: [embed]})
                    return;
                }
                else{
                    userInventory.spells.remove(targetItem._id)

                    const slot1 = user.spellSlot1 ? await Spell.findById(user.spellSlot1) : null;
                    const slot2 = user.spellSlot2 ? await Spell.findById(user.spellSlot2) : null;
                    const slot3 = user.spellSlot3 ? await Spell.findById(user.spellSlot3) : null;
                    const slot4 = user.spellSlot4 ? await Spell.findById(user.spellSlot4) : null;

                    if(slot1 && slot1.name === itemName){
                        
                        if (slot2) {user.spellSlot1 = user.spellSlot2;} else{user.spellSlot1 =null;} 
                        if (slot3) {user.spellSlot2 = user.spellSlot3;} else{user.spellSlot2 =null;} 
                        if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                        user.spellSlot4 = null;
                        
                    } else if(slot2 && slot2.name === itemName){

                        if (slot3) {user.spellSlot2 = user.spellSlot3;} else{user.spellSlot2 =null;} 
                        if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                        user.spellSlot4 = null;

                    } else if(slot3 && slot3.name === itemName){

                        if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                        user.spellSlot4 = null;

                    } else if(slot4 && slot4.name === itemName){

                        user.spellSlot4 = null;
                    } 

                    
                
                    await user.save();
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

                let tax = Math.floor((targetItem.price) * 0.20)
                let taxStatement;
                const taxItemExist = await Usables.findOne({ name: taxItem.name, userId: user.userId });
                if (taxItemExist) {
                    user.balance += targetItem.price ;
                    taxStatement = "You also successfully evaded Dauntless Tax! Good job.";
                } else {
                    user.balance += (targetItem.price )- tax;
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
                    .setTitle(`Trade Reciept: Sold ${itemName}`)
                    .setDescription(`Thank you for selling us this spell, your patronage will be remembered. I look forward to your visit in the future as well.\n\n Recieved ${targetItem.price} Doros\n\n${taxStatement}${titleAssignment}`)
                interaction.editReply({embeds: [embed]});
            }
            else{
                console.log("invalid command addition");
            }
    

        } catch (error) {
            console.log(`Error in /arcanemarket view: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Mage Tower could not be accessed`)
                        .setDescription(`Mage Tower could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
