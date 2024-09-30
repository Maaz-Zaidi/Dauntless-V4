const { Client, Interaction, ApplicationCommandOptionType, ChatInputCommandInteraction, Events, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder, TextInputBuilder, TextInputStyle, ModalBuilder} = require('discord.js');

module.exports = {
    name: 'captcha',
    description: 'captcha option button (edited)',
    callback: async (client, interaction) => {
        try {

            const str = "A moth that is active during the nighttime. Its powdery wings reflect moonlight, giving it a ghostly appearance."
            client

            const initiatorEmbed = new EmbedBuilder()
                .setTitle(`Test Captcha!`)
                .setDescription("Testing the captcha\nCurrent Status: Havn't started")
                
            const capButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId("capButton")
                    .setLabel("Submit")
                    .setStyle(ButtonStyle.Danger))

            const capModal = new ModalBuilder()
            .setTitle("Submit Answer")
            .setCustomId("capModal")

            const answer = new TextInputBuilder()
            .setCustomId("answer")
            .setLabel("Type your guess:")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Submit Answer")

            const firstActionRow = new ActionRowBuilder().addComponents(answer)

            capModal.addComponents(firstActionRow)

            
            const reply = await interaction.reply({
                embeds: [initiatorEmbed],
                components: [capButton],
            });
            // await interaction.showModal(capModal);

            const filter = (i) => i.user.id === interaction.user.id; // replace 'YOUR_BUTTON_CUSTOM_ID' with the customId you set for your button

            const collector = reply.createMessageComponentCollector({filter, time: 10000});

            collector.on('collect', async i => {
                if (i.customId === 'capButton'){
                    console.log("about to show modal")
                    await i.showModal(capModal);

                    const filterModal = (int) => int.user.id === interaction.user.id && int.isModalSubmit() && int.customId === 'capModal';

                    // Await the modal interaction with an increased timeout for testing
                    try {
                        const modalInteraction = await i.awaitModalSubmit({ filter: filterModal, max: 1, time: 30000, errors: ['time'] });
                        
                        const answered = modalInteraction.fields.getTextInputValue('answer');

                        console.log(answered)

                        modalInteraction.deferUpdate();
                        
                        
                        if (answered === "rain") {
                            await reply.edit({ embeds: [initiatorEmbed], components: [], fetchReply: true});
                            const embed = new EmbedBuilder()
                                .setColor('Green')
                                .setTitle(`Test Captcha!`)
                                .setDescription("Current Status: Correct Answer!")
                                
                            return interaction.followUp({
                                embeds: [embed],
                                components: [],
                            });
                            
                        } else {
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Test Captcha!`)
                                .setDescription("Current Status: Wrong Answer!")
                                
                            return interaction.followUp({
                                embeds: [embed],
                            });
                        }
                    } catch (error) {
                        await reply.edit({ embeds: [initiatorEmbed], components: [], fetchReply: true});
                        console.log('User did not respond in time.', error);
                        const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Test Captcha!`)
                                .setDescription("Testing the captcha\nCurrent Status: Timed Out!")
                                
                            return interaction.followUp({
                                embeds: [embed],
                                components: [],
                            });
                    }
                
                }
            })

            collector.on('end', async i => {
                console.log(`collected end`)

                await reply.edit({ embeds: [initiatorEmbed], components: [], fetchReply: true});
                        console.log('User did not respond in time.');
                        const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Test Captcha!`)
                                .setDescription("Testing the captcha\nCurrent Status: Timed Out!")
                                
                            return interaction.followUp({
                                embeds: [embed],
                                components: [],
                            });
            })
        } catch (error) {
            console.error(`Error in /leaderboard: ${error}`);
            return interaction.editReply('There was an error fetching the leaderboard. Please try again.');
        }
    }
};