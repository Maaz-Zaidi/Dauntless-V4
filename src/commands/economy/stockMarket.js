const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Stocks = require('../../models/stock');
const Bank = require('../../models/bank');
const Title = require('../../models/title');
const Usables = require('../../models/usable');

module.exports = {
    name: 'stocks',
    description: 'Access the market to view or buy items',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Market action you want to perform',
            choices: [
                { name: 'View Stocks', value: 'view' },
                { name: 'Buy Stocks', value: 'buy' },
                { name: 'Sell Stocks', value: 'sell' }
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
        
            const action = interaction.options.getString('action');
            const itemName = interaction.options.getString('item'); // Assuming you have this option in the command setup

            const user = await User.findOne({ userId: interaction.user.id });
            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
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

            if (action === 'view') {
                const stocks = await Stocks.find({ userId: null });
    
                let page = 0;
                const itemsPerPage = 10;
    
                const generateEmbed = (start) => {
                    const current = stocks.slice(start, start + itemsPerPage);
                    const embed = new EmbedBuilder()
                        .setColor("DarkGold")
                        .setTitle('Welcome to the Dauntless Stock Exchange')
                        .setDescription(`Prices fluctuate every 5 minutes. To view the discription for each of these, use the \`/wiki [Item Name]\` command. To buy them, use \`/stocks buy [Item Name]\`\n\nCurrent Ongoing Event: \`${bank.event}\`\n`)
                        .setFooter({ text: `Page ${start / itemsPerPage + 1} of ${Math.ceil(stocks.length / itemsPerPage)}`} );
    
                    let itemNames = "";
                    let itemDescriptions = "";
                    let itemPrices = "";
                    let itemChanges = "";

                    current.forEach(item => {
                        embed.addFields({name: `${item.name} (${item.description})\n`, value: `\`\`\`Price: ${item.price} Doros\nIncrement: ${item.change}\`\`\``})
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
                        if (page < stocks.length - itemsPerPage) page += itemsPerPage;
                    } else if (reaction.emoji.name === '⬅️') {
                        if (page > 0) page -= itemsPerPage;
                    }
    
                    interaction.editReply({ embeds: [generateEmbed(page)] });
                });
            }
            else if (action === 'buy') {
                    const targetItem = await Stocks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null }) 

                    const itemQuantity = interaction.options.getInteger('quantity') || 1;  // default to 1 if not specified
                    
                    if (itemQuantity < 1){
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Amount')
                            .setDescription("Unable to sell less then one of an item, do not play with me bitch.")
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    if (itemName === null) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Stock')
                            .setDescription("Input a valid stock name when trying to buy an item from the stock market.")
                        interaction.editReply({embeds: [embed]})
                        return;
                        interaction.editReply(`Enter an stock Name when trying to buy an item from the stock market`);
                        return;
                    }
        
                    if (!targetItem) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Stock')
                            .setDescription(`Stock '${itemName}' was not found in the trade center`)
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

                   // Check if the item exists in the user's inventory
                   const existingItem = await Stocks.findOne({ name: targetItem.name, userId: user.userId });
                   if (existingItem) {
                        existingItem.price = Math.round(((existingItem.price * existingItem.quantity) / (itemQuantity + existingItem.quantity)) + ((targetItem.price * itemQuantity) / (itemQuantity + existingItem.quantity)))
                       existingItem.quantity += itemQuantity;// Increment the quantity if item exists
                       
                       await existingItem.save();
                   } else {
                       const newItemData = {...targetItem._doc};  // _doc gives you the properties of the mongoose document
                       
                       newItemData.userId = user.userId;
                       delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                       const newItem = new Stocks(newItemData);
                       newItem.quantity = itemQuantity;
                       await newItem.save();

                       userInventory.stocks.push(newItem._id);
                   }

                    await userInventory.save();
                    
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Purchase Reciept: ${itemName} x ${itemQuantity}`)
                        .setDescription("Thank you for buying our stock(s), your patronage will be remembered. I look forward to your visit in the future as well.")
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

                const targetItem = await Stocks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });;

                if(!targetItem){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Item')
                            .setDescription(`Item '${itemName}' does not exist within Dauntless`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                const trueStock = await Stocks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: null  });
            
                if (!(userInventory.stocks.includes(targetItem._id))) {
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
                        .setDescription(`You only have ${targetItem.quantity} of ${itemName}. You can't sell ${itemQuantity}.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                const profit = (trueStock.price * itemQuantity) - (targetItem.price * itemQuantity)
                console.log(profit)
            
                // Reduce item quantity or remove from inventory
                if (targetItem.quantity === itemQuantity) {
                    userInventory.stocks.remove(targetItem._id);
                    await Stocks.findByIdAndRemove(targetItem._id);
                } else {
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

                let taxStatement;

                const tax = Math.floor((profit) * 0.20)
                const taxItemExist = await Usables.findOne({ name: taxItem.name, userId: user.userId });
                if (taxItemExist) {
                    user.balance += trueStock.price * itemQuantity;
                    taxStatement = "You also successfully evaded Dauntless Tax! Good job.";
                } else {
                    if(profit > 0){
                        user.balance += (trueStock.price * itemQuantity) - tax;
                        bank.balance += tax
                        await bank.save();
                        taxStatement = `Dauntless will charge a rounded 20% tax on the net profit (${tax} Doros)`
                    }
                    else{
                        user.balance += trueStock.price * itemQuantity;
                        taxStatement = `Dauntless will not charge tax due to net negative profit.`
                    }
                    
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

                await user.save();
                await userInventory.save();

                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Trade Reciept: Sold ${itemName} x ${itemQuantity}`)
                    .setDescription(`Thank you for selling us this stock, your patronage will be remembered. I look forward to your visit in the future as well.\n\n Recieved ${trueStock.price * itemQuantity} Doros\n\n${taxStatement}${titleAssignment}`)
                interaction.editReply({embeds: [embed]});
            }
            else{
                console.log("invalid command addition");
            }
    

        } catch (error) {
            console.log(`Error in /stock market view: ${error}`);
            interaction.editReply('There was an error accessing the market. Please try again.');
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Stock Market could not be accessed`)
                        .setDescription(`Stock Market could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
