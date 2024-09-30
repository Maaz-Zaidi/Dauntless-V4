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
const Quest = require('../../models/quest');
const Monsters = require('../../data/monster'); // assuming you have a separate file with all monsters and their data
const Title = require('../../models/title');

const {checkLevelUp} = require('../../utils/xpUtils');

module.exports = {
    name: 'quest',
    description: 'Complete your daily commision.',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Market action you want to perform',
            choices: [
                { name: 'View Quest', value: 'view' },
                { name: 'Submit', value: 'submit' },
                // Additional choices can be added later for buy, sell, etc.
            ],
            required: true,
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

            let existingQuest = await Quest.findOne({ userId: interaction.user.id });
            if (!existingQuest) {
                // Initial hunting range
                let minLevel = user.huntingLevel + user.huntingBonus - 10;
                let maxLevel = user.huntingLevel + user.huntingBonus + 10;
            
                let eligibleMonsters = await Monsters.find({
                    levelRequirement: { $gte: minLevel, $lte: maxLevel }
                });
            
                // If no monsters found, expand the range by 10
                if (eligibleMonsters.length === 0) {
                    minLevel -= 10;
                    maxLevel += 10;
            
                    eligibleMonsters = await Monsters.find({
                        levelRequirement: { $gte: minLevel, $lte: maxLevel }
                    });
                }
            
                // If still no monsters found, consider all monsters
                if (eligibleMonsters.length === 0) {
                    eligibleMonsters = await Monsters.find({});
                }
            
                const randomMonster = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)];
            
                // Ensure the chosen monster has drops
                if (!randomMonster.drops || randomMonster.drops.length === 0) {
                    // Handle the scenario where the chosen monster doesn't have drops (Optional)
                    return;
                }
            
                // Randomly select one of the drops
                const randomDrop = randomMonster.drops[Math.floor(Math.random() * randomMonster.drops.length)];
            
                let itemName = '';
            
                // Check if the drop is a Material
                const materialDrop = await Material.findById(randomDrop) || Equipment.findById(randomDrop);
                if (materialDrop) {
                    itemName = materialDrop.name;
                }
                else{
                    const embed = new EmbedBuilder() // Assuming you are using Discord.js MessageEmbed
                    .setTitle('Error: Failed Quest Assignment')
                    .setDescription(`Item Name could not be accessed (not found). Error in database. Please inform the developer~`)
                    // You can add more embed fields if required
                    .setColor('Red');
                
                    return interaction.editReply({embeds: [embed]});
                }
            
                // Randomly choose a quantity between 1 and 3
                const randomQuantity = Math.floor(Math.random() * 3) + 1;
                const reward = materialDrop.price * randomQuantity * 3;
            
                // Create and save the new quest
                const newQuest = new Quest({
                    userId: interaction.user.id,
                    itemName: itemName,
                    quantity: randomQuantity,
                    reward: reward,
                    completed: false,
                    date: new Date()
                });
            
                await newQuest.save();
                existingQuest = newQuest;
                await existingQuest.save();
            }
            else{
                const now = new Date();
                const timeSinceLastQuest = now.getTime() - existingQuest.date.getTime();
                const daysSinceLastQuest = Math.floor(timeSinceLastQuest / (24 * 60 * 60 * 1000));

                // If at least one day has passed since the quest creation
                if (daysSinceLastQuest >= 1) {
                    // Move the quest creation time forward by the number of days since last quest
                    existingQuest.date = new Date(existingQuest.date.getTime() + (daysSinceLastQuest * 24 * 60 * 60 * 1000));

            
                    // Now we will update the quest details just like we did for a new quest
                    let minLevel = user.huntingLevel + user.huntingBonus - 10;
                    let maxLevel = user.huntingLevel + user.huntingBonus + 10;
            
                    let eligibleMonsters = await Monsters.find({
                        levelRequirement: { $gte: minLevel, $lte: maxLevel }
                    });
            
                    if (eligibleMonsters.length === 0) {
                        minLevel -= 10;
                        maxLevel += 10;
            
                        eligibleMonsters = await Monsters.find({
                            levelRequirement: { $gte: minLevel, $lte: maxLevel }
                        });
                    }
            
                    if (eligibleMonsters.length === 0) {
                        eligibleMonsters = await Monsters.find({});
                    }
            
                    const randomMonster = eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)];
            
                    if (!randomMonster.drops || randomMonster.drops.length === 0) {
                        return; // Optional: Handle no drops scenario
                    }
            
                    const randomDrop = randomMonster.drops[Math.floor(Math.random() * randomMonster.drops.length)];
            
                    let itemName = '';
            
                    const materialDrop = await Material.findById(randomDrop) || Equipment.findById(randomDrop);
                    if (materialDrop) {
                        itemName = materialDrop.name;
                    }
                    else{
                        const embed = new EmbedBuilder() // Assuming you are using Discord.js MessageEmbed
                        .setTitle('Error: Failed Quest Assignment')
                        .setDescription(`Item Name could not be accessed (not found). Error in database. Please inform the developer~`)
                        // You can add more embed fields if required
                        .setColor('Red');
                    
                        return interaction.editReply({embeds: [embed]});
                    }
            
                    const randomQuantity = Math.floor(Math.random() * 3) + 1;
                    const reward = materialDrop.price * randomQuantity * 3;
            
                    // Update the existing quest with new values
                    existingQuest.itemName = itemName;
                    existingQuest.quantity = randomQuantity;
                    existingQuest.reward = reward;
                    existingQuest.completed = false;
            
                    await existingQuest.save();
                }
            }
            
            if (action === 'view') {
                const now = new Date();
                const questResetTime = new Date(existingQuest.date.getTime() + (24 * 60 * 60 * 1000)); // 24 hours after quest creation
            
                if (!existingQuest.completed) {
                    // Calculate time remaining
                    const timeDiff = questResetTime - now; // in milliseconds
                    const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
                    const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            
                    const embed = new EmbedBuilder() // Assuming you are using Discord.js MessageEmbed
                        .setTitle('Daily Quest')
                        .setDescription(`Complete assigned commissions every 24 hours by hunting monsters and turning in drops for doros. I'll be seeing you then. Be careful out there.\n\nAcquire \`${existingQuest.quantity} x ${existingQuest.itemName}\`\nReward: \`${existingQuest.reward}\` Doros\n\nTime Remaining: \`${hoursRemaining}h : ${minutesRemaining}m\``)
                        // You can add more embed fields if required
                        .setColor('Blue');
                    
                    return interaction.editReply({embeds: [embed]}) // Or however you send embeds in your setup
                } else {
                    const hoursTillNextQuest = Math.floor((questResetTime - now) / (1000 * 60 * 60));
                    const minutesTillNextQuest = Math.floor(((questResetTime - now) % (1000 * 60 * 60)) / (1000 * 60));

                    const embed = new EmbedBuilder() // Assuming you are using Discord.js MessageEmbed
                        .setTitle('Daily Quest')
                        .setDescription(`Today's daily commision has been completed! Come back in \`${hoursTillNextQuest}h : ${minutesTillNextQuest}m\` for a new quest.`)
                        // You can add more embed fields if required
                        .setColor('Blue');
                    
                    return interaction.editReply({embeds: [embed]}) // Or however you send embeds in your setup
                }            
            }
            else if (action === 'submit') {
                if(!existingQuest){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Quest does not exist')
                            .setDescription("Unable to find Quest, report error to the developer")
                        interaction.editReply({embeds: [embed]})
                        return;
                }
                if(!existingQuest.completed){
                    const userInventory = await Inventory.findOne({ userId: user.userId });
                    if (!userInventory) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Inventory does not exist')
                            .setDescription("Unable to find inventory, report error to the developer")
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    const targetEquipmentX = await Equipment.findOne({ name: { $regex: new RegExp("^" + existingQuest.itemName + "$", "i") }, userId: null  });
                    const targetMaterialX = await Material.findOne({ name: { $regex: new RegExp("^" + existingQuest.itemName + "$", "i") }, userId: null  });
                    const targetItemX = targetEquipmentX || targetMaterialX;

                    const targetEquipment = await Equipment.findOne({ name: { $regex: new RegExp("^" + existingQuest.itemName + "$", "i") }, userId: user.userId  });
                    const targetMaterial = await Material.findOne({ name: { $regex: new RegExp("^" + existingQuest.itemName + "$", "i") }, userId: user.userId  });
                    const targetItem = targetEquipment || targetMaterial;

                    if(!targetItemX){
                        const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Invalid Item')
                                .setDescription(`Item '${existingQuest.itemName}' does not exist within Dauntless, report to developer`)
                            interaction.editReply({embeds: [embed]})
                            return;
                    }

                    if (!targetItem || !(userInventory.equipment.includes(targetItem._id) || userInventory.materials.includes(targetItem._id))) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`Error: ${existingQuest.itemName} is not in possession`)
                            .setDescription(`You don't have any '${existingQuest.itemName}' in your inventory to submit for this quest. Scam me one more time and watch`)
                            .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    if (targetItem.quantity < existingQuest.quantity) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Amount for submission')
                            .setDescription(`You only have ${targetItem.quantity} of ${existingQuest.itemName}. You can't submit ${existingQuest.quantity} dumbass.`)
                        interaction.editReply({embeds: [embed]})
                        return;
                    }

                    if (targetItem.quantity === existingQuest.quantity) {
                        if (targetEquipment) userInventory.equipment.remove(targetEquipment._id) && await Equipment.findByIdAndRemove(targetEquipment._id);
                        if (targetMaterial) userInventory.materials.remove(targetMaterial._id) && await Material.findByIdAndRemove(targetMaterial._id);
                    } else {
                        targetItem.quantity -= existingQuest.quantity;
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
                    
                    let tax = Math.floor((existingQuest.reward) * 0.20)
                    let taxStatement;
                    const taxItemExist = await Usables.findOne({ name: taxItem.name, userId: user.userId });
                    if (taxItemExist) {
                        user.balance += existingQuest.reward;
                        taxStatement = "You also successfully evaded Dauntless Tax! Good job.";
                    } else {
                        user.balance += (existingQuest.reward )- tax;
                        bank.balance += tax
                        await bank.save();
                        taxStatement = `Dauntless will charge a rounded 20% tax on these rewards (${tax} Doros)`
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
                        .setTitle(`Quest Completion: Submitted ${existingQuest.itemName} x ${existingQuest.quantity}`)
                        .setDescription(`Successfully completed your daily quest.\n\n Recieved ${existingQuest.reward} Doros\n\n${taxStatement}${titleAssignment}`)
                    interaction.editReply({embeds: [embed]});
                    existingQuest.completed = true;
                    await existingQuest.save()

                }
                else{
                    const now = new Date();
                    const questResetTime = new Date(existingQuest.date.getTime() + (24 * 60 * 60 * 1000)); // 24 hours after quest creation
                    const hoursTillNextQuest = Math.floor((questResetTime - now) / (1000 * 60 * 60));
                    const minutesTillNextQuest = Math.floor(((questResetTime - now) % (1000 * 60 * 60)) / (1000 * 60));
                    
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`Quest Error: Daily Quest Completed`)
                        .setDescription(`Today's daily quest has been completed! Come back in ${hoursTillNextQuest}h ${minutesTillNextQuest}m for a new quest.`)
                    interaction.editReply({embeds: [embed]});
                }
            }
            else{
                console.log("invalid command addition");
            }
    

        } catch (error) {
            console.log(`Error in /quest view: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Quest could not be accessed`)
                        .setDescription(`Quest could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
