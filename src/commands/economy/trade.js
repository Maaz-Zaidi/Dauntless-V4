const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const User = require('../../models/user');
const Table = require('../../models/forgingTable');
const Material = require('../../models/material');
const Equipment = require('../../models/equipment');
const Usable = require('../../models/usable');
const Spell = require('../../models/spell');
const Recipe = require('../../models/recipe');
const Inventory = require('../../models/inventory');
const Bank = require('../../models/bank');
const Title = require('../../models/title');


module.exports = {
    name: 'trade',
    description: 'Initiate a trade with another user',
    options: [
        {
            name: 'user',
            type: ApplicationCommandOptionType.User,
            description: 'User you want to trade with',
            required: true,
        },
        {
            name: 'item',
            type: ApplicationCommandOptionType.String,
            description: 'Your item for trade',
            required: true
        },
        {
            name: 'quantity',
            type: ApplicationCommandOptionType.Integer,
            description: 'Amount of the item you want to trade',
            required: true
        },
        {
            name: 'partner_item',
            type: ApplicationCommandOptionType.String,
            description: 'Item you want from the trading partner',
            required: true
        },
        {
            name: 'partner_quantity',
            type: ApplicationCommandOptionType.Integer,
            description: 'Amount of the item you want from the trading partner',
            required: true
        }
    ],
    callback: async (client, interaction) => {
        try {
            
            const tradingPartner = interaction.options.getUser('user');
            const itemName = interaction.options.getString('item');
            const quantity = interaction.options.getInteger('quantity') || 0;

            const partnerItemName = interaction.options.getString('partner_item');
            const partnerQuantity = interaction.options.getInteger('partner_quantity') || 0;

            if (quantity < 1 || partnerQuantity < 1){
                await interaction.deferReply();
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription("Unable to trade less then one of an item, you cannot scam the scammer.")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
            }

            const user = await User.findOne({ userId: interaction.user.id });
            const partner = await User.findOne({ userId: tradingPartner.id });

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.reply({embeds: [embed]})
                return;
            }

            if (!partner) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("The person you requested to trade with must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.reply({embeds: [embed]})
                return;
            }

            if(interaction.user.id === tradingPartner.id){
                const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid IQ')
                            .setDescription(`You cannot trade with yourself dumbass`)
                        interaction.reply({embeds: [embed]})
                        return;
            }

            const userInventory = await Inventory.findOne({ userId: user.userId });
            const partnerInventory = await Inventory.findOne({ userId: partner.userId });

            if (!userInventory) {
                const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error: Inventory does not exist')
                .setDescription("Unable to find inventory, report error to the developer")
            interaction.reply({embeds: [embed]})
            return;
            }

            if (!partnerInventory) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory for trading partner, report error to the developer")
                    interaction.reply({embeds: [embed]})
                    return;
            }

            let item = await Material.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } ,userId: user.userId  });
            if (!item) item = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId   });
            if (!item) item = await Usable.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId   });
            
            if (!item) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You don't have any '${itemName}' in your inventory to trade. Scam me one more time and watch`)
                        .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                    interaction.reply({embeds: [embed]})
                    return;
            }

            if(item.quantity < quantity) {
                const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Error: Insuffecient Quantity`)
                .setDescription(`You do not have the required quantity of "${itemName}" to propose this deal.. Scam me one more time and watch`)
                .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
            interaction.reply({embeds: [embed]})
            return;
            }
        
            console.log(partner.userId)
            let partnerItem = await Material.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }, userId: partner.userId  });
            if (!partnerItem) partnerItem = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }, userId: partner.userId   });
            if (!partnerItem) partnerItem = await Usable.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }, userId: partner.userId   });
            
            if (!partnerItem) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Invalid Partner Item`)
                        .setDescription(`Error finding the resulting item "${partnerItemName}" in the trade partners' inventory.`)
                    interaction.reply({embeds: [embed]})
                    return;
            }

            if(partnerItem.quantity < partnerQuantity) {
                const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Error: Insuffecient Quantity`)
                .setDescription(`Your trading partner does not have the required quantity of "${partnerItemName}" to propose this deal.`)
                interaction.reply({embeds: [embed]})
                return;
            }

            

            const initiatorEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle('Trade Request')
                .setDescription(`You've initiated a trade request with ${tradingPartner.displayName}. Offering \`${quantity} x ${itemName}\`. Awaiting their response.`);

            await interaction.reply({ embeds: [initiatorEmbed] });
            
            const tradeEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle('Trade Offer')
                .setDescription(`${interaction.user.displayName} wants to trade with you. They're offering \`${quantity} x ${itemName}\` for your \`${partnerQuantity} x ${partnerItemName}\`. Accept or decline?`);

            const acceptButton = new ButtonBuilder()
                .setCustomId('accept_trade')
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success);

            const declineButton = new ButtonBuilder()
                .setCustomId('decline_trade')
                .setLabel('Decline')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents([acceptButton, declineButton]);

            const reply = await tradingPartner.send({ embeds: [tradeEmbed], components: [actionRow]});

            // Add logic to handle the response (trade agreement and finalization) here.

            const tradeResponse = await reply.awaitMessageComponent({
                filter: (i) => i.user.id === tradingPartner.id,
                time: 30_000
            }).catch(async () => {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Time Out')
                    .setDescription(`Trade request to ${tradingPartner.displayName} has expired. Bad business man fr..`)
                interaction.followUp({embeds: [embed]})
                return;
            });

            console.log('waited for message over')

            if(!tradeResponse){
                return;
            }

            if (tradeResponse.customId === 'decline_trade') {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Declined')
                    .setDescription(`${tradingPartner.displayName} declined your trade request. Not a great at business are you?` )
                interaction.followUp({embeds: [embed]})
                return;
            }

            if (tradeResponse.customId === 'accept_trade') {
                
                console.log('accepted trade')
                //User logic addition
                let itemExist = await Material.findOne({ name: partnerItem.name, userId: user.userId  });
                if (!itemExist) itemExist = await Equipment.findOne({ name: partnerItem.name, userId: user.userId   });
                if (!itemExist) itemExist = await Usable.findOne({ name: partnerItem.name, userId: user.userId   });

                if(itemExist){
                    itemExist.quantity += partnerQuantity; 
                    await itemExist.save();
                    console.log('adding to item')
                }
                else{
                    console.log('creatng item?')
                    const newItemData = {...partnerItem._doc};  // _doc gives you the properties of the mongoose document
                            
                    newItemData.userId = user.userId;
                    delete newItemData._id;
                    if(partnerItem instanceof Usable){
                        const newItem = new Usable(newItemData);
                        newItem.quantity = partnerQuantity;
                        await newItem.save();
    
                        userInventory.usables.push(newItem._id);
                        await userInventory.save();
                    }
                    else if(partnerItem instanceof Equipment){
                        const newItem = new Equipment(newItemData);
                        newItem.quantity = partnerQuantity;
                        await newItem.save();
    
                        userInventory.equipment.push(newItem._id);
                        await userInventory.save();
                    }
                    else if(partnerItem instanceof Material){
                        const newItem = new Material(newItemData);
                        newItem.quantity = partnerQuantity;
                        await newItem.save();
    
                        userInventory.materials.push(newItem._id);
                        await userInventory.save();
                    }
                }
                console.log('removing item from you')

                //User logic remove
                if(item.quantity > quantity){
                    item.quantity -= quantity; 
                    await item.save();
                }
                else{
                    if (item instanceof Equipment) userInventory.equipment.remove(item._id) && await Equipment.findByIdAndRemove(item._id);
                    if (item instanceof Material) userInventory.materials.remove(item._id) && await Material.findByIdAndRemove(item._id);
                    if (item instanceof Usable) userInventory.usables.remove(item._id) && await Usable.findByIdAndRemove(item._id);
                    
                }
                console.log("user logic succeeded")

                //trading partner logic addition
                let partnerItemExist = await Material.findOne({ name: item.name, userId: partner.userId  });
                if (!partnerItemExist) partnerItemExist = await Equipment.findOne({ name: item.name, userId: partner.userId   });
                if (!partnerItemExist) partnerItemExist = await Usable.findOne({ name: item.name, userId: partner.userId   });
                if(partnerItemExist){
                    console.log('adding for partner')
                    partnerItemExist.quantity += quantity; 
                    await partnerItemExist.save();
                }
                else{
                    console.log('creating')
                    const newItemData = {...item._doc};  // _doc gives you the properties of the mongoose document
                            
                    newItemData.userId = partner.userId;
                    delete newItemData._id;
                    if(item instanceof Usable){
                        const newItem = new Usable(newItemData);
                        newItem.quantity = quantity;
                        await newItem.save();
    
                        partnerInventory.usables.push(newItem._id);
                        await partnerInventory.save();
                    }
                    else if(item instanceof Equipment){
                        const newItem = new Equipment(newItemData);
                        newItem.quantity = quantity;
                        await newItem.save();
    
                        partnerInventory.equipment.push(newItem._id);
                        await partnerInventory.save();
                    }
                    else if(item instanceof Material){
                        const newItem = new Material(newItemData);
                        newItem.quantity = quantity;
                        await newItem.save();
    
                        partnerInventory.materials.push(newItem._id);
                        await partnerInventory.save();
                    }
                }

                //User logic remove
                if(partnerItem.quantity > partnerQuantity){
                    partnerItem.quantity -= partnerQuantity; 
                    await partnerItem.save();
                }
                else{
                    if (partnerItem instanceof Equipment) partnerInventory.equipment.remove(partnerItem._id) && await Equipment.findByIdAndRemove(partnerItem._id);
                    if (partnerItem instanceof Material) partnerInventory.materials.remove(partnerItem._id) && await Material.findByIdAndRemove(partnerItem._id);
                    if (partnerItem instanceof Usable) partnerInventory.usables.remove(partnerItem._id) && await Usable.findByIdAndRemove(partnerItem._id);
                    
                }

                //Title Assignment
                let titleAssignment = "";
                const newTitleMerchant = await Title.findOne({name: "Merchant", userId: null})

                if (!newTitleMerchant) {
                    const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Existing Registering Title')
                                .setDescription("An error occured, please report to the developer.")
                            interaction.editReply({embeds: [embed]})
                            return;
                }

                const equippedTitleMerchant = await Title.findOne({name: "Merchant", userId: user.userId})

                //Equips the moneybag title:
                if(!equippedTitleMerchant) {
                    const newItemData = {...newTitleMerchant._doc};  // _doc gives you the properties of the mongoose document
                                        
                    newItemData.userId = user.userId;
                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                    const newItem = new Title(newItemData);
                    await newItem.save();
                    userInventory.titles.push(newItem._id)
                    await userInventory.save()

                    titleAssignment += "\n\nGained the title: *\"Merchant\"*"
                }

                await reply.edit({embeds: [tradeEmbed], components: []})
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Trade Success')
                    .setDescription(`${tradingPartner.displayName} accepted your trade request. Trade has been completed.${titleAssignment}`)
                interaction.followUp({embeds: [embed]})
                return;
            }


        } catch (error) {
            console.error(`Error in /trade: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Trade could not be accessed`)
                        .setDescription(`/Trade could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
