const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, MessageActionRow } = require('discord.js');
const User = require('../../models/user');
const { checkLevelUp } = require('../../utils/xpUtils');
const Bank = require('../../models/bank');

const cardValues = [
  {name: '2 ♥', value: 2}, 
  {name: '3 ♥', value: 3}, 
  {name: '4 ♥', value: 4}, 
  {name: '5 ♥', value: 5}, 
  {name: '6 ♥', value: 6}, 
  {name: '7 ♥', value: 7}, 
  {name: '8 ♥', value: 8}, 
  {name: '9 ♥', value: 9}, 
  {name: '10 ♥', value: 10}, 
  {name: 'J ♥', value: 10}, 
  {name: 'Q ♥', value: 10}, 
  {name: 'K ♥', value: 10}, 
  {name: 'A ♥', value: 11},
  {name: '2 ♤', value: 2}, 
  {name: '3 ♤', value: 3}, 
  {name: '4 ♤', value: 4}, 
  {name: '5 ♤', value: 5}, 
  {name: '6 ♤', value: 6}, 
  {name: '7 ♤', value: 7}, 
  {name: '8 ♤', value: 8}, 
  {name: '9 ♤', value: 9}, 
  {name: '10 ♤', value: 10}, 
  {name: 'J ♤', value: 10}, 
  {name: 'Q ♤', value: 10}, 
  {name: 'K ♤', value: 10}, 
  {name: 'A ♤', value: 11},
  {name: '2 ♧', value: 2}, 
  {name: '3 ♧', value: 3}, 
  {name: '4 ♧', value: 4}, 
  {name: '5 ♧', value: 5}, 
  {name: '6 ♧', value: 6}, 
  {name: '7 ♧', value: 7}, 
  {name: '8 ♧', value: 8}, 
  {name: '9 ♧', value: 9}, 
  {name: '10 ♧', value: 10}, 
  {name: 'J ♧', value: 10}, 
  {name: 'Q ♧', value: 10}, 
  {name: 'K ♧', value: 10}, 
  {name: 'A ♧', value: 11},
  {name: '2 ♦', value: 2}, 
  {name: '3 ♦', value: 3}, 
  {name: '4 ♦', value: 4}, 
  {name: '5 ♦', value: 5}, 
  {name: '6 ♦', value: 6}, 
  {name: '7 ♦', value: 7}, 
  {name: '8 ♦', value: 8}, 
  {name: '9 ♦', value: 9}, 
  {name: '10 ♦', value: 10}, 
  {name: 'J ♦', value: 10}, 
  {name: 'Q ♦', value: 10}, 
  {name: 'K ♦', value: 10}, 
  {name: 'A ♦', value: 11},
];

