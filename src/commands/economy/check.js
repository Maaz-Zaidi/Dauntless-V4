const { Client, Interaction,  EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const Effect = require('../../models/effect');
const {getTotalTokens} = require('../../utils/tokenUtils');

module.exports = {
    name: 'check',
    description: 'Checks current time restrictions for commands',
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

            let times = ""

            const timeSinceLastDaily = new Date() - user.lastDaily;

            // If the user has already claimed their daily doros in the last 24 hours, inform them of their cooldown
            if (user.lastDaily && timeSinceLastDaily < 24 * 60 * 60 * 1000) {
                const totalSecondsLeft = (24 * 60 * 60 * 1000 - timeSinceLastDaily) / 1000;
                const hoursLeft = Math.floor(totalSecondsLeft / 3600);
                const minutesLeft = Math.floor((totalSecondsLeft - hoursLeft * 3600) / 60);
                const secondsLeft = Math.round(totalSecondsLeft - hoursLeft * 3600 - minutesLeft * 60);

                times += `\`\`\`Refresh time for /daily || ${hoursLeft.toString().padStart(2, '0')}h : ${minutesLeft.toString().padStart(2, '0')}m : ${secondsLeft.toString().padStart(2, '0')}s\`\`\``;
            }
            
            else{
                times += `\`\`\`Refresh time for /daily || Now Available\`\`\``
            }

            const energyEffect = await Effect.findOne({userId: interaction.user.id, effectedType: "Work"})
            const lastWorkTime = user.lastWork;
            const currentTime = new Date();

            // Calculate the difference in milliseconds
            const timeDifference = currentTime - lastWorkTime;

            // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
            const fiveMinutesInMilliseconds = 5 * 60 * 1000;

            if (!energyEffect && user.lastWork && timeDifference < fiveMinutesInMilliseconds) {
                const timeLeft = Math.floor((fiveMinutesInMilliseconds - timeDifference) / 60000);
                const timeLeftSeconds = Math.round(((fiveMinutesInMilliseconds - timeDifference)  % (60 * 1000)) / 1000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /work  || 00h : 0${timeLeft}m : ${secCheck}s\`\`\``
            }
            else if(energyEffect){
                const lastEnergyTime = energyEffect.timeUsed;
                const energyDifference = currentTime - lastEnergyTime;
                const oneMinutesInMilliseconds = 1 * 60 * 1000;
                const timeLeftSeconds = Math.round(((oneMinutesInMilliseconds - energyDifference)  % (60 * 1000)) / 1000);
                const timeLeft = Math.floor((oneMinutesInMilliseconds - energyDifference) / 60000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /work  || [Energy drink effect ongoing (00h : 0${timeLeft}m : ${secCheck}s)]\`\`\``
            }
            else{
                times += `\`\`\`Refresh time for /work  || Now Available\`\`\``
            }

            const energyEffectHunt = await Effect.findOne({userId: interaction.user.id, effectedType: "Hunt"})
            const lastHuntTime = user.lastHunt;

            // Calculate the difference in milliseconds
            const timeDifferenceHunt = currentTime - lastHuntTime;

            // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
            const thirtyMinutesInMilliseconds = 30 * 60 * 1000;

            if (!energyEffectHunt && user.lastHunt && timeDifferenceHunt < thirtyMinutesInMilliseconds) {
                const timeLeft = Math.floor((thirtyMinutesInMilliseconds - timeDifferenceHunt) / 60000);
                const timeLeftSeconds = Math.round(((thirtyMinutesInMilliseconds - timeDifferenceHunt) % (60 * 1000)) / 1000);
                let timecheck = `${timeLeft}`;
                if (timeLeft < 10){
                    timecheck = `0${timeLeft}`
                }
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /hunt  || 00h : ${timecheck}m : ${secCheck}s\`\`\``
            }
            else if(energyEffectHunt){
                const lastEnergyTime = energyEffectHunt.timeUsed;
                const energyDifference = currentTime - lastEnergyTime;
                const oneMinutesInMilliseconds = 1 * 60 * 1000;
                const timeLeftSeconds = Math.round(((oneMinutesInMilliseconds - energyDifference) % (60 * 1000)) / 1000);
                const timeLeft = Math.floor((oneMinutesInMilliseconds - energyDifference) / 60000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /hunt  || [Energy drink effect ongoing (00h : 0${timeLeft}m : ${secCheck}s)]\`\`\``
            }
            else{
                user.huntAttempts = 0;
                user.huntTokens = 3;  // Resetting to 3 tokens
                await user.save();
                times += `\`\`\`Refresh time for /hunt  || Now Available\`\`\``
            }

            const energyEffectGambling = await Effect.findOne({userId: interaction.user.id, effectedType: "Gambling"})
            const lastDiceTime = user.lastDice;

            // Calculate the difference in milliseconds
            const timeDifferenceDice = currentTime - lastDiceTime;

            // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
            const oneMinutesInMilliseconds = 1 * 60 * 1000;

            if (!energyEffectGambling && user.lastDice && timeDifferenceDice < oneMinutesInMilliseconds) {
                const timeLeft = Math.floor((oneMinutesInMilliseconds - timeDifferenceDice) / 60000);
                const timeLeftSeconds = Math.round(((oneMinutesInMilliseconds - timeDifferenceDice) % (60 * 1000)) / 1000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /dice  || 00h : 0${timeLeft}m : ${secCheck}s\`\`\``
            }
            else if(energyEffectGambling){
                const lastEnergyTime = energyEffectGambling.timeUsed;
                const energyDifference = currentTime - lastEnergyTime;
                const oneMinutesInMilliseconds = 1 * 60 * 1000;
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                const timeLeft = Math.floor((oneMinutesInMilliseconds - energyDifference) / 60000);
                const timeLeftSeconds = Math.round(((oneMinutesInMilliseconds - energyDifference) % (60 * 1000)) / 1000);
                times += `\`\`\`Refresh time for /dice  || [Energy drink effect ongoing (00h : 0${timeLeft}m : ${secCheck}s)]\`\`\``
            }
            else{
                times += `\`\`\`Refresh time for /dice  || Now Available\`\`\``
            }

            const lastSlotsTime = user.lastSlot;

            // Calculate the difference in milliseconds
            const timeDifferenceSlots = currentTime - lastSlotsTime;

            if (!energyEffectGambling && user.lastSlot && timeDifferenceSlots < oneMinutesInMilliseconds) {
                const timeLeft = Math.floor((oneMinutesInMilliseconds - timeDifferenceSlots) / 60000);
                const timeLeftSeconds = Math.round(((oneMinutesInMilliseconds - timeDifferenceSlots) % (60 * 1000)) / 1000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /slots || 00h : 0${timeLeft}m : ${secCheck}s\`\`\``
            }
            else if(energyEffectGambling){
                const lastEnergyTime = energyEffectGambling.timeUsed;
                const energyDifference = currentTime - lastEnergyTime;
                const oneMinutesInMilliseconds = 1 * 60 * 1000;
                const timeLeftSeconds = Math.round(((oneMinutesInMilliseconds - energyDifference) % (60 * 1000)) / 1000);
                const timeLeft = Math.floor((oneMinutesInMilliseconds - energyDifference) / 60000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /slots || [Energy drink effect ongoing (00h : 0${timeLeft}m : ${secCheck}s)]\`\`\``
            }
            else{
                times += `\`\`\`Refresh time for /slots || Now Available\`\`\``
            }

            const energyEffectSteal = await Effect.findOne({userId: interaction.user.id, effectedType: "Steal"})
            const lastStealTime = user.lastSteal;

            // Calculate the difference in milliseconds
            const timeDifferenceSteal = currentTime - lastStealTime;

            if (!energyEffectSteal && user.lastSteal && timeDifferenceSteal < fiveMinutesInMilliseconds) {
                const timeLeft = Math.floor((fiveMinutesInMilliseconds - timeDifferenceSteal) / 60000);
                const timeLeftSeconds = Math.round(((fiveMinutesInMilliseconds - timeDifferenceSteal) % (60 * 1000)) / 1000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                times += `\`\`\`Refresh time for /steal || 00h : 0${timeLeft}m : ${secCheck}s\`\`\``
            }
            else if(energyEffectSteal){
                const lastEnergyTime = energyEffectSteal.timeUsed;
                const energyDifference = currentTime - lastEnergyTime;
                const oneMinutesInMilliseconds = 1 * 60 * 1000;
                const timeLeftSeconds = Math.round(((oneMinutesInMilliseconds - energyDifference) % (60 * 1000)) / 1000);
                let secCheck = `${timeLeftSeconds}`
                if (timeLeftSeconds < 10) {
                    secCheck = `0${timeLeftSeconds}`
                }
                const timeLeft = Math.floor((oneMinutesInMilliseconds - energyDifference) / 60000);
                
                times += `\`\`\`Refresh time for /steal || [Energy drink effect ongoing (00h : 0${timeLeft}m : ${secCheck}s)]\`\`\``
            }
            else{
                times += `\`\`\`Refresh time for /steal || Now Available\`\`\``
            }

            let tokens = ""
            tokens += `\`\`\`Remaining Hunt Encounters: ${10 - user.huntAttempts} \`\`\``
            tokens += `\`\`\`Remaining Hunt Tokens: ${user.huntTokens} / ${getTotalTokens(user.stamina + user.staminaBonus)} \`\`\``



            const embed = new EmbedBuilder()
                .setTitle(`Check User Restrictions`)
                .setColor("Navy")
                .setDescription("Check remaining time limites for different commands before available for use. (Tip: time limits can be bypassed through the use of crafted / bought consumables)")
                .addFields({name: "Current Token Restrictions:", value: tokens})
                .addFields({name: "Current Time Restrictions:", value: times})
                
            interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.log(`Error in check: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Check could not be accessed`)
                        .setDescription(`Check could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
