const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Material = require('../../models/material');
const Usable = require('../../models/usable');
const Bank = require('../../models/bank');
const Effect = require('../../models/effect');
const Title = require('../../models/title');
const {checkLevelUp} = require('../../utils/xpUtils');
const StealHistory = require('../../models/stealHistory');
const { formatDate } = require('../../utils/formatDate');

module.exports = {
    name: 'scorecard',
    description: 'Attempt to steal from another user',
    options: [
        {
            name: 'user',
            type: ApplicationCommandOptionType.User,
            description: 'Stats related to this user',
            required: false
        },
    ],
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();
            
            const targetId = interaction.options.getUser('user') || null;
            
            // Fetching the thief and target data from the database.
            const thief = await User.findOne({ userId: interaction.user.id });

            let target;

            if(targetId){
                target = await User.findOne({ userId: targetId.id });
            }
            
            if (!thief) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Register with the Dauntless Bank (/register) attempting a theft.")
                interaction.editReply({embeds: [embed]})
                return;
            }
            
            if (targetId && !target) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("The target user does not exist/ or is not registered.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }

            const stealHistory = await StealHistory.findOne({ userId: interaction.user.id });

            if(!stealHistory){
                const newHistory = new StealHistory({
                    userId: interaction.user.id,
                });
                await newHistory.save();

                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Unregistered Thief')
                    .setDescription("You were not registered in the thieves guild, registering you now. Try using this command again.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            if (targetId) {
                stealHistory.history = stealHistory.history.filter(heist => heist.userId === targetId.id);
            }

            // Generate the embed for the stealing history
            const generateEmbed = async (start, userId, targetId) => {
                console.log("here")
                const embed = new EmbedBuilder()
                    .setColor("DarkGold")
                    .setTitle(`${userId === interaction.user.id ? "Your" : "Their"} Heist Scorecard`);

                // Add overall or specific user statistics based on whether a targetId is present
                if (!targetId) {
                    const amountStolenFromUser = await StealHistory.aggregate([
                        {
                            $unwind: "$history"
                        },
                        {
                            $match: {
                                "history.userId": thief.userId,
                                "history.heistNetGain": { $lt: 0 } // since a negative value represents a loss
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalStolen: { $sum: "$history.heistNetGain" }
                            }
                        }
                    ]);
                    console.log("here")
                    const totalStolen = (amountStolenFromUser[0] && amountStolenFromUser[0].totalStolen) || 0;
                
                    embed.setDescription(`
                        View your fame in the thieves guild ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ
                        \`\`\`Total Gain: ${stealHistory.totalGain} Doros\`\`\`\`\`\`Total Loss: -${stealHistory.totalLoss} Doros\`\`\`\`\`\`Total Stolen From You: ${totalStolen} Doros\`\`\`\`\`\`Total Heists: ${stealHistory.history.length}\`\`\`
                    `);
                } else {
                    const heistsAgainstTarget = stealHistory.history.filter(heist => heist.userId === targetId.id);
                    const winsAgainstTarget = heistsAgainstTarget.filter(heist => heist.result).length;
                    const lossesAgainstTarget = heistsAgainstTarget.length - winsAgainstTarget;
                    embed.setDescription(`
                        View your fame in the thieves guild ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ
                        \`\`\`Wins against @${capitalizeFirstLetter(targetId.username)}: ${winsAgainstTarget}\`\`\` \`\`\`Losses against @${capitalizeFirstLetter(targetId.username)}: ${lossesAgainstTarget}\`\`\`
                    `);
                }
                console.log("here")
                const current = stealHistory.history.slice(start, start + 5);
                let historyStatement = "";
                
                if (stealHistory.history.length > 0) {
                    for (let heist of current) {
                        let status = heist.result ? "Success" : "Failure";
                        if (heist.heistNetGain === 0) status = "Partial Failure";
                        let username = "Undefined";
                        try {
                            username = (await client.users.fetch(heist.userId)).username;
                        } catch (error) {
                            username = 'Undefined';
                        }
                        historyStatement += `\`\`\`Attempt: On @${capitalizeFirstLetter(username)} (${status}) [${formatDate(heist.heistDate)}] `;
                
                        if (heist.heistNetGain > 0) {
                            historyStatement += `\nResult: Succesfully stole ${heist.heistNetGain} Doros\`\`\``;
                        } else if (heist.heistNetGain < 0) {
                            historyStatement += `\nResult: Embarrassingly lost ${heist.heistNetGain} Doros\`\`\``;
                        } else {
                            historyStatement += `\nResult: Escaped from the police scot free.\`\`\``;
                        }
                    }
                } else {
                    historyStatement = "```No heists yet```";
                }
                console.log(historyStatement)
                embed.addFields({
                    name: `Heist History:`,
                    value: historyStatement
                });
                console.log("here")
                embed.setFooter({ text: `Page ${start / 5 + 1} of ${Math.ceil(stealHistory.history.length / 5)}` });
                return embed;
            };

            const scorecardMessage = await interaction.editReply({
                embeds: [await generateEmbed(0, interaction.user.id, targetId)],
                fetchReply: true,
            });
            await scorecardMessage.react('⬅️');
            await scorecardMessage.react('➡️');

            const filter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;

            let page = 0;

            const collector = scorecardMessage.createReactionCollector({ filter, time: 50000 });
            collector.on('collect', async (reaction) => {
                reaction.users.remove(interaction.user.id);
                if (reaction.emoji.name === '➡️') {
                    if (page < stealHistory.history.length - 5) page += 5;
                } else if (reaction.emoji.name === '⬅️') {
                    if (page > 0) page -= 5;
                }

                interaction.editReply({ embeds: [await generateEmbed(page, interaction.user.id, targetId)] });
            });

            
        } catch (error) {
            console.log(`Error with /scorecard: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Scorecard could not be accessed`)
                        .setDescription(`/Scorecard could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
}
