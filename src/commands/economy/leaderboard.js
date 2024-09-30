const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const User = require('../../models/user');

module.exports = {
    name: 'leaderboard',
    description: 'View the leaderboards',
    options: [
        
    ],
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            let users;
            users = await User.find().sort({ balance: -1 }).limit(5); // Top 5 globally
            
            const leaderboardBalance = users.map((user, index) => `${index + 1}. <@${user.userId}> - ${user.balance} Doros`).join('\n');
            
            // Fetch all users and convert to array
            const allUsers = await User.find().lean().exec();
            
            allUsers.sort((a, b) => {
                const aScore = a.combat + a.combatBonus + a.laborLevel + a.huntingLevel + a.luckLevel + a.strengthLevel + 
                               a.mentalityLevel + a.dexterityLevel + a.defenseLevel + a.laborBonus + a.huntingBonus + 
                               a.luckBonus + a.strengthBonus + a.mentalityBonus + a.dexterityBonus + a.defenseBonus;
                const bScore = b.combat + b.combatBonus + b.laborLevel + b.huntingLevel + b.luckLevel + b.strengthLevel + 
                               b.mentalityLevel + b.dexterityLevel + b.defenseLevel + b.laborBonus + b.huntingBonus + 
                               b.luckBonus + b.strengthBonus + b.mentalityBonus + b.dexterityBonus + b.defenseBonus;
                return bScore - aScore;
            });
            
            // Limit to top 5
            const martialUsers = allUsers.slice(0, 5);
            
            const leaderboardMartial = martialUsers.map((user, index) => {
                const userScore = user.combat + user.combatBonus + user.laborLevel + user.huntingLevel + user.luckLevel + 
                                  user.strengthLevel + user.mentalityLevel + user.dexterityLevel + user.defenseLevel + 
                                  user.laborBonus + user.huntingBonus + user.luckBonus + user.strengthBonus + 
                                  user.mentalityBonus + user.dexterityBonus + user.defenseBonus;
                return `${index + 1}. <@${user.userId}> - ${userScore} Aggregate`;
            }).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor("Gold")
                .setTitle(`Dauntless Global Leaderboards`)
                .setDescription(`Top 5 Dauntless Bank Users:\n\n${leaderboardBalance}\n\nTop 5 Martial Masters (Stat Summation):\n\n${leaderboardMartial}`);
            
            return interaction.editReply({ embeds: [embed] });
            
            

        } catch (error) {
            console.error(`Error in /leaderboard: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Leaderboards could not be accessed`)
                        .setDescription(`Leaderboards could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