module.exports = {
    name: 'blackjack',
    description: 'Initiate a game of blackjack, and wait for someone to accept the dare',
    options: [
        {
            name: 'bet',
            type: ApplicationCommandOptionType.Integer,
            description: 'Amount to bet',
            required: true
        },
    ],
    async callback(client, interaction) {
        try {
            


            const bet = interaction.options.getInteger('bet');

            if (bet < 1){
                
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Betting Amount')
                        .setDescription("You don't have this much to bet retard, you cannot scam the scammer.")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
            }

            const user = await User.findOne({ userId: interaction.user.id });
            
            let opponent;
            let opponentName;
            let icon2;

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }
            const username = interaction.user;
            const icon1 = interaction.user.displayAvatarURL();

            if(user.balance < bet) {
                
                const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Know your worth')
                            .setDescription(`You don't have enough balance to propose this bet. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
            }

            const initiatorEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle(`${username.displayName} has started a game of Blackjack`)
                .setDescription(`${username} has started a game of Blackjack with a starting pool of ${bet} Doros to anyone willing to take up the challenge. Press Join to begin the game, if you dare...`);

            const acceptButton = new ButtonBuilder()
                .setCustomId('join')
                .setLabel('Join')
                .setStyle(ButtonStyle.Success);

            const initiatorRow = new ActionRowBuilder().addComponents([acceptButton]);

            const initialReply = await interaction.reply({ embeds: [initiatorEmbed], components: [initiatorRow], fetchReply: true});

            const collectorFilter = i => {
                i.deferUpdate();
                return i.user.id !== user.userId && i.user.id !== client.user.id;
            };

            let userCards = [this.drawCard()];
            let opponentCards = [this.drawCard()];

            let userTotal = userCards.reduce((acc, card) => acc + card.value, 0);
            let opponentTotal = opponentCards.reduce((acc, card) => acc + card.value, 0);

            const winnerMentality = Math.floor(Math.random() * 51) + 20; 
            const loserMentality = (Math.floor(Math.random() * 31) + 20)*(-1); 


            // Deal two cards each for user and bot
            const assignBetWinner = async (playerId) => {
                if(playerId === user.userId){
                    user.balance += bet;
                    opponent.balance -= bet;
                    user.mentalityXp += winnerMentality;
                    opponent.mentalityXp += loserMentality;
                }
                else{
                    user.balance -= bet;
                    opponent.balance += bet;
                    user.mentalityXp += loserMentality;
                    opponent.mentalityXp += winnerMentality;
                }

                const result = checkLevelUp(user.mentalityXp, user.mentalityLevel, user.mentalityBonus);
                user.mentalityXp = result.xp;
                user.mentalityLevel = result.level;

                const result2 = checkLevelUp(opponent.mentalityXp, opponent.mentalityLevel , user.mentalityBonus);
                opponent.mentalityXp = result2.xp;
                opponent.mentalityLevel = result2.level;

                await user.save()
                await opponent.save()
                return;
            }

            let stand1 = false;
            let stand2 = false;
            
            const nextTurn = async (playerId, previousAction) => {
                console.log("turn works")
                let curPlayer;
                let color = "Grey";
                let icon;
                if(playerId == user.userId){
                    curPlayer = username;
                    color = "Blue";
                    icon = icon1;
                }
                else{
                    curPlayer = opponentName;
                    color = "Orange";
                    icon = icon2;
                }

                const turnEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({name: `${curPlayer.displayName}`, iconURL: icon})
                    .setTitle(`${curPlayer.displayName}'s Turn`)
                    .setDescription(`${previousAction} ${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\``);

                // Buttons for Hit or Stand
                const hitButton = new ButtonBuilder()
                    .setCustomId('hit')
                    .setLabel('Hit')
                    .setStyle(ButtonStyle.Primary);

                const standButton = new ButtonBuilder()
                    .setCustomId('stand')
                    .setLabel('Stand')
                    .setStyle(ButtonStyle.Secondary);

                const actionRow = new ActionRowBuilder().addComponents([hitButton, standButton]);

                const turnReply = await interaction.followUp({ embeds: [turnEmbed], components: [actionRow], fetchReply: true});

                const turnFilter = i => {
                    i.deferUpdate();
                    return i.user.id === playerId && i.user.id !== client.user.id;
                };

                
                let currentTurnGuy;

                const turnCollector = turnReply.awaitMessageComponent({filter: turnFilter, componentType: ComponentType.Button, time: 30000 })
                .then(async interaction => {
                    console.log(`${interaction.user.id}`);
                    await turnReply.edit({ embeds: [turnEmbed], components: [], fetchReply: true});
                    if(user.userId === playerId){
                        if (interaction.customId === 'hit') {
                            // Add new card to user's hand
                            let curCard = this.drawCard()
                            if(!curCard){
                                const [drawnCard] = cardValues.splice(1, 1);
                                let curCard = drawnCard
                                console.log("Error, processing card at value 1.")
                            }
                            userCards.push(curCard);
                            userTotal = userCards.reduce((acc, card) => acc + card.value, 0);
                            let aceHelp = "";
                            if (userTotal > 21) {
                                // Handle Ace as 1 if total exceeds 21
                                try {
                                    userCards.forEach(card => {
                                        if (card && card.value === 11 && userTotal > 21) {
                                            userTotal -= 10;
                                            card.value = 1;
                                            aceHelp = `\nCards axceeding 21 so counting previous ${card.name} as 1`
                                            throw new Error('BreakOutOfLoop');
                                        }
                                    });
                                } catch (e) {
                                    console.log(e)
                                    if (e.message !== 'BreakOutOfLoop') throw e;  // If it's not our custom exception, rethrow it.
                                }
                            }
                            if (userTotal > 21) {
                                assignBetWinner(opponent.userId);
                                const winEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`${opponentName.displayName} Won!!!!`)
                                .setDescription(`${username} was handed a ${curCard.name} and busted\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} lost \`${loserMentality} Mentality XP\`\n${opponentName} gained \`${winnerMentality} Mentality XP\``);
                                return await interaction.followUp({ embeds: [winEmbed]});
                            }
                            previousAction = `${username} was handed a ${curCard.name}${aceHelp}\n\n`
                            nextTurn(opponent.userId, previousAction);
                        } else if (interaction.customId === 'stand') {
                            previousAction = `${username} chose to stand their ground\n\n`
                            stand1 = true;
                            if(stand1 && stand2) {
                                if(userTotal > opponentTotal){
                                    assignBetWinner(user.userId);
                                    const winEmbed = new EmbedBuilder()
                                    .setColor("Green")
                                    .setTitle(`${username.displayName} Won!!!!`)
                                    .setDescription(`Both players stood their ground and ${username} emerged victorious!\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} gained\` ${winnerMentality}\` Mentality XP\n${opponentName} lost \`${loserMentality}\` Mentality XP`);
                                    return await interaction.followUp({ embeds: [winEmbed]});
                                }
                                else if(userTotal === opponentTotal){
                                    const winEmbed = new EmbedBuilder()
                                    .setColor("Grey")
                                    .setTitle(`A Draw`)
                                    .setDescription(`After a very passionate game, both sides maintained their stance and came to a draw.\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} gained \`0 Mentality XP\`\n${opponentName} gained \`0 Mentality XP\``);
                                    return await interaction.followUp({ embeds: [winEmbed]});
                                }
                                else{
                                    assignBetWinner(opponent.userId);
                                    const winEmbed = new EmbedBuilder()
                                    .setColor("Green")
                                    .setTitle(`${opponentName.displayName} Won!!!!`)
                                    .setDescription(`Both players stood their ground and ${opponentName} emerged victorious!\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} lost \`${loserMentality} Mentality XP\`\n${opponentName} gained \`${winnerMentality} Mentality XP\``);
                                    return await interaction.followUp({ embeds: [winEmbed]});
                                }
                            }
                            nextTurn(opponent.userId, previousAction);
                        }
                    }
                    else{
                        if (interaction.customId === 'hit') {
                            // Add new card to user's hand
                            let curCard = this.drawCard()
                            if(!curCard){
                                const [drawnCard] = cardValues.splice(1, 1);
                                let curCard = drawnCard
                                console.log("Error, processing card at value 1.")
                            }
                            opponentCards.push(curCard);
                            opponentTotal = opponentCards.reduce((acc, card) => acc + card.value, 0);
                            let aceHelp = ""
                            if (opponentTotal > 21) {
                                // Handle Ace as 1 if total exceeds 21
                                try {
                                    opponentCards.forEach(card => {
                                        if (card && card.value === 11 && userTotal > 21) {
                                            opponentTotal -= 10;
                                            card.value = 1;
                                            aceHelp = `\nCards axceeding 21 so counting previous ${card.name} as 1`
                                            throw new Error('BreakOutOfLoop');
                                        }
                                    });
                                } catch (e) {
                                    console.log(e)
                                    if (e.message !== 'BreakOutOfLoop') throw e;  // If it's not our custom exception, rethrow it.
                                }
                            }
                            if (opponentTotal > 21) {
                                
                                assignBetWinner(user.userId);
                                const winEmbed = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`${username.displayName} Won!!!!`)
                                .setDescription(`${opponentName} was handed a ${curCard.name} and busted\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} gained \`${winnerMentality} Mentality XP\`\n${opponentName} lost \`${loserMentality} Mentality XP\``);
                                return await interaction.followUp({ embeds: [winEmbed]});
                            }
                            previousAction = `${opponentName} was handed a ${curCard.name}${aceHelp}\n\n`
                            nextTurn(user.userId, previousAction);
                        } else if (interaction.customId === 'stand') {
                            previousAction = `${opponentName} chose to stand their ground\n\n`
                            stand2 = true;
                            if(stand1 && stand2) {
                                if(userTotal > opponentTotal){
                                    assignBetWinner(user.userId)
                                    const winEmbed = new EmbedBuilder()
                                    .setColor("Green")
                                    .setTitle(`${username.displayName} Won!!!!`)
                                    .setDescription(`Both players stood their ground and ${username} emerged victorious!\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} gained \`${winnerMentality} Mentality XP\`\n${opponentName} lost \`${loserMentality} Mentality XP\``);
                                    
                                    return await interaction.followUp({ embeds: [winEmbed]});
                                }
                                else if(userTotal === opponentTotal){
                                    const winEmbed = new EmbedBuilder()
                                    .setColor("Grey")
                                    .setTitle(`A Draw`)
                                    .setDescription(`After a very passionate game, both sides maintained their stance and came to a draw.\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} gained \`0 Mentality XP\`\n${opponentName} gained \`0 Mentality XP\``);
                                    return await interaction.followUp({ embeds: [winEmbed]});
                                }
                                else{
                                    assignBetWinner(opponent.userId);
                                    const winEmbed = new EmbedBuilder()
                                    .setColor("Green")
                                    .setTitle(`${opponentName.displayName} Won!!!!`)
                                    .setDescription(`Both players stood their ground and ${opponentName} emerged victorious!\n\n${username}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} lost \`${loserMentality} Mentality XP\`\n${opponentName} gained \`${winnerMentality} Mentality XP\``);
                                    return await interaction.followUp({ embeds: [winEmbed]});
                                }
                            }
                            nextTurn(user.userId, previousAction);
                        }
                    }
                    
                })
                .catch(async err => {
                    console.log(`Error with turn: ${err}`)
                    await turnReply.edit({ embeds: [turnEmbed], components: [], fetchReply: true});
                    if(user.userId === playerId){
                        
                        assignBetWinner(opponent.userId)
                        const winEmbed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`${opponentName.displayName} Won by Timeout Default!`)
                        .setDescription(`${opponentName} won by timeout default: \n\n${username.displayName}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName.displayName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} lost \`${loserMentality} Mentality XP\`\n${opponentName} gained \`${winnerMentality} Mentality XP\``);
                        return await interaction.followUp({ embeds: [winEmbed]});
                    }
                    else{
                        assignBetWinner(user.userId)
                        const winEmbed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`${username.displayName} Won by Timeout Default!`)
                        .setDescription(`${username} won by timeout default: \n\n${username.displayName}'s cards: \`${userCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${userTotal})\`\n${opponentName.displayName}'s cards: \`${opponentCards.map(c => c && c.name ? c.name : "undefined?").join(", ")} (Total: ${opponentTotal})\`\n\n${username} gained \`${winnerMentality} Mentality XP\`\n${opponentName} lost \`${loserMentality} Mentality XP\``);
                        return await interaction.followUp({ embeds: [winEmbed]});
                    }
                }); //works up to here, work on it further
                
            }

            let reaction;

            const initialCollector = initialReply.awaitMessageComponent({filter: collectorFilter, componentType: ComponentType.Button, time: 30000 })

            .then(async interaction => {
                console.log(`${interaction.user.id} and ${interaction.customId}ed`);
                reaction = interaction.customId
                await initialReply.edit({ embeds: [initiatorEmbed], components: [], fetchReply: true});
                if(interaction.user.id === user.userId){
                    return await interaction.followUp("You cannot play a game with yourself");
                }
                else{
                    const user2 = await User.findOne({ userId: interaction.user.id });
                    if(!user2){
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid User')
                            .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                        interaction.followUp({embeds: [embed]})
                        return;
                    }
                    if(user2.balance < bet) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: If you\'re poor just say so')
                            .setDescription(`You don't have enough balance to accept this bet. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.followUp({embeds: [embed]})
                        return;
                    }
                    opponent = user2;
                    opponentName =interaction.user;
                    icon2 = interaction.user.displayAvatarURL();
                    nextTurn(user.userId, `${opponentName} accepted the challenge, ${username} will start:\n\n`);
                }

            })
            .catch(async err => {
                await initialReply.edit({ embeds: [initiatorEmbed], components: [], fetchReply: true});
                const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Silence...')
                            .setDescription("Challenge timed out. No one accepted the bet.")
                        interaction.followUp({embeds: [embed]})
                        return;
            }); //works up to here, work on it further

        } catch (error) {
            console.error(`Error in /blackjack: ${error}`);
            const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Process error')
                            .setDescription("There was an error processing the game. Please report to the developer.")
                        interaction.followUp({embeds: [embed]})
                        return;
        }
    },
    drawCard() {
        const randomIndex = Math.floor(Math.random() * cardValues.length);
    
        // Remove the card at randomIndex from cardValues and get the card
        const [drawnCard] = cardValues.splice(randomIndex, 1);
    
        return drawnCard;
    }
};
