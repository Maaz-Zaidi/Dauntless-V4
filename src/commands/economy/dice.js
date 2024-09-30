const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/user');
const { checkLevelUp } = require('../../utils/xpUtils');
const Effect = require('../../models/effect');
const Title = require('../../models/title');

module.exports = {
    name: 'dice',
    description: 'Roll a dice. If it lands on your number, get double your bet!',
    options: [
        {
            name: 'bet',
            type: ApplicationCommandOptionType.Integer,
            description: 'The amount you want to bet to be doubled (1 by default)',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'number',
            type: ApplicationCommandOptionType.Integer,
            description: 'Dice number between 1 - 6 (1 by default)',
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

            const user = await User.findOne({ userId: interaction.user.id });

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            const energyEffect = await Effect.findOne({userId: interaction.user.id, effectedType: "Gambling"})
            const lastDiceTime = user.lastDice;
            const currentTime = new Date();

            // Calculate the difference in milliseconds
            const timeDifference = currentTime - lastDiceTime;

            // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
            const fiveMinutesInMilliseconds = 1 * 60 * 1000;

            if (!energyEffect && user.lastDice && timeDifference < fiveMinutesInMilliseconds) {
                const timeLeft = Math.round((fiveMinutesInMilliseconds - timeDifference) / 60000); // Convert the difference to minutes
                const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Halt: Time Restriction`)
                                .setDescription(`You need to wait \`${timeLeft} minute(s)\` before you can play dice again.`)
                            interaction.editReply({embeds: [embed]})
                            return;
            }

            user.lastDice = new Date();

            const betAmount = interaction.options.getInteger('bet') || 1;
            const diceValue = interaction.options.getInteger('number') || 1;
            
            if (user.balance < betAmount) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Betting Amount')
                        .setDescription("You don't have this much to bet retard, you cannot scam the scammer.")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
            }

            const diceResult = Math.floor(Math.random() * 6) + 1;

            if (diceResult === diceValue) {
                user.balance += betAmount;

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
                const xpgiven = Math.floor(Math.random() * Math.ceil(betAmount / 3)) + 1;

                user.luckXp += xpgiven;
                const result = checkLevelUp(user.luckXp, user.luckLevel , user.luckBonus);
                user.luckXp = result.xp;
                user.luckLevel = result.level;

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Success: You Won!')
                    .setDescription(`The dice rolled for an outlandish amount of time and ending up landing on ${diceValue}! You won \`${betAmount} doros.\` and succesfully gained \`${xpgiven} Luck XP\`${titleAssignment}`)
                interaction.editReply({embeds: [embed]});
            } else {
                user.balance -= betAmount;
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Failure: You Lost')
                    .setDescription(`The dice landed on ${diceResult}. You've lost ${betAmount} doros, but don't give up! I can smell your victory close! Just one more roll!`)
                interaction.editReply({embeds: [embed]});
            }

            // Save the updated user data
            await user.save();
                
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error: /Dice could not be accessed')
                .setDescription(`/Dice could not be accessed, report to the developer`)
            interaction.editReply({embeds: [embed]});
            return;
        }
    }
};
