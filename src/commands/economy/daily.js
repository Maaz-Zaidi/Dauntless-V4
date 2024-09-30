const { Client, Interaction, EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const Bank = require('../../models/bank');
const { checkLevelUp } = require('../../utils/xpUtils');
const Usables = require('../../models/usable');
const Title = require('../../models/title');

module.exports = {
    name: 'daily',
    description: 'Claim your daily doros!',
    /**
    *
    * @param {Client} client
    * @param {Interaction} interaction
    */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const user = await User.findOne({ userId: interaction.user.id });

            // Ensure the user is registered before they can claim daily doros
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
                    .setDescription("Error with dauntless bank, please report to developer.")
                interaction.editReply({embeds: [embed]})
                return;

            }

            const timeSinceLastDaily = new Date() - user.lastDaily;

            // If the user has already claimed their daily doros in the last 24 hours, inform them of their cooldown
            if (user.lastDaily && timeSinceLastDaily < 24 * 60 * 60 * 1000) {
                const hoursLeft = Math.round((24 * 60 * 60 * 1000 - timeSinceLastDaily) / (60 * 60 * 1000));
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Already Claimed')
                    .setDescription(`You've already claimed your daily doros! Please wait ${hoursLeft} more hour(s) to claim again.`)
                interaction.editReply({embeds: [embed]})
                return;
            }

            user.lastDaily = new Date();

            

            // Logic to determine the random amount of doros and add to the user's balance
            const dorosEarned = Math.floor(Math.random() * (800 - 200 + 1) + 200);

            let itemName = "Tax Evasion";
            const targetItem = await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true });
                
            if (!targetItem) {
                interaction.editReply(`Item: ${itemName} does not exist in the database`);
                return;
            }
            let tax = Math.floor((dorosEarned) * 0.20)
            let taxStatement;
            const existingItem = await Usables.findOne({ name: targetItem.name, userId: user.userId });
            if (existingItem) {
                user.balance += dorosEarned ;
                taxStatement = "\n\nYou also successfully evaded Dauntless Tax! Good job.";
            } else {
                user.balance += dorosEarned - tax;
                bank.balance += tax
                await bank.save();
                taxStatement = `\n\nDauntless will charge a rounded 20% tax on these gifts (${tax} Doros)`
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
                const userInventory = await Inventory.findOne({ userId: user.userId });
                    
                if (!userInventory) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Inventory does not exist')
                    .setDescription("Unable to find inventory, report error to the developer")
                interaction.editReply({embeds: [embed]})
                return;

                }
                const newItemData = {...newTitleMoneyBags._doc};  // _doc gives you the properties of the mongoose document
                                    
                newItemData.userId = user.userId;
                delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                const newItem = new Title(newItemData);
                await newItem.save();
                userInventory.titles.push(newItem._id)
                await userInventory.save()

                titleAssignment += "\n\nGained the title: *\"Mr. MoneyBags\"*"
            }

            // Save the updated user data
            await user.save();
            await bank.save();

            const xpEarned = Math.floor(Math.random() * 400) + 1;
            xpType = ['labor', 'mentality', 'strenght', 'luck', 'hunting', 'dexterity', 'defense'][Math.floor(Math.random() * 7)];
            user[xpType + 'Xp'] += xpEarned;
            // Handle XP and Level logic
            const result = checkLevelUp(user[xpType + 'Xp'], user[xpType + 'Level'] , user[xpType + 'Bonus']);
            user[xpType + 'Xp'] = result.xp;
            user[xpType + 'Level'] = result.level;
            await user.save();

            const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Success: Claimed Daily`)
                        .setDescription(`You've successfully claimed your dauntless daily: Earned \`${dorosEarned} doros\` and gained \`${xpEarned} ${xpType.charAt(0).toUpperCase() + xpType.slice(1)} XP \`. I'll be seeing you then. Be careful out there.${taxStatement}${titleAssignment}`)
                        return interaction.editReply({embeds: [embed]});
                
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Daily could not be accessed`)
                        .setDescription(`/Daily could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
