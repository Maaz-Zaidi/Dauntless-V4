const { Client, Interaction,  EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const {checkLevelRequired} = require('../../utils/levelUtils');
const Title = require('../../models/title');

module.exports = {
    name: 'status',
    description: 'Displays user statistics and attributes',
    /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();
            const query = { userId: interaction.user.id };
            const user = await User.findOne(query);

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            const title = user.title ? await Title.findById(user.title) : null;
            let titleView = `No Title`;
            (title) ? titleView = `"${title.name}"` : titleView = `Titleless`; 

            const embed = new EmbedBuilder()
                .setTitle(`Dauntless User Status`)
                .setColor("Navy")
                .setAuthor({name: `${interaction.user.displayName}: ${titleView}`, iconURL: interaction.user.displayAvatarURL()})
                .setDescription(`Check ${interaction.user.displayName}'s level. Currently working as \`${user.currentJob.charAt(0).toUpperCase() + user.currentJob.slice(1)} worker\`. Note that you can also gain bonus levels with items and equipment.\n\n\`\`\`Total Health: ${user.hp} (+ ${user.hpBonus} Bonus)\`\`\` \`\`\`Total Stamina: ${user.stamina} (+ ${user.staminaBonus} Bonus)\`\`\` \`\`\`Combat Stength: ${user.combat} (+ ${user.combatBonus} Bonus)\`\`\``)
                .addFields({name: "User Labour:", value: `\`\`\`Level: ${user.laborLevel} (+ ${user.laborBonus} Bonus)\nCurrent XP: ${user.laborXp} / ${await checkLevelRequired(user.laborLevel + user.laborBonus, user.laborXp)}\`\`\``})
                .addFields({name: "User Hunting:", value: `\`\`\`Level: ${user.huntingLevel} (+ ${user.huntingBonus} Bonus)\nCurrent XP: ${user.huntingXp} / ${await checkLevelRequired(user.huntingLevel + user.huntingBonus, user.huntingXp)}\`\`\``})
                .addFields({name: "User Luck:", value: `\`\`\`Level: ${user.luckLevel} (+ ${user.luckBonus} Bonus)\nCurrent XP: ${user.luckXp} / ${await checkLevelRequired(user.luckLevel + user.luckBonus, user.luckXp)}\`\`\``})
                .addFields({name: "User Strength:", value: `\`\`\`Level: ${user.strengthLevel} (+ ${user.strengthBonus} Bonus)\nCurrent XP: ${user.strengthXp} / ${await checkLevelRequired(user.strengthLevel + user.strengthBonus, user.strengthXp)}\`\`\``})
                .addFields({name: "User Mentality:", value: `\`\`\`Level: ${user.mentalityLevel} (+ ${user.mentalityBonus} Bonus)\nCurrent XP: ${user.mentalityXp} / ${await checkLevelRequired(user.mentalityLevel + user.mentalityBonus, user.mentalityXp)}\`\`\``})
                .addFields({name: "User Dexterity:", value: `\`\`\`Level: ${user.dexterityLevel} (+ ${user.dexterityBonus} Bonus)\nCurrent XP: ${user.dexterityXp} / ${await checkLevelRequired(user.dexterityLevel + user.dexterityBonus, user.dexterityXp)}\`\`\``})
                .addFields({name: "User Defense:", value: `\`\`\`Level: ${user.defenseLevel} (+ ${user.defenseBonus} Bonus)\nCurrent XP: ${user.defenseXp} / ${await checkLevelRequired(user.defenseLevel + user.defenseBonus, user.defenseXp)}\`\`\``})

            interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.log(`Error in status: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Status could not be accessed`)
                        .setDescription(`Status could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
