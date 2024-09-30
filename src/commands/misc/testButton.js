const { Client, Interaction, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder} = require('discord.js');
const User = require('../../models/user');
const Equipment = require('../../models/equipment');

const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs/promises');




const choices = [
    {name: 'Test'}
]

function splitDescription(description, maxLength) {
    const words = description.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length <= maxLength) {
            currentLine += word + ' ';
        } else {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        }
    });

    if (currentLine) lines.push(currentLine.trim());

    // Check if there's a line that completely fills out the max character rate
    const hasFullLine = lines.some(line => 
        line.length >= maxLength - 2 && line.length <= maxLength + 2
    );

    // If not, adjust one of the lines to fit
    if (!hasFullLine && lines.length > 1) {
        let longestLineIndex = lines.reduce((maxIdx, line, idx, arr) => 
            line.length > arr[maxIdx].length ? idx : maxIdx, 0
        );
        const extraChars = maxLength - lines[longestLineIndex].length;

        if (extraChars > 0 && longestLineIndex < lines.length - 1) {
            let nextLineWords = lines[longestLineIndex + 1].split(' ');
            let wordsToMove = 0;
            let lengthToAchieve = lines[longestLineIndex].length + extraChars;

            while (lines[longestLineIndex].length < lengthToAchieve && nextLineWords.length > 0) {
                lines[longestLineIndex] += ' ' + nextLineWords.shift();
                wordsToMove++;
            }

            if (wordsToMove > 0) {
                lines[longestLineIndex + 1] = nextLineWords.join(' ');
            }
        }
    }

    return lines.join('\n');
}


async function processImage(imgPath, targetRatio) {
    const metadata = await sharp(imgPath).metadata();
    let newWidth, newHeight;

    const imgRatio = metadata.width / metadata.height;

    if (imgRatio > targetRatio) {
        // Image is wider than desired ratio, adjust width
        newWidth = metadata.height * targetRatio;
        newHeight = metadata.height;
    } else {
        // Image is taller or equal to desired ratio, adjust height
        newWidth = metadata.width;
        newHeight = metadata.width / targetRatio;
    }

    const imgBuffer = await sharp(imgPath)
        .resize({ width: Math.round(newWidth), height: Math.round(newHeight), position: 'center' })
        .toBuffer();

    return imgBuffer;
}



module.exports = {
    name: 'test',
    description: 'test option button (edited)',
    callback: async (client, interaction) => {
        try {

            const type = interaction.options.getString('type') || 'global';

            const user = await User.findOne({userId: interaction.user.id});

            const str = "A moth that is active during the nighttime. Its powdery wings reflect moonlight, giving it a ghostly appearance."
            const imgLink = '../../Images/hanyoo.jpeg'

            const maxDescriptionLengthPerLine = 52; // adjust as needed
            const splitDesc = splitDescription(str, maxDescriptionLengthPerLine);

            const path = require('path');
            const absolutePath = path.resolve(__dirname, '../../Images/undeadsoldier.jpeg');
            console.log(absolutePath);
                        
            const imgBuffer = await processImage(absolutePath, 15/16);

            const embed = new EmbedBuilder()
                .setTitle(`Test buttons!`)
                .setDescription(splitDesc)
                .setImage('attachment://processedImage.jpeg');  // Give a name for the buffer 

            const buttons = choices.map((choice) => {
                return new ButtonBuilder()
                    .setCustomId(choice.name)
                    .setLabel(choice.name)
                    .setStyle(ButtonStyle.Secondary)
            });

            const row = new ActionRowBuilder().addComponents(buttons);

            const reply = await interaction.reply({
                embeds: [embed],
                components: [row],
                files: [{ attachment: imgBuffer, name: 'processedImage.jpeg' }]  // Adding the image buffer directly here
            });

        

            const filter = (i) => true; // replace 'YOUR_BUTTON_CUSTOM_ID' with the customId you set for your button

            const collector = reply.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async (i) => {
                

                if(i.user.id === interaction.user.id){
                    console.log(i.user.id); // This will print the name of the user who clicked the button
                    embed.setDescription("latest recruit added " + i.user.username)
                    await i.update({ embeds: [embed], components: [row] });
                }
                else{
                    interaction.followUp({content: "You cannot respond to this", ephemeral: true});
                    await i.update({ embeds: [embed], components: [row] });
                }

                // If you want to reply or give feedback for every interaction, you can do so here. But ensure not to spam users.
                // await i.reply('Thanks for clicking!');
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp("Game over, you did not respond");
                }
                // remove buttons once done
                reply.edit({ embeds: [embed], components: [] });
            });

            

            // await targetUserInteraction.reply({ 
            //     content: `You picked ${targetUserChoice.name}`, 
            //     ephemeral: true
            // });

        } catch (error) {
            console.error(`Error in /leaderboard: ${error}`);
            return interaction.editReply('There was an error fetching the leaderboard. Please try again.');
        }
    }
};
