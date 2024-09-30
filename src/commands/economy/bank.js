const { Client, Interaction,  EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const Bank = require('../../models/bank');

module.exports = {
    name: 'bank',
    description: 'Displays dauntless bank',
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

            const bank = await Bank.findOne({name: "Dauntless"})

            if(!bank){
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Developer Error')
                    .setDescription("Error with dauntless bank, please report to developer.")
                interaction.editReply({embeds: [embed]})
                return;

            }

            const embed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle(`Bank Of Dauntless`)
                .setDescription(`Displays the accumulation of user recieved tax and accumulative lottery globally. This presents the current pool applicable to be won by all users.`)
                .addFields({name: "State Bank Account", value: `\`\`\`Balance: ${bank.balance} Doros \`\`\``})
                .addFields({name: "Accumulated Lottery", value: `\`\`\`Lottery: ${bank.lottery} Doros \`\`\``})
                
                
            interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.log(`Error in /balance: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Balance could not be accessed`)
                        .setDescription(`Balance could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
