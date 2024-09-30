const { Client, Interaction, EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const axios = require('axios');
async function generateLineGraphURL(data) {
    const config = {
        type: 'line',
        data: {
            labels: Array.from({ length: data.length }, (_, i) => i + 1),
            datasets: [{
                data: data,
                borderColor: 'lightblue',
                borderWidth: 3,  // Increase the width of the line
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 16   // Increase font size
                        }
                    },
                },
                x: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 16  // Increase font size
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 16   // Increase font size
                        }
                    }
                }
            }
        }
    };

    const response = await axios.get('https://quickchart.io/chart', {
        params: {
            c: JSON.stringify(config)
        }
    });

    return response.request.res.responseUrl;
}

module.exports = {
    name: 'balance',
    description: 'Displays user balance and history',
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        try {
            // Helper function to capitalize the first letter of a string
            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            

            await interaction.deferReply();
            const query = { userId: interaction.user.id };
            const user = await User.findOne(query);

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({ embeds: [embed] });
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`${capitalizeFirstLetter(interaction.user.displayName)}'s Balance`)
                .setDescription(`\`\`\`Account Balance: ${user.balance} Doros\`\`\``);

            if (user.balanceHistory && user.balanceHistory.length) {
                const chartURL = await generateLineGraphURL(user.balanceHistory.reverse());
                embed.setImage(chartURL);
            } else {
                embed.addField("Balance History", "\`\`\`No balance updates found.\`\`\`");
            }

            interaction.editReply({ embeds: [embed] });

        } catch (error) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error: Unexpected Issue')
                .setDescription("An unexpected error occurred. Please try again later.");
            interaction.editReply({ embeds: [embed] });
            console.error(error);
        }
    }
};
