const { Client, Interaction, EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const Bank = require('../../models/bank');

module.exports = {
    name: 'help',
    description: 'Get a summary of dauntless commands',
    /**
    *
    * @param {Client} client
    * @param {Interaction} interaction
    */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const embed = new EmbedBuilder()
                .setColor('Purple')
                .setTitle('Dauntless Command Guide')
                .setDescription('A comprehensive guide to the commands in the world of Dauntless. Use /wiki item: `guide`, for a quick overview of how to get started.')
                .addFields(
                    { name: '📖 **Incantations**', value: '`attunement` - Attune your spells.\n`covenant` - Access the Mage Tower archives. ' },
                    { name: '💰 **Economy**', value: '`auction` - Player market. \n`balance` - View your financial status and growth\n`bank` - View the financial status of Dauntless. \n`daily` - Claim your daily doros and XP. \n`leaderboard` - Check the dautnless rankings.\n`quest` - Complete your daily quest \n`register` - Register for the Dauntless bank. \n`stocks` - Dive into the stock market. \n`trade` - Engage in barter. \n`work` - Work for doros.' },
                    { name: ':game_die: **Gambling**', value: '`blackjack` - Challenge in a game of blackjack.\n`Dice` - Choose a number between 1 - 6 and pray\n`Slots` - Choose a bet and hope the slots are in your favour' },
                    { name: '⚔️ **Combat**', value: '`duel` - Challenge warriors. \n`hunt` - Hunt monsters. \n`steal` - Attempt to steal from users. \n`scorecard` - View youre previous heist histories and revel in your glory' },
                    { name: ':shopping_cart: **The Underground Market**', value: '\n`forge` - Access your forge. \n`market` - Access the underground commerce.' },
                    { name: '🎒 **Inventory**', value: '`equipment` - Access your gear. \n`inventory` - Check your belongings. \n`use` - Utilize items.' },
                    { name: '📜 **Information**', value: '`check` - Check command time / token restrictions.\n`job` - Choose your profession. \n`message` - Check the message board. \n`status` - View your stats. \n`wiki` - Access Dauntless Encyclopedia. (All commands and items)' }
                )
                .setFooter({text: 'Use `/wiki [command]` for detailed information on each command.\nInvite Dauntless to your server: '});

            interaction.editReply({ embeds: [embed] });
                
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Help could not be accessed`)
                        .setDescription(`/Help could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
