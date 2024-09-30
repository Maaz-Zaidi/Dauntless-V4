const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, MessageActionRow } = require('discord.js');
const User = require('../../models/user');
const { checkLevelUp } = require('../../utils/xpUtils');
const Bank = require('../../models/bank');
const Spell = require('../../models/spell');
const Equipment = require('../../models/equipment');
const Effect = require('../../models/effect');

module.exports = {
    name: 'duel',
    description: 'Propose a duel that anyone can accept. May the strongest fighter reign supreme.',
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

            const createPlayer = (id, name, user, health, stamina, combat, strength, slot1, slot2, slot3, slot4, slots, profilePic, color) => {
                return {
                    id: id || null,
                    name: name || null,
                    user: user || null,
                    health: health || 1,
                    stamina: stamina || 1,
                    power: combat || 1,
                    strength: strength || 1,
                    slot1: slot1 || null,
                    slot2: slot2 || null,
                    slot3: slot3 || null,
                    slot4: slot4 || null,
                    slots: slots,
                    profilePic: profilePic || "https://archive.org/download/discordprofilepictures/discordgrey.png",
                    color: color || "Grey",
                };
            }
            
            const user = await User.findOne({ userId: interaction.user.id });

            

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            if(user.balance < bet) {
                const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Know your worth')
                            .setDescription(`You don't have enough balance to propose this bet. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
            }

            const spell1 = user.spellSlot1 ? await Spell.findById(user.spellSlot1) : null;
            const spell2 = user.spellSlot2 ? await Spell.findById(user.spellSlot2) : null;
            const spell3 = user.spellSlot3 ? await Spell.findById(user.spellSlot3) : null;
            const spell4 = user.spellSlot4 ? await Spell.findById(user.spellSlot4) : null;

            const spells = [spell1, spell2, spell3, spell4].filter(Boolean); // This will remove any null/undefined values
            const [firstSpell, secondSpell, thirdSpell, fourthSpell] = spells;
            let slotAmount = spells.length;

            const player1 = createPlayer(interaction.user.id, interaction.user, user, user.hp + user.hpBonus, user.stamina + user.staminaBonus, user.combat + user.combatBonus, user.strengthLevel + user.strengthBonus, firstSpell, secondSpell, thirdSpell, fourthSpell, slotAmount, interaction.user.displayAvatarURL(), "Blue");

            const initiatorEmbed = new EmbedBuilder()
                .setColor("Purple")
                .setTitle(`${player1.name.displayName} has initiated a duel`)
                .setDescription(`${player1.name} has started a duel with a starting pool of ${bet} Doros to anyone willing to take up the challenge. Press Join to begin the game, if you dare...`);

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

            const winnerXP = Math.floor(Math.random() * 51) + 20; 
            const loserXP = (Math.floor(Math.random() * 31) + 20)*(-1); 

            // Deal two cards each for user and bot
            const assignBetWinner = async (winnerP, loserP) => {
                const winner = await User.findOne({userId: winnerP.id});
                const loser = await User.findOne({userId: loserP.id});

                winner.balance += bet;
                loser.balance -= bet;
                winner.strengthXp += winnerXP;
                loser.strengthXp += loserXP;
                const result = checkLevelUp(winner.strengthXp, winner.strengthLevel , winner.strengthBonus);
                winner.strengthXp = result.xp;
                winner.strengthLevel = result.level;

                const result2 = checkLevelUp(loser.strengthXp, loser.strengthLevel ,loser.strengthBonus);
                loser.strengthXp = result2.xp;
                loser.strengthLevel = result2.level;

                await winner.save()
                await loser.save()
                return;
            }

            const checkWinner = async (player1, player2, previousAction) => {
                if(player1.health < 1 && player2.health < 1){
                    const turnEmbed = new EmbedBuilder()
                    .setColor("Grey")
                    .setTitle(`Duel Draw`)
                    .setDescription(`${previousAction}\n\nBoth players' health exceeded lower than 0, resulting in a match draw\n\n*${player1.name}* HP: 0\n*${player1.name}* Stamina: ${player1.stamina}\n\n*${player2.name}* HP:0\n*${player2.name}* Stamina: ${player2.stamina}\n\n${player1.name} gained \`0 Strength XP\`\n${player2.name} gained \`0 Strength XP\``);

                    await interaction.followUp({ embeds: [turnEmbed]});
                }else if(player1.health < 1){
                    assignBetWinner(player2, player1)
                    const turnEmbed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`${player2.name.displayName} Won!!!`)
                    .setDescription(`${previousAction}\n\n${player1.name}'s health exceeded lower than 0 and lost the duel\n\n*${player2.name}* HP: ${player2.health}\n*${player2.name}* Stamina: ${player2.stamina}\n\n*${player1.name}* HP:0\n*${player1.name}* Stamina: ${player1.stamina}\n\n${player2.name} gained \`${winnerXP} Strength XP\`\n${player1.name} lost \`${loserXP} Strength XP\`\n\n${player2.name} gained the pool of \`${bet*2} Doros\``);

                    await interaction.followUp({ embeds: [turnEmbed]});
                }else if(player2.health < 1){
                    assignBetWinner(player1, player2)
                    const turnEmbed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`${player1.name.displayName} Won!!!`)
                    .setDescription(`${previousAction}\n\n${player2.name}'s health exceeded lower than 0 and lost the duel\n\n*${player1.name}* HP: ${player1.health}\n*${player1.name}* Stamina: ${player1.stamina}\n\n*${player2.name}* HP:0\n*${player2.name}* Stamina: ${player2.stamina}\n\n${player1.name} gained \`${winnerXP} Strength XP\`\n${player2.name} lost \`${loserXP} Strength XP\`\n\n${player1.name} gained the pool of \`${bet*2} Doros\``);

                    await interaction.followUp({ embeds: [turnEmbed]});
                }
                else{
                    console.log("checking winner false");
                    return false;
                }
                console.log("checking winner true");
                return true;
            }

            const createEffect = async (affectedUser, turns, type, attribute, value) => {
                return {
                    affectedUser: affectedUser,
                    turns: turns,
                    type: type,
                    attribute: attribute,
                    value: value,
                }
            }

            const useSpell = async (spellUser, otherPlayer, spell, globalEffects) => {
                let damage = 0;
                let turnAction = `${spellUser.name} used ${spell.name},  ${spell.description}\n\n`;

                let turnActionSub = "";
                if (spell.spellApplication.hp && spell.spellApplication.hp !== 0){
                    spellUser.health -= spell.spellApplication.hp;
                    turnActionSub = `Spell drained \`${spell.spellApplication.hp} HP\``
                }
                if (spell.spellApplication.stamina && spell.spellApplication.stamina !== 0){
                    spellUser.stamina -= spell.spellApplication.stamina;
                    turnActionSub = `Spell drained \`${spell.spellApplication.stamina} Stamina\``
                }
                if (spell.spellApplication.hp && spell.spellApplication.hp !== 0 && spell.spellApplication.stamina && spell.spellApplication.stamina !== 0){
                    turnActionSub = `Spell drained \`${spell.spellApplication.hp} HP and ${spell.spellApplication.stamina} Stamina\``
                }

                if(spellUser.health < 1){
                    turnAction = `Unable to fully complete the spell, ${spellUser.name} fully drained their health, resulting in death.`
                    return {
                        spellUser: spellUser,
                        otherPlayer: otherPlayer,
                        damage: damage,
                        turnAction: turnAction,
                        globalEffects: globalEffects,
                    };
                }

                if(spellUser.stamina < 0){
                    turnAction = `Unable to fully complete the spell, ${spellUser.name} fully drained their stamina past its brink, resulting in failure to cast.`
                    return {
                        spellUser: spellUser,
                        otherPlayer: otherPlayer,
                        damage: damage,
                        turnAction: turnAction,
                        globalEffects: globalEffects,
                    };
                }

                turnAction += `${turnActionSub}\n`;

                if(spell.type === "attack"){

                    if(!spell.spellApplication.passive){
                        damage += spell.spellApplication.combat;

                        const critical = Math.random() * 200
                        if (critical < spellUser.user.luckLevel){
                            const addition = Math.floor(damage * Math.random());

                            turnAction += `Landed a **Critical Hit**, dealt \`${damage} (+ ${addition} critical)\` damage`
                            damage += addition;
                        }
                        else{
                            turnAction += `Dealt \`${damage}\` damage`
                        }
                    }
                    else{
                        const newEffect = await createEffect(otherPlayer, spell.spellApplication.turns, spell.type, "health", spell.spellApplication.combat);
                        const doesEffectExist = globalEffects.some(effect => 
                            effect.affectedUser.id === newEffect.affectedUser.id &&
                            effect.type === newEffect.type &&
                            effect.attribute === newEffect.attribute &&
                            effect.value === newEffect.value &&
                            effect.turns !== 0
                        );
                            
                        if(doesEffectExist){
                            turnAction += `\nSpell use failed as this spell is still applicable, please wait for the effect to end.`
                        }
                        else{
                            globalEffects.push(newEffect);
                        }
                        
                    }
                } else if(spell.type === "shield"){
                    const newEffect = await createEffect(otherPlayer, spell.spellApplication.turns, spell.type, "", spell.spellApplication.combat);
                    const doesEffectExist = globalEffects.some(effect => 
                        effect.affectedUser.id === newEffect.affectedUser.id &&
                        effect.type === newEffect.type &&
                        effect.turns !== 0
                    );
                        
                    if(doesEffectExist){
                        turnAction += `\nSpell use failed as a similar spell is still applicable, please wait for the effect to end.`
                    }
                    else{
                        globalEffects.push(newEffect);
                        turnAction += `${spellUser.name} activated a defense shield for ${spell.spellApplication.turns} turns (${spell.spellApplication.combat}% absorbtion rate)`
                    }
                    
                    
                } else if(spell.type === "heal hp"){
                    if(!spell.spellApplication.passive){
                        spellUser.health += spell.spellApplication.combat;
                        turnAction += `${spellUser.name} gained \`${spell.spellApplication.combat} HP\``
                    }else{
                        const newEffect = await createEffect(spellUser, spell.spellApplication.turns, spell.type, "health", spell.spellApplication.combat);
                        const doesEffectExist = globalEffects.some(effect => 
                            effect.affectedUser.id === newEffect.affectedUser.id &&
                            effect.type === newEffect.type &&
                            effect.attribute === newEffect.attribute &&
                            effect.value === newEffect.value &&
                            effect.turns !== 0
                        );
                            
                        if(doesEffectExist){
                            turnAction += `\nSpell use failed as this spell is still applicable, please wait for the effect to end.`
                        }
                        else{
                            globalEffects.push(newEffect);
                            turnAction += `${spellUser.name} activated health regeneration for ${spell.spellApplication.turns} turns (heals ${spell.spellApplication.combat} per turn)`
                        }
                    }
                } else if(spell.type === "heal stamina"){
                    if(!spell.spellApplication.passive){
                        spellUser.stamina += spell.spellApplication.combat;
                        turnAction += `${spellUser.name} gained \`${spell.spellApplication.combat} stamina\``
                    }else{
                        const newEffect = await createEffect(spellUser, spell.spellApplication.turns, spell.type, "stamina", spell.spellApplication.combat);
                        const doesEffectExist = globalEffects.some(effect => 
                            effect.affectedUser.id === newEffect.affectedUser.id &&
                            effect.type === newEffect.type &&
                            effect.attribute === newEffect.attribute &&
                            effect.value === newEffect.value &&
                            effect.turns !== 0
                        );
                            
                        if(doesEffectExist){
                            turnAction += `\nSpell use failed as this spell is still applicable, please wait for the effect to end.`
                        }
                        else{
                            globalEffects.push(newEffect);
                            turnAction += `${spellUser.name} activated stamina regeneration for ${spell.spellApplication.turns} turns (heals ${spell.spellApplication.combat} per turn)`
                        }
                    }
                
                } else if(spell.type === "negate"){
                    const newEffect = await createEffect(otherPlayer, spell.spellApplication.turns, spell.type, `${spell.spellApplication.slot}`, 0);
                    const doesEffectExist = globalEffects.some(effect => 
                        effect.affectedUser.id === newEffect.affectedUser.id &&
                        effect.type === newEffect.type &&
                        effect.attribute === newEffect.attribute &&
                        effect.turns !== 0
                    );
                        
                    if(doesEffectExist){
                        turnAction += `\nSpell use failed as a similar spell is still applicable, please wait for the effect to end.`
                    }
                    else{
                        globalEffects.push(newEffect);
                        turnAction += `${spellUser.name} temporarity disabled ${otherPlayer.name}'s slot ${spell.spellApplication.slot} for ${spell.spellApplication.turns} turns.`
                    }
                    
                } else if(spell.type === "reversal"){
                    
                } else if(spell.type.split('/')[0] === "buff"){
                    const newEffect = createEffect(spellUser, spell.spellApplication.turns, spell.type.split('/')[0], spell.type.split('/')[1] , spell.spellApplication.combat);
                    const doesEffectExist = globalEffects.some(effect => 
                        effect.affectedUser.id === newEffect.affectedUser.id &&
                        effect.type === newEffect.type &&
                        effect.attribute === newEffect.attribute &&
                        effect.turns !== 0
                    );
                        
                    if(doesEffectExist){
                        turnAction += `\nSpell use failed as a similar spell is still applicable, please wait for the effect to end.`
                    }
                    else{
                        globalEffects.push(newEffect);
                        turnAction += `${spellUser.name} activated ${spell.type.split('/')[1]}-type buff for ${spell.spellApplication.turns} turns (${spell.spellApplication.combat}% increase)`
                    }
                } else if(spell.type.split('/')[0] === "debuff"){
                    const newEffect = await createEffect(otherPlayer, spell.spellApplication.turns, spell.type.split('/')[0], spell.type.split('/')[1] , spell.spellApplication.combat);
                    const doesEffectExist = globalEffects.some(effect => 
                        effect.affectedUser.id === newEffect.affectedUser.id &&
                        effect.type === newEffect.type &&
                        effect.attribute === newEffect.attribute &&
                        effect.turns !== 0
                    );
                        
                    if(doesEffectExist){
                        turnAction += `\nSpell use failed as a similar spell is still applicable, please wait for the effect to end.`
                    }
                    else{
                        globalEffects.push(newEffect);
                        turnAction += `${spellUser.name} activated ${spell.type.split('/')[1]}-type debuff for ${spell.spellApplication.turns} turns (${spell.spellApplication.combat}% increase)`
                    }
                } 
                return {
                    spellUser: spellUser,
                    otherPlayer: otherPlayer,
                    damage: damage,
                    turnAction: turnAction,
                    globalEffects: globalEffects,
                };
            }
            
            const nextTurn = async (currentPlayer, otherPlayer, prevAction, effects, prevHp, prevSp, otherHp, otherSp) => {

                
                const currentPlayerHealthCopy = currentPlayer.health
                const currentPlayerStaminaCopy = currentPlayer.stamina
                const otherPlayerHealthCopy = otherPlayer.health
                const otherPlayerStaminaCopy = otherPlayer.stamina

                

                let shield = false;
                let shieldAbsorbtion = 0;

                let negate1 = false;
                let negate2 = false;
                let negate3 = false;
                let negate4 = false;

                let luckBuff = 1;
                let strengthBuff = 1;
                let combatBuff = 1;
                let previousAction = prevAction;
                let effectsAction = ""

                const buffEffects = await Effect.find({userId: currentPlayer.id, effectedType: 'Buff'})
                if (buffEffects){
                    buffEffects.forEach(buff => {
                        if (buff.relativeAttribute.toLowerCase === "luck") luckBuff += buff.relativeValue / 100;
                        if (buff.relativeAttribute.toLowerCase === "strength") strengthBuff += buff.relativeValue / 100;
                        if (buff.relativeAttribute.toLowerCase === "combat") combatBuff += buff.relativeValue / 100;
                        effectsAction += `\nPassive Effects: ${currentPlayer.name} gained +\`${buff.relativeValue}%\` increase for ${buff.relativeAttribute} due to external potions`
                    })
                }

                console.log(`${currentPlayer.name}'s is current player`);

                const gameWon = await checkWinner(currentPlayer, otherPlayer, previousAction);
                if(gameWon){
                    return;
                }

                

                if (effects.length !== 0){
                    console.log(effects);
                    const matchedEffects = effects.filter(effect => effect.affectedUser.id === currentPlayer.id);
                    matchedEffects.forEach(effect => {
                        // Do something with each effect
                       if(effect.turns>0){
                            console.log(effect.type, effect.attribute, effect.value);
                            if (effect.type === "attack"){
    
                                effectsAction += `\nPassive Effects: ${currentPlayer.name} was dealt \`${effect.value}\` damage to his ${effect.attribute} (${effect.turns} turns remaining)`
                                currentPlayer[effect.attribute] -= effect.value;
                                
                            } else if (effect.type === "shield"){
                                
                                effectsAction += `\nPassive Effects: ${otherPlayer.name}'s shield is currently active (${effect.turns} turns remaining)`
                                shield = true;
                                shieldAbsorbtion = effect.value;
    
                            } else if(effect.type === "heal hp" || effect.type === "heal stamina"){
    
                                effectsAction += `\nPassive Effects: ${currentPlayer.name} gained +\`${effect.value} ${effect.attribute}\` (${effect.turns} turns remaining)`
                                currentPlayer[effect.attribute] += effect.value;
                                
                            } else if(effect.type === "buff"){
                                effectsAction += `\nPassive Effects: ${currentPlayer.name} gained +\`${effect.value}%\` increase for ${effect.attribute} (${effect.turns} turns remaining)`
                                if(effect.attribute === "luck"){
                                    luckBuff += effect.value/100
                                }else if(effect.attribute === "strength"){
                                    strengthBuff += effect.value/100
                                }else if(effect.attribute === "combat"){
                                    combatBuff += effect.value/100
                                }
                            } else if(effect.type === "debuff"){
                                effectsAction += `\nPassive Effects: ${currentPlayer.name} is afflicted by a -\`${effect.value}%\` decrease for ${effect.attribute} (${effect.turns} turns remaining)`
                                if(effect.attribute === "luck"){
                                    luckBuff -= effect.value/100
                                }else if(effect.attribute === "strength"){
                                    strengthBuff -= effect.value/100
                                }else if(effect.attribute === "combat"){
                                    combatBuff -= effect.value/100
                                }
                            } else if(effect.type === "negate"){
                                effectsAction += `\nPassive Effects: ${currentPlayer.name}'s slot ${effect.attribute} has been restricted (${effect.turns} turns remaining)`
                                if(effect.attribute === "1") negate1 = true;
                                if(effect.attribute === "2") negate2 = true;
                                if(effect.attribute === "3") negate3 = true;
                                if(effect.attribute === "4") negate4 = true;
                            } else if(effect.type === "reversal"){
                                
                            }
                            effect.turns -=1;
                       }
                    });
                }

                if(effectsAction != ""){
                    previousAction += `\n\nOngoing Effects for (${currentPlayer.name}):${effectsAction}`
                }

                const gameWon2 = await checkWinner(currentPlayer, otherPlayer, previousAction);
                if(gameWon2){
                    return;
                }
                const weapon = await Equipment.findById(currentPlayer.user.weapon);

                const attackOptions = [];
                if(!weapon){ attackOptions.push({name: "Punch"});}
                else{attackOptions.push({name: "Weapon"});}

                if (currentPlayer.slot1 && !negate1) attackOptions.push({name: currentPlayer.slot1.name});
                if (currentPlayer.slot2 && !negate2) attackOptions.push({name: currentPlayer.slot2.name});
                if (currentPlayer.slot3 && !negate3) attackOptions.push({name: currentPlayer.slot3.name});
                if (currentPlayer.slot4 && !negate4) attackOptions.push({name: currentPlayer.slot4.name});

                let hpStatement = `\`${currentPlayer.health}\``;
                let spStatement = `\`${currentPlayer.stamina}\``;
                let hpStatement2 = `\`${otherPlayer.health}\``;
                let spStatement2 = `\`${otherPlayer.stamina}\``;

                if(currentPlayer.health!==prevHp) hpStatement =`${prevHp} -> \`${currentPlayer.health}\``
                if(currentPlayer.stamina!==prevSp) spStatement =`${prevSp} -> \`${currentPlayer.stamina}\``
                if(otherPlayer.health!==otherHp) hpStatement2 =`${otherHp} -> \`${otherPlayer.health}\``
                if(otherPlayer.stamina!==otherSp) spStatement2 =`${otherSp} -> \`${otherPlayer.stamina}\``

                const turnEmbed = new EmbedBuilder()
                    .setColor(currentPlayer.color)
                    .setAuthor({name: currentPlayer.name.displayName, iconURL: currentPlayer.profilePic})
                    .setTitle(`${currentPlayer.name.displayName}'s Turn`)
                    .setDescription(`${previousAction}\n\n*${currentPlayer.name}* HP: ${hpStatement}\n*${currentPlayer.name}* Stamina: ${spStatement}\n\n*${otherPlayer.name}* HP: ${hpStatement2}\n*${otherPlayer.name}* Stamina: ${spStatement2}\n\nMake your move -`);

                const buttons = attackOptions.map((choice) => {
                return new ButtonBuilder()
                    .setCustomId(choice.name)
                    .setLabel(choice.name)
                    .setStyle(ButtonStyle.Secondary)
                })
                const actionRow = new ActionRowBuilder().addComponents(buttons);
                const turnReply = await interaction.followUp({ embeds: [turnEmbed], components: [actionRow], fetchReply: true});

                const turnFilter = i => {
                    i.deferUpdate();
                    return i.user.id === currentPlayer.id && i.user.id !== client.user.id;
                };
                const turnCollector = turnReply.awaitMessageComponent({filter: turnFilter, componentType: ComponentType.Button, time: 30000 })
                .then(async interaction => {
                    console.log(`${interaction.user.displayName}'s turn`);
                    await turnReply.edit({ embeds: [turnEmbed], components: [], fetchReply: true});
                    let damage = 0;
                    let stamina = 0;
                    let turnAction = "";
                    let surrender = false;
                    const p1StartingHP = currentPlayer.health;
                    const p2StartingHP = otherPlayer.health;
                    const p1StartingSP = currentPlayer.stamina;
                    const p2StartingSP = otherPlayer.stamina;

                    let newEffects;
                    let newPlayer;
                    let newOtherPlayer;
                    let luckApplication = currentPlayer.user.luckLevel * luckBuff;
                    if (interaction.customId === 'Punch') {
                        
                        if(luckApplication > currentPlayer.power * combatBuff){
                            luckApplication = currentPlayer.power * combatBuff;
                        }
                        damage = Math.floor(Math.random() * ((currentPlayer.power * combatBuff) + 1 - luckApplication)) + luckApplication; 
                        stamina = Math.floor(damage/2);
                        if (damage === 0) damage = 1; 
                        //critical
                        const critical = Math.random() * 100
                        if (critical < (currentPlayer.user.luckLevel * luckBuff)){
                            const addition = damage * Math.floor(Math.random() * 11)

                            turnAction = `${currentPlayer.name} fisted ${otherPlayer.name} and landed a **Critical Hit**, dealt \`${damage} (+ ${addition} critical)\` damage\nAttack drained ${stamina} stamina\nAttack drained \`${stamina} stamina\``
                            damage += addition;
                        }
                        else{
                            turnAction = `${currentPlayer.name} punched ${otherPlayer.name} and dealt \`${damage}\` damage\nAttack drained \`${stamina} stamina\``
                        }
                    }else if (interaction.customId === 'Weapon') {
                        if(luckApplication > (currentPlayer.power*combatBuff) - 9 ){
                            luckApplication = (currentPlayer.power * combatBuff) - 9 ;
                        }
                        damage = Math.floor((Math.random() * ((currentPlayer.power*combatBuff) - 9 - luckApplication)) + 10) + luckApplication; 
                        stamina = Math.floor(damage/2);
                        const damageBonus = Math.floor(((currentPlayer.strength*strengthBuff)/100) * (currentPlayer.power*combatBuff))
                        let damageRank = 0;
                        if (weapon.rank === 'D') damageRank = 1;
                        if (weapon.rank === 'C') damageRank = 2;
                        if (weapon.rank === 'B') damageRank = 3;
                        if (weapon.rank === 'A') damageRank = 4;
                        if (weapon.rank === 'S') damageRank = 5;

                        //critical
                        const critical = Math.random() * 100
                        if (critical < (currentPlayer.user.luckLevel * luckBuff) || critical < (currentPlayer.user[`${weapon.scaling}Level`] * strengthBuff)){
                            const addition = Math.floor(Math.random() * damage)
                            
                            turnAction = `${currentPlayer.name} used ${weapon.name} and landed a **Critical Hit**, dealt \`${damage} (+ ${damageBonus} bonus) (+ ${addition} critical)\` damage\nAttack drained \`${stamina} stamina\``
                            damage += addition;
                        }
                        else{
                            turnAction = `${currentPlayer.name} used ${weapon.name}, and dealt \`${damage} (+ ${damageBonus} bonus)\` damage\nAttack drained \`${stamina} stamina\``
                        }
                        damage+= damageBonus;
                    }else if (interaction.customId === 'Surrender') {
                        surrender = true
                    }else if (interaction.customId === currentPlayer.slot1.name) {
                        const result = await useSpell(currentPlayer, otherPlayer, currentPlayer.slot1, effects);
                        newEffects = result.globalEffects;
                        damage = result.damage;
                        newPlayer = result.spellUser;
                        newOtherPlayer = result.otherPlayer;
                        turnAction = result.turnAction
                    }else if (interaction.customId === currentPlayer.slot2.name) {
                        const result = await useSpell(currentPlayer, otherPlayer, currentPlayer.slot2, effects);
                        newEffects = result.globalEffects;
                        damage = result.damage;
                        newPlayer = result.spellUser;
                        newOtherPlayer = result.otherPlayer;
                        turnAction = result.turnAction
                    }else if (interaction.customId === currentPlayer.slot3.name) {
                        const result = await useSpell(currentPlayer, otherPlayer, currentPlayer.slot3, effects);
                        newEffects = result.globalEffects;
                        damage = result.damage;
                        newPlayer = result.spellUser;
                        newOtherPlayer = result.otherPlayer;
                        turnAction = result.turnAction
                    }else if (interaction.customId === currentPlayer.slot4.name) {
                        const result = await useSpell(currentPlayer, otherPlayer, currentPlayer.slot4, effects);
                        newEffects = result.globalEffects;
                        damage = result.damage;
                        newPlayer = result.spellUser;
                        newOtherPlayer = result.otherPlayer;
                        turnAction = result.turnAction
                    }

                    if(shield){
                        turnAction += `\n\nAll damage was absorbed (${shieldAbsorbtion}%), final damage recieved: \`${((100 - shieldAbsorbtion)/100)*damage}\``
                        damage = ((100 - shieldAbsorbtion)/100)*damage;
                    }

                    if(!newEffects){
                        newEffects = effects;
                    }

                    if(!newPlayer){
                        newPlayer = currentPlayer;
                    }

                    if(!newOtherPlayer){
                        newOtherPlayer = otherPlayer;
                    }

                    if(strengthBuff != 100)
                    
                    otherPlayer.health-= damage
                    currentPlayer.stamina -=stamina;
                    const gameWon3 = await checkWinner(currentPlayer, otherPlayer, turnAction);
                    if(gameWon3){
                        console.log("game ended + " + gameWon)
                        return;
                    }
                    console.log("turn ended");
                    nextTurn(newOtherPlayer, newPlayer, turnAction, newEffects, otherPlayerHealthCopy, otherPlayerStaminaCopy, currentPlayerHealthCopy, currentPlayerStaminaCopy)
                })
                .catch(async err => {
                    await turnReply.edit({ embeds: [turnEmbed], components: [], fetchReply: true});
                    assignBetWinner(otherPlayer, currentPlayer)
                    const winEmbed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`${otherPlayer.name.displayName} Won by Timeout Default!`)
                    .setDescription(`${otherPlayer.name} won by timeout default\n\n${otherPlayer.name} gained \`${winnerXP} Strength XP\`\n${currentPlayer.name} lost \`${loserXP} Strength XP\``);
                    return await interaction.followUp({ embeds: [winEmbed]});
                }); 
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
                            .setTitle('Error: Know your worth')
                            .setDescription(`You don't have enough balance to accept this bet. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.followUp({embeds: [embed]})
                        return;
                    }
                    const u2spell1 = await Spell.findById(user2.spellSlot1);
                    const u2spell2 = await Spell.findById(user2.spellSlot2);
                    const u2spell3 = await Spell.findById(user2.spellSlot3);
                    const u2spell4 = await Spell.findById(user2.spellSlot4);

                    const spells = [u2spell1, u2spell2, u2spell3, u2spell4].filter(Boolean); // This will remove any null/undefined values
                    const [firstSpell, secondSpell, thirdSpell, fourthSpell] = spells;
                    let slotAmount2 = spells.length;

                    const player2 = createPlayer(interaction.user.id, interaction.user, user2, user2.hp + user2.hpBonus, user2.stamina+user2.staminaBonus, user2.combat+user2.combatBonus, user2.strengthLevel+user2.strengthBonus, firstSpell, secondSpell, thirdSpell, fourthSpell, slotAmount2, interaction.user.displayAvatarURL(), "Orange");
                    nextTurn(player1, player2, "", [], player1.health, player1.stamina, player2.health, player2.stamina);
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
            console.error(`Error in /dueling: ${error}`);
            const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Process error')
                            .setDescription("There was an error processing the game. Please report to the developer.")
                        interaction.followUp({embeds: [embed]})
                        return;
        }
    },
};
