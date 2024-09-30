const { Client, Interaction, EmbedBuilder, ReactionCollector, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, MessageActionRow } = require('discord.js');
const User = require('../../models/user');
const Monsters = require('../../data/monster'); // assuming you have a separate file with all monsters and their data
const Inventory = require('../../models/inventory');
const Equipment = require('../../models/equipment');
const Usables = require('../../models/usable');
const Materials = require('../../models/material');
const Stocks = require('../../models/stock');
const Bank = require('../../models/bank');
const Spell = require('../../models/spell');
const Effect = require('../../models/effect');
const {checkLevelUp} = require('../../utils/xpUtils');
const {getTotalTokens} = require('../../utils/tokenUtils');
const Title = require('../../models/title');

const axios = require('axios');
const sharp = require('sharp');

const awaitHunt = 30;

const huntFails = [
    "sweeped your legs causing you to fall"
]

module.exports = {
    name: 'hunt',
    description: 'Hunt a monster and gather materials',
    /**
   * @param {Client} client
   * @param {Interaction} interaction
   * @param {ReactionCollector} createReactionCollector
   */
    callback: async (client, interaction, createReactionCollector) => {
        try {
            

            const query = { userId: interaction.user.id };
            const user = await User.findOne(query);

            const monsters = await Monsters.find({}); 
            
            if (!user) {
                await interaction.deferReply();
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            
            const energyEffect = await Effect.findOne({userId: interaction.user.id, effectedType: "Hunt"})
            const now = new Date();

            const timeCons = awaitHunt * 60 * 1000; // 30 minutes * 60 seconds * 1000 milliseconds
            
            // Check if it's been more than an hour since the last use
            if (!user.lastHunt || now - user.lastHunt > (timeCons)) {
                // Reset the huntAttempts, and huntTokens since it's been more than an hour
                user.huntAttempts = 0;
                user.huntTokens = getTotalTokens(user.stamina + user.staminaBonus);  // Resetting to X tokens
                user.lastHunt = now;  // Set the new one-hour window start
                await user.save();
            }

            if (!energyEffect && user.huntAttempts >= 10) {
                await interaction.deferReply();
                const nextAvailableHunt = new Date(user.lastHunt.getTime() + (timeCons));
                const timeRemainingMilliseconds = nextAvailableHunt - now;
            
                const timeRemainingMinutes = Math.floor(timeRemainingMilliseconds / (60 * 1000));
                const timeRemainingSeconds = Math.floor((timeRemainingMilliseconds % (60 * 1000)) / 1000);

                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Halt: Time Restriction`)
                        .setDescription(`You have exhausted all your hunts for this ${awaitHunt} minute period. Wait for the cooldown: \`${timeRemainingMinutes}m : ${timeRemainingSeconds}s\`.`)
                    interaction.editReply({embeds: [embed]})
                    return;
            }         

            // Pull a monster based on rarity and appearance rate (this is a simplified method, you can further refine it
            const monster = selectMonsterByRarity(monsters, user.huntingLevel + user.huntingBonus);
            console.log("about to send monster:")
            if(monster.boss){
                console.log("boss battle has started:")
                //Initiating Variables
                let joinedAmount = 0;
                const players = [];
                const globalEffects = [];

                const assignRewards = async (turnPlayers, boss) => {
                    const rewardStatements = [];
                    for (const player of turnPlayers) {

                             const reactingUser = await User.findOne({ userId: player.id });
                            const dropId = boss.enemy.drops[Math.floor(Math.random() * boss.enemy.drops.length)];
    
                            // Fetch the actual material using the dropId
                            const dropMaterial = await Materials.findById(dropId);
                            const dropEquipment = await Equipment.findById(dropId);
                            const drop = dropEquipment || dropMaterial;
    
                            if(!dropMaterial && !dropEquipment) {
                                console.error('Drop material not found in database.');
                                return;
                            }
    
                            // Find the user's inventory
                            const inventory = await Inventory.findOne({ userId: player.id });
    
                            if (!inventory) {
                                const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Inventory does not exist')
                                .setDescription("Unable to find inventory, report error to the developer")
                            interaction.editReply({embeds: [embed]})
                            return;
                            }
    
                            // Find if the material already exists in the database
    
                            if(dropMaterial){
                                const existingMaterial = await Materials.findOne({ name: drop.name, userId: player.id });
                                if (existingMaterial) {
                                    // Material exists in the database
                                    // Check if the user's inventory references this material
                                    if (inventory.materials.includes(existingMaterial._id)) {
                                        // The material is referenced in the user's inventory. Update its quantity.
                                        existingMaterial.quantity += 1;
                                        await existingMaterial.save();
                                    } else {
                                        // The material isn't in the user's inventory. Reference it.
                                        inventory.materials.push(existingMaterial._id);
                                    }
                                } else {
                                    // Material doesn't exist in the database. Create a new one and reference it in the user's inventory.
                                    const newItemData = {...dropMaterial._doc};  // _doc gives you the properties of the mongoose document
                                        
                                    newItemData.userId = player.id;
                                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one
            
                                    const newItem = new Materials(newItemData);
                                    await newItem.save();
                                    inventory.materials.push(newItem._id);
                                }
                            }else if(dropEquipment){
                                const existingEquipment = await Equipment.findOne({ name: drop.name, userId: player.id });
                                if (existingEquipment) {
                                    // Material exists in the database
                                    // Check if the user's inventory references this material
                                    if (inventory.equipment.includes(existingEquipment._id)) {
                                        // The material is referenced in the user's inventory. Update its quantity.
                                        existingEquipment.quantity += 1;
                                        await existingEquipment.save();
                                    } else {
                                        // The material isn't in the user's inventory. Reference it.
                                        inventory.equipment.push(existingEquipment._id);
                                    }
                                } else {
                                    // Material doesn't exist in the database. Create a new one and reference it in the user's inventory.
                                    const newItemData = {...dropEquipment._doc};  // _doc gives you the properties of the mongoose document
                                        
                                    newItemData.userId = player.id;
                                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one
            
                                    const newItem = new Equipment(newItemData);
                                    await newItem.save();
                                    inventory.equipment.push(newItem._id);
                                }
                            }
    
                            // Deduct the hunt token and increment the command usage count
                            const grantedXP = Math.floor(Math.random() * (boss.enemy.highXP - boss.enemy.lowXP + 1) + boss.enemy.lowXP);
                            let grantedDoros;
                            if(boss.enemy.rarity === 'S') grantedDoros = Math.floor(Math.random() * (40000 - 20001) + 20000);
                            if(boss.enemy.rarity === 'A') grantedDoros = Math.floor(Math.random() * (30000 - 15001) + 15000);
                            if(boss.enemy.rarity === 'B') grantedDoros = Math.floor(Math.random() * (15000 - 7501) + 7500);
                            if(boss.enemy.rarity === 'C') grantedDoros = Math.floor(Math.random() * (7500 - 3001) + 3000);
                            if(boss.enemy.rarity === 'D') grantedDoros = Math.floor(Math.random() * (3000 - 1001) + 1000);
    
                            reactingUser.huntingXp += grantedXP;
    
                            const updatedInfo = checkLevelUp(reactingUser.huntingXp, reactingUser.huntingLevel ,reactingUser.huntingBonus);
                            reactingUser.huntingXp = updatedInfo.xp;
                            reactingUser.huntingLevel = updatedInfo.level;
                            reactingUser.balance += grantedDoros;
    
                            const attributes = ['dexterity', 'mentality', 'luck', 'strength', 'defense'];
                            const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
                            const grantedXP2 = Math.floor(Math.random() * (boss.enemy.highXP - boss.enemy.lowXP + 1) + boss.enemy.lowXP);
                            reactingUser[`${randomAttribute}Xp`] += grantedXP2;
                            const updatedInf2o = checkLevelUp(reactingUser[`${randomAttribute}Xp`], reactingUser[`${randomAttribute}Level`], reactingUser[`${randomAttribute}Bonus`]);
    
                            reactingUser[`${randomAttribute}Xp`] = updatedInf2o.xp;
                            reactingUser[`${randomAttribute}Level`] = updatedInf2o.level;
    
                            reactingUser.huntTokens -= 1;
    
                            await inventory.save(); // Save the updated inventory
                            await reactingUser.save(); // Save the updated user details
                            
                            rewardStatements.push(`- ${player.name} received 1x \`${drop.name}\`!`)
                            rewardStatements.push(`- (**+${grantedXP}**) hunting XP gained.`)
                            rewardStatements.push(`- (**+${grantedXP2}**) ${randomAttribute} XP gained.`)
                            rewardStatements.push(`- (**+${grantedDoros}**) Doros aqcuired.\n`)
                            
                    }
                    console.log(rewardStatements)
                    return rewardStatements;
                    
                }

                let GlobalEnd = false;

                const checkEnd = async (turnPlayers, prevAction, boss) => {
                    if(turnPlayers.length === 0){
                        const turnEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`Total Party Annihilation`)
                        .setDescription(`*${boss.enemy.name}'s* Current Health: \`${boss.health} HP\``)
                        .setFields({name: '⁉️ Previous Actions: ', value: [...prevAction].join('\n')})
                        .setFields({name: '📃 Raid Results: ', value: `- The entire party was wiped, and ${boss.enemy.name} left leisurely`})

                        await interaction.followUp({ embeds: [turnEmbed]});
                    }
                    else if(boss.health <= 0){
                        const rewardStatements = await assignRewards(turnPlayers, boss);
                        const turnEmbed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Raid Success`)
                        .setDescription(`*${boss.enemy.name}'s* Current Health: \`${boss.health} HP\``)
                        .setFields({name: '⁉️ Previous Actions: ', value: [...prevAction].join('\n')})
                        .setFields({name: '💰 Raid Results: ', value: `- Successfully raided ${boss.enemy.name}\n\n${[...rewardStatements].join('\n')}`})

                        await interaction.followUp({ embeds: [turnEmbed]});
                    }
                    else{
                        return false;
                    }
                    GlobalEnd = true;
                    return true;
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

                const createBoss = (enemy, health, highDamage, lowDamage, attackOptions) => {
                    return {
                        enemy: enemy || null,
                        health: health || 1, 
                        highDamage: highDamage || 1, 
                        lowDamage: lowDamage || 1,
                        attackOptions: attackOptions || []
                    }
                }

                const bossMonster = createBoss(monster, monster.health, monster.highDamage, monster.lowDamage, monster.attackOptions);
                
                const createEffect = async (user, effectedPlayer, turns, type, attribute, value) => {
                    return {
                        user: user,
                        effectedPlayer: effectedPlayer,
                        turns: turns,
                        type: type,
                        attribute: attribute,
                        value: value,
                    }
                }
    
                const useSpell = async (spellUser, spell, globalEffects) => {
                    let damage = 0;
                    const turnAction = [];
                    const warnings = [];
                    turnAction.push(`- **${spellUser.name}** used ${spell.name},  ${spell.description}`)
    
                    let turnActionSub = "";
                    if (spell.spellApplication.hp && spell.spellApplication.hp !== 0){
                        spellUser.health -= spell.spellApplication.hp;
                        turnAction.push(`- Spell drained \`${spell.spellApplication.hp} HP\``)
                    }
                    if (spell.spellApplication.stamina && spell.spellApplication.stamina !== 0){
                        spellUser.stamina -= spell.spellApplication.stamina;
                        turnAction.push(`- Spell drained \`${spell.spellApplication.stamina} Stamina\``)
                    }
                    if (spell.spellApplication.hp && spell.spellApplication.hp !== 0 && spell.spellApplication.stamina && spell.spellApplication.stamina !== 0){
                        turnAction.push(`- Spell drained \`${spell.spellApplication.hp} HP and ${spell.spellApplication.stamina} Stamina\``)
                    }
    
                    if(spellUser.health < 1){
                        warnings.push(`- Unable to fully complete the spell, ${spellUser.name} fully drained their health, resulting in \`death\` 🪦.`)
                        return {
                            spellUser: spellUser,
                            damage: damage,
                            turnAction: [],
                            warnings: warnings,
                            globalEffects: globalEffects,
                        };
                    }
    
                    if(spellUser.stamina < 0){
                        warnings.push(`- Unable to fully complete the spell, ${spellUser.name} fully drained their stamina past its brink, resulting in \`failure to cast\`.`)
                        return {
                            spellUser: spellUser,
                            damage: damage,
                            turnAction: [],
                            warnings: warnings,
                            globalEffects: globalEffects,
                        };
                    }
    
                    if(spell.type === "attack"){
    
                        if(!spell.spellApplication.passive){
                            damage += spell.spellApplication.combat;
    
                            const critical = Math.random() * 200
                            if (critical < spellUser.user.luckLevel){
                                const addition = Math.floor(damage * Math.random());
    
                                turnAction.push(`- Landed a **Critical Hit**, dealt \`${damage} (+ ${addition} critical) damage\``)
                                damage += addition;
                            }
                            else{
                                turnAction.push(`Dealt \`${damage} damage\``)
                            }
                        }
                        else{
                            const newEffect = await createEffect(spellUser, "boss", spell.spellApplication.turns, spell.type, "health", spell.spellApplication.combat);
                            const doesEffectExist = globalEffects.some(effect => 
                                effect.user === spellUser &&
                                effect.effectedPlayer === newEffect.effectedPlayer &&
                                effect.type === newEffect.type &&
                                effect.attribute === newEffect.attribute &&
                                effect.value === newEffect.value &&
                                effect.turns !== 0
                            );
                                
                            if(doesEffectExist){
                                turnAction.splice(0, turnAction.length);
                                warnings.push(`- **${spellUser.name}**'s spell use failed as this spell is still in use, please wait for the effect to end.`)
                            }
                            else{
                                globalEffects.push(newEffect);
                            }
                            
                        }
                    } else if(spell.type === "shield"){
                        const newEffect = await createEffect(spellUser, spellUser.id, spell.spellApplication.turns, spell.type, "", spell.spellApplication.combat);
                        const doesEffectExist = globalEffects.some(effect => 
                            effect.user === spellUser &&
                            effect.effectedPlayer === newEffect.effectedPlayer &&
                            effect.type === newEffect.type &&
                            effect.turns !== 0
                        );
                            
                        if(doesEffectExist){
                            turnAction.splice(0, turnAction.length);
                            warnings.push(`- **${spellUser.name}**'s spell use failed as this spell is still in use, please wait for the effect to end.`)
                        }
                        else{
                            globalEffects.push(newEffect);
                            turnAction.push(`- **${spellUser.name}** activated a defense shield for ${spell.spellApplication.turns} turns (${spell.spellApplication.combat}% absorbtion rate)`)
                        }
                        
                        
                    } else if(spell.type === "heal hp"){
                        if(!spell.spellApplication.passive){
                            spellUser.health += spell.spellApplication.combat;
                            turnAction += `${spellUser.name} gained \`${spell.spellApplication.combat} HP\``
                        }else{
                            const newEffect = await createEffect(spellUser, spellUser.id, spell.spellApplication.turns, spell.type, "health", spell.spellApplication.combat);
                            const doesEffectExist = globalEffects.some(effect => 
                                effect.user === spellUser &&
                                effect.effectedPlayer === newEffect.effectedPlayer &&
                                effect.type === newEffect.type &&
                                effect.attribute === newEffect.attribute &&
                                effect.value === newEffect.value &&
                                effect.turns !== 0
                            );
                                
                            if(doesEffectExist){
                                turnAction.splice(0, turnAction.length);
                                warnings.push(`- **${spellUser.name}**'s spell use failed as this spell is still in use, please wait for the effect to end.`)
                            }
                            else{
                                globalEffects.push(newEffect);
                                turnAction.push(`- **${spellUser.name}** activated health regeneration for ${spell.spellApplication.turns} turns (heals ${spell.spellApplication.combat} per turn)`)
                            }
                        }
                    } else if(spell.type === "heal stamina"){
                        if(!spell.spellApplication.passive){
                            spellUser.stamina += spell.spellApplication.combat;
                            turnAction += `${spellUser.name} gained \`${spell.spellApplication.combat} stamina\``
                        }else{
                            const newEffect = await createEffect(spellUser, spellUser.id, spell.spellApplication.turns, spell.type, "stamina", spell.spellApplication.combat);
                            const doesEffectExist = globalEffects.some(effect => 
                                effect.user === spellUser &&
                                effect.effectedPlayer === newEffect.effectedPlayer &&
                                effect.type === newEffect.type &&
                                effect.attribute === newEffect.attribute &&
                                effect.value === newEffect.value &&
                                effect.turns !== 0
                            );
                                
                            if(doesEffectExist){
                                turnAction.splice(0, turnAction.length);
                                warnings.push(`- **${spellUser.name}**'s spell use failed as this spell is still in use, please wait for the effect to end.`)
                            }
                            else{
                                globalEffects.push(newEffect);
                                turnAction.push(`- **${spellUser.name}** activated stamina regeneration for ${spell.spellApplication.turns} turns (heals ${spell.spellApplication.combat} per turn)`)
                            }
                        }
                    
                    }else if(spell.type.split('/')[0] === "buff"){
                        const newEffect = createEffect(spellUser, spellUser.id, spell.spellApplication.turns, spell.type.split('/')[0], spell.type.split('/')[1] , spell.spellApplication.combat);
                        const doesEffectExist = globalEffects.some(effect => 
                            effect.user === spellUser &&
                            effect.effectedPlayer === newEffect.effectedPlayer &&
                            effect.type === newEffect.type &&
                            effect.attribute === newEffect.attribute &&
                            effect.turns !== 0
                        );
                            
                        if(doesEffectExist){
                            turnAction.splice(0, turnAction.length);
                            warnings.push(`- **${spellUser.name}**'s spell use failed as this spell is still in use, please wait for the effect to end.`)
                        }
                        else{
                            globalEffects.push(newEffect);
                            turnAction.push(`- **${spellUser.name}** activated ${spell.type.split('/')[1]}-type buff for ${spell.spellApplication.turns} turns (${spell.spellApplication.combat}% increase)`)
                        }
                    } else if(spell.type.split('/')[0] === "debuff"){
                        const newEffect = await createEffect(spellUser, "boss", spell.spellApplication.turns, spell.type.split('/')[0], spell.type.split('/')[1] , spell.spellApplication.combat);
                        const doesEffectExist = globalEffects.some(effect => 
                            effect.user === spellUser &&
                            effect.effectedPlayer === newEffect.effectedPlayer &&
                            effect.type === newEffect.type &&
                            effect.attribute === newEffect.attribute &&
                            effect.turns !== 0
                        );
                            
                        if(doesEffectExist){
                            turnAction.splice(0, turnAction.length);
                            warnings.push(`- **${spellUser.name}**'s spell use failed as this spell is still in use, please wait for the effect to end.`)
                        }
                        else{
                            globalEffects.push(newEffect);
                            turnAction.push(`- **${spellUser.name}** activated ${spell.type.split('/')[1]}-type debuff for ${spell.spellApplication.turns} turns (${spell.spellApplication.combat}% increase)`)
                        }
                    } 
                    return {
                        spellUser: spellUser,
                        damage: damage,
                        turnAction: turnAction,
                        warnings: warnings,
                        globalEffects: globalEffects,
                    };
                }

                const nextTurn = async (turnId, prevAction, prevWarnings, turnPlayers, effects, boss) => {
                    let bossBool = false;
                    if(turnId >= turnPlayers.length){
                        bossBool = true;
                    }

                    console.log('Turn is starting: ')

                    if(bossBool){
                        console.log('Boss starting: ')
                        const bossActions = []
                        const bossEffects = []
                        const warnings = prevWarnings
                        let playerEffects = ""

                        let strengthBuff = 1;
                        let combatBuff = 1;
                        const previousAction = prevAction;

                        if (effects.length !== 0){
                            console.log("Running first effect check for boss");
                            const matchedEffects = effects.filter(effect => effect.effectedPlayer === "boss");
                            matchedEffects.forEach(effect => {
                               if(effect.turns>0){
                                    console.log("Effect for boss (on loop), exists");
                                    if (effect.type === "attack"){
                                        bossEffects.push(`- ${boss.enemy.name} was dealt \`${effect.value} damage\` to his ${effect.attribute} passively **(${effect.turns} turns remaining)**`)
                                        boss.health -= effect.value;
                                        
                                    } else if(effect.type === "debuff"){
                                        bossEffects.push(`- ${boss.enemy.name} is afflicted by a -\`${effect.value}% debuff\` for ${effect.attribute} **(${effect.turns} turns remaining)**`)
                                        if(effect.attribute === "strength"){
                                            strengthBuff -= effect.value/100
                                        }else if(effect.attribute === "combat"){
                                            combatBuff -= effect.value/100
                                        }
                                    }
                                    effect.turns -=1;
                               }
                            });
                        }

                        const end = await checkEnd(turnPlayers, previousAction, boss);
                        if(end) {
                            return;
                        }

                        function getRandomIndices(length) {
                            const indices = Array.from({length}, (_, i) => i);
                            const shuffled = shuffleArray(indices);
                            return shuffled.slice(0, Math.ceil(length / 2));
                        }

                        function shuffleArray(array) {
                            const arrayCopy = array.slice(); // Create a copy to avoid shuffling the original
                            for (let i = arrayCopy.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
                            }
                            return arrayCopy;
                        }

                        function getRandomInt(min, max) {
                            return Math.floor(Math.random() * (max - min + 1)) + min;
                        }

                        function getRandomElement(arr) {
                            const randomIndex = Math.floor(Math.random() * arr.length);
                            return arr[randomIndex];
                        }
                        

                        if(boss.enemy.negate){
                            const indicesToChange = getRandomIndices(turnPlayers.length);

                            indicesToChange.forEach(async index => {
                                const successChance = getRandomInt(1, 100);
                                if(successChance <= boss.enemy.negateChance){
                                    const negationValue = getRandomInt(1, 4);
                                    const turnValue = getRandomInt(1, 3)
                                    const playerChosen = turnPlayers[index];
    
                                    const newEffect = await createEffect(playerChosen, playerChosen.id, turnValue, "negate", negationValue, 0);
                                    const doesEffectExist = globalEffects.some(effect => 
                                        effect.effectedPlayer === newEffect.effectedPlayer &&
                                        effect.type === newEffect.type &&
                                        effect.attribute === newEffect.attribute &&
                                        effect.turns !== 0
                                    );
                                        
                                    if(doesEffectExist){
                                        warnings.push(`- ${boss.enemy.name} tried to negate a spell slot but failed as a similar spell is still in use`)
                                    }
                                    else{
                                        globalEffects.push(newEffect);
                                        bossActions.push(`- ${boss.enemy.name} temporarily disabled ${playerChosen.name}'s \`slot ${negationValue}\` for ${turnValue} turns.`)
                                    }
                                }
                                
                            });
                        }

                        const indicesToChange2 = getRandomIndices(turnPlayers.length);

                        let name = "Undefined"

                        let indicesOfDeadPlayers = [];

                        indicesToChange2.forEach(async index => {
                            let shield = false;
                            let shieldAbsorbtion = 0;
                            let shieldAction =""
                            

                            const damage = getRandomInt(boss.lowDamage, boss.highDamage);
                            const playerChosen = turnPlayers[index];
                            name = playerChosen.name;

                            if (effects.length !== 0){
                                console.log("Running Effect check for plaer");
                                const matchedEffects = effects.filter(effect => effect.effectedPlayer === playerChosen.id);
                                matchedEffects.forEach(effect => {
                                   if(effect.turns>0){
                                        if (effect.type === "shield"){
                                
                                            playerEffects += `- ${playerChosen.name}'s shield is currently active (${effect.value}% absorbtion) **(${effect.turns} turns remaining)**`
                                            shield = true;
                                            shieldAbsorbtion = effect.value;
                
                                        }
                                   }
                                });
                            }
                            
                            if(shieldAbsorbtion>100){
                                shieldAbsorbtion = 100
                            }

                            let defenseVal = 0;

                            if (playerChosen.defenseLevel + playerChosen.defenseBonus > 0){
                                defenseVal = Math.floor((((playerChosen.defenseLevel + playerChosen.defenseBonus) * 30) / (Math.floor((damage * combatBuff * ((100 - shieldAbsorbtion)/100))))))
                            }

                            if(defenseVal > Math.floor((damage * combatBuff * ((100 - shieldAbsorbtion)/100)))){
                                defenseVal = Math.floor((damage * combatBuff * ((100 - shieldAbsorbtion)/100))) - 1
                            }

                            playerChosen.health -= Math.round((damage * combatBuff)) - (Math.floor(damage * combatBuff * ((shieldAbsorbtion)/100)) - defenseVal);
                            console.log(`damage: ${(damage * combatBuff * ((100 - shieldAbsorbtion)/100))}`)

                            let buffStatement = "";
                            let defenseStatement = "";

                            if(combatBuff !== 1){
                                buffStatement = ` (${Math.floor(damage * combatBuff)} after debuff)`
                            }

                            if(shieldAbsorbtion !== 0){
                                shieldAction = ` (${Math.floor(damage * combatBuff * ((shieldAbsorbtion)/100))} damage was absorbed due to the shield)`
                            } 

                            if(defenseVal !== 0){
                                defenseStatement = ` (${defenseVal}) damage was absorbed due to \`defense\`)`
                            }

                            const randomAttackStatement = getRandomElement(boss.attackOptions);

                            if(playerChosen.health <= 0){
                                bossActions.push(`- ${randomAttackStatement} causing **${playerChosen.name}** to take \`${damage}${buffStatement}${shieldAction}${defenseStatement} damage\` and \`die\` 🪦.`)
                                indicesOfDeadPlayers.push(index);
                            }
                            else{
                                bossActions.push(`- ${randomAttackStatement} causing **${playerChosen.name}** to take \`${damage}${buffStatement}${shieldAction}${defenseStatement} damage.\``)
                            }
                        });

                        // After the loop completes, remove the dead players.
                        // We reverse the indices to ensure that we're removing from the end of the array first to avoid the shifting problem.
                        indicesOfDeadPlayers.reverse().forEach(index => {
                            turnPlayers.splice(index, 1);
                        });

                        const turnEmbed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`${boss.enemy.name}'s Move`)
                        .setDescription(`*${boss.enemy.name}'s* Current Health: \`${boss.health} HP\``)
                        if(previousAction.length !== 0){
                            turnEmbed.addFields({name: `⁉️ Previous Actions: `, value: [...previousAction].join('\n')})
                        }
                        if(bossEffects.length !== 0){
                            turnEmbed.addFields({name: `⏱️ Ongoing Effects For ${boss.enemy.name}: `, value: [...bossEffects].join('\n')})
                        }
                        if(playerEffects !== ""){
                            turnEmbed.addFields({name: `⏱️ Ongoing Effects For ${name}: `, value: playerEffects})
                        }
                        if(warnings.length !== 0){
                            console.log([...warnings].join('\n'))
                            turnEmbed.addFields({name: `⚠️ Use Case Failures:`, value: [...warnings].join('\n')})
                        }
                        turnEmbed.addFields({name: '💥 Boss Actions: ', value: [...bossActions].join('\n')})

                        await interaction.followUp({ embeds: [turnEmbed]});

                        const end2 = await checkEnd(turnPlayers, previousAction.concat(bossActions), boss);
                        if(end2) {
                            return;
                        }

                        nextTurn(0, [], [], turnPlayers, effects, boss) 

                    }else{
                        const currentPlayer = turnPlayers[turnId];
                        
                        let negate1 = false;
                        let negate2 = false;
                        let negate3 = false;
                        let negate4 = false;

                        let luckBuff = 1;
                        let strengthBuff = 1;
                        let combatBuff = 1;
                        const currentActions = prevAction;
                        const effectsAction = [];
                        const warnings = prevWarnings;
                        let fearDebuff = 1;

                        if(currentPlayer.user.huntingLevel + currentPlayer.user.huntingBonus + 5< boss.enemy.levelRequirement){
                            fearDebuff = Math.floor(((boss.enemy.levelRequirement - currentPlayer.user.huntingLevel - currentPlayer.user.huntingBonus)/boss.enemy.levelRequirement)*100);
                            warnings.push(`- Due to ${boss.enemy.name} being ${boss.enemy.levelRequirement - currentPlayer.user.huntingLevel - currentPlayer.user.huntingBonus} levels higher than you, you are stricken with fear and a ${fearDebuff}% debuff for all stats is applied to you.`)
                            fearDebuff = (fearDebuff)/100
                            combatBuff -= fearDebuff
                            strengthBuff -= fearDebuff
                            luckBuff -= fearDebuff
                        }
        
                        const buffEffects = await Effect.find({userId: currentPlayer.id, effectedType: 'Buff'})
                        if (buffEffects){
                            buffEffects.forEach(buff => {
                                if (buff.relativeAttribute.toLowerCase === "luck") luckBuff += buff.relativeValue / 100;
                                if (buff.relativeAttribute.toLowerCase === "strength") strengthBuff += buff.relativeValue / 100;
                                if (buff.relativeAttribute.toLowerCase === "combat") combatBuff += buff.relativeValue / 100;
                                effectsAction.push(`- ${currentPlayer.name} gained +\`${buff.relativeValue}% buff\` for ${buff.relativeAttribute} due to external potions`)
                            })
                        }

                        if (effects.length !== 0){
                            const matchedEffects = effects.filter(effect => effect.effectedPlayer === currentPlayer.id);
                            matchedEffects.forEach(effect => {
                               if(effect.turns>0){
                                    console.log(effect.type, effect.attribute, effect.value);
                                    if (effect.type === "attack"){
            
                                        effectsAction.push(`- ${currentPlayer.name} was dealt \`${effect.value}\` damage to his ${effect.attribute} (${effect.turns} turns remaining)`)
                                        currentPlayer[effect.attribute] -= effect.value;
                                        
                                    } 
                                    else if(effect.type === "heal hp" || effect.type === "heal stamina"){
            
                                        effectsAction.push(`- ${currentPlayer.name} gained +\`${effect.value} ${effect.attribute}\` (${effect.turns} turns remaining)`)
                                        currentPlayer[effect.attribute] += effect.value;
                                        
                                    } else if(effect.type === "buff"){
                                        effectsAction.push(`- Passive Effects: ${currentPlayer.name} gained +\`${effect.value}%\` increase for ${effect.attribute} (${effect.turns} turns remaining)`)
                                        if(effect.attribute === "luck"){
                                            luckBuff += effect.value/100
                                        }else if(effect.attribute === "strength"){
                                            strengthBuff += effect.value/100
                                        }else if(effect.attribute === "combat"){
                                            combatBuff += effect.value/100
                                        }
                                    } else if(effect.type === "negate"){
                                        effectsAction.push(`- ${currentPlayer.name}'s slot ${effect.attribute} has been restricted (${effect.turns} turns remaining)`)
                                        if(effect.attribute === "1") negate1 = true;
                                        if(effect.attribute === "2") negate2 = true;
                                        if(effect.attribute === "3") negate3 = true;
                                        if(effect.attribute === "4") negate4 = true;
                                    } else if (effect.type === "shield"){
                                
                                        effectsAction.push(`- ${currentPlayer.name}'s shield is currently active (${effect.value}% absorbtion) (${effect.turns} turns remaining)`)
            
                                    }
                                    effect.turns -=1;
                               }
                            });
                        }

                        const end3 = await checkEnd(turnPlayers, prevAction, boss);
                        if(end3) {
                            return;
                        }

                        const weapon = await Equipment.findById(currentPlayer.user.weapon);

                        const attackOptions = [];
                        if(!weapon){ attackOptions.push({name: "Punch"});}
                        else if(Math.floor(weapon.boost.combat/20) < currentPlayer.stamina){attackOptions.push({name: "Weapon"});}
                        else{warnings.push(`- ${currentPlayer.name}'s stamina is too low to use their weapon.`)}
        
                        if (currentPlayer.slot1 && !negate1) attackOptions.push({name: currentPlayer.slot1.name});
                        if (currentPlayer.slot2 && !negate2) attackOptions.push({name: currentPlayer.slot2.name});
                        if (currentPlayer.slot3 && !negate3) attackOptions.push({name: currentPlayer.slot3.name});
                        if (currentPlayer.slot4 && !negate4) attackOptions.push({name: currentPlayer.slot4.name});

                        const turnEmbed = new EmbedBuilder()
                        .setColor(currentPlayer.color)
                        .setAuthor({name: currentPlayer.name, iconURL: currentPlayer.profilePic})
                        .setTitle(`${currentPlayer.name}'s Turn`)
                        .setDescription(`*${currentPlayer.name}* HP: \`${currentPlayer.health} HP\`\n*${currentPlayer.name}* Stamina: \`${currentPlayer.stamina} SP\`ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n`);
                        
                        if(currentActions.length !== 0){
                            turnEmbed.addFields({name: `⁉️ Previous Actions: `, value: [...currentActions].join('\n')})
                        }
                        if(effectsAction.length !== 0){
                            turnEmbed.addFields({name: `⏱️ Ongoing Effects for ${currentPlayer.name}: `, value: [...effectsAction].join('\n')})
                        }
                        if(warnings.length !== 0){
                            turnEmbed.addFields({name: '⚠️ Use Case Failures: ', value: [...warnings].join('\n')})
                        }
                        
                        
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

                        const turnCollector = turnReply.awaitMessageComponent({filter: turnFilter, componentType: ComponentType.Button, time: 60000 })
                        .then(async interaction => {
                            console.log(`${interaction.user.displayName}'s turn`);
                            await turnReply.edit({ embeds: [turnEmbed], components: [], fetchReply: true});
                            let damage = 0;
                            let stamina = 0;

                            const turnAction = [];
                            const turnWarning = [];

                            let luckApplication = currentPlayer.user.luckLevel * luckBuff;
                            if (interaction.customId === 'Punch') {
                                
                                if(luckApplication > currentPlayer.power * combatBuff){
                                    luckApplication = currentPlayer.power * combatBuff;
                                }
                                damage = Math.floor(Math.random() * ((currentPlayer.power * combatBuff) + 1 - luckApplication)) + luckApplication; 
                                stamina = Math.ciel(damage/20);
                                if (damage === 0) damage = 1; 
                                //critical
                                const critical = Math.random() * 100
                                if (critical < (currentPlayer.user.luckLevel * luckBuff)){
                                    const addition = damage * Math.floor(Math.random() * 11)
        
                                    turnAction.push(`- ${currentPlayer.name} fisted ${boss.enemy.name} and landed a **Critical Hit**, dealt \`${damage} (+ ${addition} critical) Damage\`\n- Attack drained \`${stamina} Stamina\``)
                                    damage += addition;
                                }
                                else{
                                    turnAction.push(`- ${currentPlayer.name} punched ${boss.enemy.name} and dealt \`${damage} Damage\`\n- Attack drained \`${stamina} of their stamina\``)
                                }
                            }else if (interaction.customId === 'Weapon') {
                                let scaling
                                if (weapon.scaling === "combat"){
                                    scaling = user.combat + user.combatBonus
                                    if(combatBuff > 1){
                                        scaling *= combatBuff
                                    }
                                }
                                else if(weapon.scaling === "strength"){
                                    scaling = user[weapon.scaling + "Level"] + user[weapon.scaling + "Bonus"]
                                    scaling *= strengthBuff
                                }
                                else{
                                    scaling = user[weapon.scaling + "Level"] + user[weapon.scaling + "Bonus"]
                                }
                                if(luckApplication > (currentPlayer.power*combatBuff) - 9 ){
                                    luckApplication = (currentPlayer.power * combatBuff) - 9 ;
                                }
                                damage = Math.floor((Math.random() * ((currentPlayer.power*combatBuff) - 9 - luckApplication)) + 10) + luckApplication; 
                                stamina = Math.floor(damage/10);
                                const damageBonus = Math.floor((((currentPlayer.strength*strengthBuff)/100) * (currentPlayer.power*combatBuff)) + (damage * (scaling/100))) 
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
                                    
                                    turnAction.push(`- ${currentPlayer.name} used ${weapon.name} and landed a **Critical Hit**, dealt \`${damage} (+ ${damageBonus} bonus) (+ ${addition} critical) Damage\`\n- Attack drained \`${stamina} Stamina\``)
                                    damage += addition;
                                }
                                else{
                                    turnAction.push(`- ${currentPlayer.name} used ${weapon.name}, and dealt \`${damage} (+ ${damageBonus} bonus) Damage\`\n- Attack drained \`${stamina} Stamina\``)
                                }
                                damage+= damageBonus;
                            }else if (interaction.customId === currentPlayer.slot1.name) {
                                const result = await useSpell(currentPlayer, currentPlayer.slot1, effects);
                                effects = result.globalEffects;
                                damage = result.damage;
                                currentPlayer.health = result.spellUser.health;
                                currentPlayer.stamina = result.spellUser.stamina;
                                turnAction.push(...result.turnAction)
                                turnWarning.push(...result.warnings)
                            }else if (interaction.customId === currentPlayer.slot2.name) {
                                const result = await useSpell(currentPlayer, currentPlayer.slot2, effects);
                                effects = result.globalEffects;
                                damage = result.damage;
                                currentPlayer.health = result.spellUser.health;
                                currentPlayer.stamina = result.spellUser.stamina;
                                turnAction.push(...result.turnAction)
                                turnWarning.push(...result.warnings)
                            }else if (interaction.customId === currentPlayer.slot3.name) {
                                const result = await useSpell(currentPlayer, currentPlayer.slot3, effects);
                                effects = result.globalEffects;
                                damage = result.damage;
                                currentPlayer.health = result.spellUser.health;
                                currentPlayer.stamina = result.spellUser.stamina;
                                turnAction.push(...result.turnAction)
                                turnWarning.push(...result.warnings)
                            }else if (interaction.customId === currentPlayer.slot4.name) {
                                const result = await useSpell(currentPlayer, currentPlayer.slot4, effects);
                                effects = result.globalEffects;
                                damage = result.damage;
                                currentPlayer.health = result.spellUser.health;
                                currentPlayer.stamina = result.spellUser.stamina;
                                turnAction.push(...result.turnAction)
                                turnWarning.push(...result.warnings)
                            }
                            
                            boss.health -= damage
                            currentPlayer.stamina -= stamina;
                            const end5 = await checkEnd(turnPlayers, turnAction, boss);
                            if(end5) {
                                return;
                            }
                            console.log("turn ended");
                            nextTurn(turnId+1, turnAction, turnWarning, turnPlayers, effects, boss)

                        })
                        .catch(async err => {
                            console.log(err)
                            if(!GlobalEnd){
                                await turnReply.edit({ embeds: [turnEmbed], components: [], fetchReply: true});

                                const skipped = new EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`${currentPlayer.name} Timeout`)
                                .setDescription(`${currentPlayer.name}'s turn was skipped due to timeout`);
                                await interaction.followUp({ embeds: [skipped]});
                                
                                nextTurn(turnId+1, prevAction, [], turnPlayers, effects, boss);
                            }
                        });
                    }
                }

                const str = `${monster.description}`

                const maxDescriptionLengthPerLine = 52; // adjust as needed
                const splitDesc = splitDescription(str, maxDescriptionLengthPerLine);
                

                const path = require('path');
                const absolutePath = path.resolve(__dirname, `../../Images/${monster.pic}`);
                console.log(absolutePath);
                            
                const imgBuffer = await processImage(absolutePath, 15/16);

                let lowerLevel = monster.levelRequirement - 3

                if(lowerLevel < 0) lowerLevel = 0;

                const bottomText = splitDescription(`(Reccomended 5 users from levels ${lowerLevel} - ${monster.levelRequirement} to raid)`, maxDescriptionLengthPerLine);

                const initiatorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setAuthor({name: "Boss Encounter"})
                .setTitle(`${monster.name} [${monster.rarity} Rank]`)
                .setDescription(`${splitDesc}\nㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n${bottomText}\n\nPress the button to join and attempt to hunt\nthis monster alongside others. (0/5)`)
                .setImage('attachment://processedImage.jpeg');

                const acceptButton = new ButtonBuilder()
                .setCustomId('join')
                .setLabel('Join')
                .setStyle(ButtonStyle.Success);

                const initiatorRow = new ActionRowBuilder().addComponents(acceptButton);
                const initialReply = await interaction.reply({embeds: [initiatorEmbed], components: [initiatorRow], files: [{ attachment: imgBuffer, name: 'processedImage.jpeg' }]});
                const filter = (i) => true; 
                const collector = initialReply.createMessageComponentCollector({ filter, time: 180000 });

                

                collector.on('collect', async (i) => {
                    console.log(i.user.id); // This will print the name of the user who clicked the button

                    const reactingUser = await User.findOne({ userId: i.user.id });
                    if (!reactingUser) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid User')
                            .setDescription("Register with the Dauntless Bank (/register) to access hunting grounds.")
                        interaction.followUp({embeds: [embed]})
                    }
                    else{
                        if (players.some(player => player.id === i.user.id)) {
                            console.log('Player with this ID already exists!');
                            const edittedBottomText = splitDescription(`A boss raid has begun, press the button to join and \nattempt to hunt this monster alongside others. (${joinedAmount}/5)`, maxDescriptionLengthPerLine);
                            initiatorEmbed.setDescription(`${splitDesc}\nㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n${bottomText}\n\n${edittedBottomText}`)
                            await i.update({ embeds: [initiatorEmbed], components: [initiatorRow] });
                        } else {
                            const u2spell1 = await Spell.findById(reactingUser.spellSlot1);
                            const u2spell2 = await Spell.findById(reactingUser.spellSlot2);
                            const u2spell3 = await Spell.findById(reactingUser.spellSlot3);
                            const u2spell4 = await Spell.findById(reactingUser.spellSlot4);
                            const spells = [u2spell1, u2spell2, u2spell3, u2spell4].filter(spell => spell && spell.type !== "negate");  // This will remove any null/undefined values
                            const [firstSpell, secondSpell, thirdSpell, fourthSpell] = spells;
                            let slotAmount2 = spells.length;
                            const player = createPlayer(i.user.id, i.user.displayName, reactingUser, reactingUser.hp + reactingUser.hpBonus, reactingUser.stamina+reactingUser.staminaBonus, reactingUser.combat+reactingUser.combatBonus, reactingUser.strengthLevel+reactingUser.strengthBonus, firstSpell, secondSpell, thirdSpell, fourthSpell, slotAmount2, i.user.displayAvatarURL(), "Orange");
                            joinedAmount += 1;
                            players.push(player);

                            if(joinedAmount === 5){
                                const edittedBottomText = splitDescription(`Max amount of hunters have joined, the raid is now starting. (${joinedAmount}/5)`, maxDescriptionLengthPerLine);
                                initiatorEmbed.setDescription(`${splitDesc}\nㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n${bottomText}\n\n${edittedBottomText}`)
                                await i.update({ embeds: [initiatorEmbed], components: [] });
                                nextTurn(0, [], [], players, [], bossMonster)
                            }
                            else{
                                const edittedBottomText = splitDescription(`A boss raid has begun, press the button to join and attempt to hunt this monster alongside others. (${joinedAmount}/5)`, maxDescriptionLengthPerLine);
                                initiatorEmbed.setDescription(`${splitDesc}\nㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n${bottomText}\n\n${edittedBottomText}`)
                                await i.update({ embeds: [initiatorEmbed], components: [initiatorRow] });
                            }
                        }
                    }
                    
                    
                });

                collector.on('end', collected => {
                    initialReply.edit({ embeds: [initiatorEmbed], components: [] });
                    if (collected.size === 0) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Silence...')
                            .setDescription("No one dared approach the boss")
                        interaction.followUp({embeds: [embed]})
                    }
                    else{
                        if(joinedAmount !== 5){
                            const edittedBottomText = splitDescription(`Time window to join has ended, the raid is now starting. (${joinedAmount}/5)`, maxDescriptionLengthPerLine);
                            initiatorEmbed.setDescription(`${splitDesc}\nㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n${bottomText}\n\n${edittedBottomText}`)
                            initialReply.edit({ embeds: [initiatorEmbed], components: [] });
                        }
                        nextTurn(0, [], [], players, [], bossMonster)
                    }
                });  
            }
            else{
                await interaction.deferReply();

                const str = `${monster.description}`;

                const maxDescriptionLengthPerLine = 50; // adjust as needed
                const splitDesc = splitDescription(str, maxDescriptionLengthPerLine);

                const path = require('path');
                const absolutePath = path.resolve(__dirname, `../../Images/${monster.pic}`);
                const imgBuffer = await processImage(absolutePath, 16/17);

                let lowerLevel = monster.levelRequirement - 5

                if(lowerLevel < 0) lowerLevel = 0;

                const monsterEmbed = new EmbedBuilder()
                    .setColor("DarkGreen")
                    .setAuthor({name: "Enemy Encounter"})
                    .setTitle(`${monster.name} [${monster.rarity} Rank]`)
                    .setDescription(`${splitDesc}\nㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ\n (Reccomended Level: ${lowerLevel} - ${monster.levelRequirement})`)
                    .setFooter({text: "React first to hunt."})
                    .setImage('attachment://processedImage.jpeg');
                
                const monsterMessage = await interaction.editReply({ 
                    embeds: [monsterEmbed],
                    fetchReply: true,
                    files: [{ attachment: imgBuffer, name: 'processedImage.jpeg' }]
                });

                user.huntAttempts += 1;
                await user.save();

                await monsterMessage.react('🎯');

                const reactedUsers = new Set();

                const filter  = (reaction, user) => user.id !== client.user.id && !reactedUsers.has(user.id);

                const collector = monsterMessage.createReactionCollector({ filter, time: 180000 }); // 3 minutes in milliseconds
                
                collector.on('collect', async (reaction, userReacted) => {
                    
                    const reactingUser = await User.findOne({ userId: userReacted.id });
                    
                    if (!reactingUser) {
                        const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid User')
                            .setDescription("Register with the Dauntless Bank (/register) to access hunting grounds.")
                        interaction.followUp({embeds: [embed]})
                    }
                    else{
                        const now = new Date();
                        const timeCons = (awaitHunt) * 60 * 1000; // 30 minutes * 60 seconds * 1000 milliseconds
                        
                        // Check if it's been more than an hour since the last use
                        if (now - reactingUser.lastHunt > timeCons) {
                            // Reset the huntAttempts, and huntTokens since it's been more than an hour
                            reactingUser.huntAttempts = 0;
                            reactingUser.huntTokens = getTotalTokens(user.stamina + user.staminaBonus);  // Resetting to 3 tokens
                            reactingUser.lastHunt = now;  // Set the new one-hour window start
                            await reactingUser.save();
                        }
                        
                        if (reactingUser.huntTokens <= 0) {
                            const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Exhaustion: Cannot Hunt More')
                                .setDescription("You don\'t have any hunt tokens left. Wait for them to reset.")
                            interaction.followUp({embeds: [embed]})
                            return;
                        }

                        reactedUsers.add(userReacted.id);
    
                        // Determine hunt success based on monster rarity (simplified for the example)
                        const huntSuccess = determineHuntSuccess(monster, reactingUser.huntingLevel + reactingUser.huntingBonus, reactingUser.luckLevel + reactingUser.luckBonus);
    
                        if (huntSuccess) {
                            collector.stop(); // stops the collector after a successful hunt
                            // Get a random drop ID from the monster
                            const dropId = monster.drops[Math.floor(Math.random() * monster.drops.length)];
    
                            // Fetch the actual material using the dropId
                            const dropMaterial = await Materials.findById(dropId);
                            const dropEquipment = await Equipment.findById(dropId);
                            const drop = dropEquipment || dropMaterial;
    
                            if(!dropMaterial && !dropEquipment) {
                                console.error('Drop material not found in database.');
                                return;
                            }
    
                            // Find the user's inventory
                            const inventory = await Inventory.findOne({ userId: userReacted.id });
    
                            if (!inventory) {
                                const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Inventory does not exist')
                                .setDescription("Unable to find inventory, report error to the developer")
                            interaction.editReply({embeds: [embed]})
                            return;
                            }
    
                            // Find if the material already exists in the database
    
                            if(dropMaterial){
                                const existingMaterial = await Materials.findOne({ name: drop.name, userId: userReacted.id });
                                if (existingMaterial) {
                                    // Material exists in the database
                                    // Check if the user's inventory references this material
                                    if (inventory.materials.includes(existingMaterial._id)) {
                                        // The material is referenced in the user's inventory. Update its quantity.
                                        existingMaterial.quantity += 1;
                                        await existingMaterial.save();
                                    } else {
                                        // The material isn't in the user's inventory. Reference it.
                                        inventory.materials.push(existingMaterial._id);
                                    }
                                } else {
                                    // Material doesn't exist in the database. Create a new one and reference it in the user's inventory.
                                    const newItemData = {...dropMaterial._doc};  // _doc gives you the properties of the mongoose document
                                        
                                    newItemData.userId = userReacted.id;
                                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one
            
                                    const newItem = new Materials(newItemData);
                                    await newItem.save();
            
                                    console.log(newItem._id);
                                    inventory.materials.push(newItem._id);
                                }
                            }else if(dropEquipment){
                                const existingEquipment = await Equipment.findOne({ name: drop.name, userId: userReacted.id });
                                if (existingEquipment) {
                                    // Material exists in the database
                                    // Check if the user's inventory references this material
                                    if (inventory.equipment.includes(existingEquipment._id)) {
                                        // The material is referenced in the user's inventory. Update its quantity.
                                        existingEquipment.quantity += 1;
                                        await existingEquipment.save();
                                    } else {
                                        // The material isn't in the user's inventory. Reference it.
                                        inventory.equipment.push(existingEquipment._id);
                                    }
                                } else {
                                    // Material doesn't exist in the database. Create a new one and reference it in the user's inventory.
                                    const newItemData = {...dropEquipment._doc};  // _doc gives you the properties of the mongoose document
                                        
                                    newItemData.userId = userReacted.id;
                                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one
            
                                    const newItem = new Equipment(newItemData);
                                    await newItem.save();
            
                                    console.log(newItem._id);
                                    inventory.equipment.push(newItem._id);
                                }
                            }
    
                            // Deduct the hunt token and increment the command usage count
                            const grantedXP = Math.floor(Math.random() * (monster.highXP - monster.lowXP + 1) + monster.lowXP);
                            let grantedDoros;
                            if(monster.rarity === 'S') grantedDoros = Math.floor(Math.random() * (2000 - 501) + 500);
                            if(monster.rarity === 'A') grantedDoros = Math.floor(Math.random() * (1000 - 301) + 300);
                            if(monster.rarity === 'B') grantedDoros = Math.floor(Math.random() * (500 - 201) + 200);
                            if(monster.rarity === 'C') grantedDoros = Math.floor(Math.random() * (200 - 51) + 50);
                            if(monster.rarity === 'D') grantedDoros = Math.floor(Math.random() * 50);
    
                            reactingUser.huntingXp += grantedXP;
    
                            const updatedInfo = checkLevelUp(reactingUser.huntingXp, reactingUser.huntingLevel , reactingUser.huntingBonus );
                            reactingUser.huntingXp = updatedInfo.xp;
                            reactingUser.huntingLevel = updatedInfo.level;
                            reactingUser.balance += grantedDoros;
    
                            // List of attributes to randomly choose from
                            const attributes = ['dexterity', 'mentality', 'luck', 'strength', 'defense', 'labour'];
    
                            // Randomly select an attribute
                            const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
    
                            // Grant a random XP amount between 10 and 30
                            const grantedXP2 = Math.floor(Math.random() * (monster.highXP - monster.lowXP + 1) + monster.lowXP); 
    
                            // Add the granted XP to the selected attribute
                            reactingUser[`${randomAttribute}Xp`] += grantedXP2;
    
                            // Check for a level up in the selected attribute
                            const updatedInf2o = checkLevelUp(reactingUser[`${randomAttribute}Xp`], reactingUser[`${randomAttribute}Level`] , reactingUser[`${randomAttribute}Bonus`]);
    
                            // Update the XP and level of the selected attribute
                            reactingUser[`${randomAttribute}Xp`] = updatedInf2o.xp;
                            reactingUser[`${randomAttribute}Level`] = updatedInf2o.level;

                            //Title Assignment
                            let titleAssignment = "";
                            const newTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: null})
                            const newTitleDragonSlayer = await Title.findOne({name: "Dragon Slayer", userId: null})
                            const newTitleTreasureHoarder = await Title.findOne({name: "Treasure Hoarder", userId: null})

                            if (!newTitleMoneyBags || !newTitleDragonSlayer || !newTitleTreasureHoarder) {
                                const embed = new EmbedBuilder()
                                            .setColor('Red')
                                            .setTitle('Error: Existing Registering Title')
                                            .setDescription("An error occured, please report to the developer.")
                                        interaction.editReply({embeds: [embed]})
                                        return;
                            }

                            const equippedTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: reactingUser.userId})
                            const equippedDragonSlayer = await Title.findOne({name: "Dragon Slayer", userId: reactingUser.userId})
                            const equippedTreasureHoarder = await Title.findOne({name: "Treasure Hoarder", userId: reactingUser.userId})

                            //Equips the moneybag title:
                            if(!equippedTitleMoneyBags && reactingUser.balance > 50000) {
                                const newItemData = {...newTitleMoneyBags._doc};  // _doc gives you the properties of the mongoose document
                                                    
                                newItemData.userId = reactingUser.userId;
                                delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                                const newItem = new Title(newItemData);
                                await newItem.save();
                                inventory.titles.push(newItem._id)
                                await inventory.save()

                                titleAssignment += "\n\nGained the title: *\"Mr. MoneyBags\"*"
                            }
                            if(!equippedDragonSlayer && (monster.name === "Abyssal Black Flame Dragon God" || monster.name === "Gaping Dragon" || monster.name === "Dragon King of Hatred" ||monster.name === "Dragon King of Greed" ||monster.name === "Dragon King of Pride" ||monster.name === "Bounding Demon of Izalith" )) {
                                const newItemData = {...newTitleDragonSlayer._doc};  // _doc gives you the properties of the mongoose document
                                                    
                                newItemData.userId = reactingUser.userId;
                                delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                                const newItem = new Title(newItemData);
                                await newItem.save();
                                inventory.titles.push(newItem._id)
                                await inventory.save()

                                titleAssignment += "\n\nGained the title: *\"Dragon Slayer\"*"
                            }
                            if(!equippedTreasureHoarder && inventory.materials.length > 29) {
                                const newItemData = {...newTitleTreasureHoarder._doc};  // _doc gives you the properties of the mongoose document
                                                    
                                newItemData.userId = reactingUser.userId;
                                delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                                const newItem = new Title(newItemData);
                                await newItem.save();
                                inventory.titles.push(newItem._id)
                                await inventory.save()

                                titleAssignment += "\n\nGained the title: *\"Treasure Hoarder\"*"
                            }
    
                            reactingUser.huntTokens -= 1;
    
                            await inventory.save(); // Save the updated inventory
                            await reactingUser.save(); // Save the updated user details
    
                            const success = new EmbedBuilder()
                            .setColor("Green")
                            .setTitle(`Successfull Hunt`)
                            .setDescription(`${userReacted.displayName} successfully hunted down the ${monster.name} and received 1x \`${drop.name}\`!\n\n(**+${grantedXP}**) hunting XP gained.\n(**+${grantedXP2}**) ${randomAttribute} XP gained.\n(**+${grantedDoros}**) Doros aqcuired.${titleAssignment}`)
    
                            interaction.followUp({embeds: [success]});
                            
                        } else {
                            const success = new EmbedBuilder()
                            .setTitle(`You're a Failure`)
                            .setDescription(`${userReacted.displayName} failed to hunt down the ${monster.name}. Others may still attempt.`)
    
                            interaction.followUp({embeds: [success]});
                            reactingUser.huntTokens -= 1;
                            await reactingUser.save();
                        }
                    }
                });
            }

        } catch (error) {
            console.log(`Error in /hunt: ${error}`);
            interaction.editReply('An error occurred. Please try again later.');
        }
    }
};

function selectMonsterByRarity(monsters, userLevel) {
    // Filter monsters by level range first
    const levelFilteredMonsters = monsters.filter(monster => 
        monster.levelRequirement >= userLevel - 20 &&
        monster.levelRequirement <= userLevel + 20
    );

    if (levelFilteredMonsters.length === 0) {
        return null;
    }

    // Base rarity percentages
    const baseRarityPercentage = {
        'S': 1,
        'A': 4,
        'B': 13,
        'C': 27,
        'D': 40
    };

    // Calculate the Distribution of rarities
    const rarityCount = {
        'S': 0,
        'A': 0,
        'B': 0,
        'C': 0,
        'D': 0
    };

    levelFilteredMonsters.forEach(monster => {
        rarityCount[monster.rarity]++;
    });

    const totalMonsters = levelFilteredMonsters.length;
    
    // Adjust base percentages based on the actual distribution
    Object.keys(rarityCount).forEach(rarity => {
        const adjustmentFactor = 0.5; // The higher this is, the more the actual distribution influences the rarity
        const availabilityPercentage = (rarityCount[rarity] / totalMonsters) * 100;
        baseRarityPercentage[rarity] += adjustmentFactor * (availabilityPercentage - baseRarityPercentage[rarity]);
    });

    // Determine rarity based on the adjusted percentages
    let raritySelected;
    const roll = Math.random() * 100;

    if (roll <= baseRarityPercentage.D) raritySelected = 'D';
    else if (roll <= baseRarityPercentage.C + baseRarityPercentage.D) raritySelected = 'C';
    else if (roll <= baseRarityPercentage.B + baseRarityPercentage.C + baseRarityPercentage.D) raritySelected = 'B';
    else if (roll <= baseRarityPercentage.A + baseRarityPercentage.B + baseRarityPercentage.C + baseRarityPercentage.D) raritySelected = 'A';
    else raritySelected = 'S'; 

    const monstersOfSelectedRarity = levelFilteredMonsters.filter(monster => monster.rarity === raritySelected);

    // Fallback: If for some reason there's no monster of the selected rarity, pick from the entire filtered list
    if (monstersOfSelectedRarity.length === 0) {
        return levelFilteredMonsters[Math.floor(Math.random() * totalMonsters)];
    }

    // 0.1% chance for a boss monster of the selected rarity
    const bossRoll = Math.random();
    if (bossRoll <= 0.001) {
        const bossMonsters = monstersOfSelectedRarity.filter(monster => monster.boss);
        if (bossMonsters.length > 0) {
            return bossMonsters[Math.floor(Math.random() * bossMonsters.length)];
        }
    }

    // Function to check if the selected monster is a boss and if we should use it
    function selectFinalMonster(candidateMonsters) {
        // Select a random monster
        const selectedMonster = candidateMonsters[Math.floor(Math.random() * candidateMonsters.length)];

        // If the selected monster is a boss
        if (selectedMonster.boss) {
            // Roll a number between 1 and 30
            const bossRoll = Math.floor(Math.random() * 100) + 1;

            // If the roll is 1, we return the boss
            if (bossRoll === 1) {
                return selectedMonster;
            }

            // Otherwise, we re-roll for another monster recursively
            return selectMonsterByRarity(monsters, userLevel);
        }

        // If the selected monster is not a boss, we just return it
        return selectedMonster;
    }

    // Use the function to get the final selected monster
    return selectFinalMonster(monstersOfSelectedRarity);
}


function determineHuntSuccess(monster, userLevel, luck) {
    const baseSuccessRates = {
        'S': 0.1,
        'A': 0.3,
        'B': 0.5,
        'C': 0.7,
        'D': 0.9
    };

    const levelDifference = userLevel - monster.levelRequirement;

    // This factor will increase/decrease the success rate by 7% for each level difference.
    // If the user's level is higher than the monster's required level, it increases the chance.
    // If it's lower, it decreases the chance.
    let balancer = (luck * (monster.levelRequirement - userLevel)) * 0.00001
    if(balancer < 0){
        balancer = 0
    } 
    const levelAdjustmentFactor = (0.07 * levelDifference) + (luck * 0.00175) + (balancer); 

    const adjustedSuccessRate = baseSuccessRates[monster.rarity] + levelAdjustmentFactor;

    // Ensure the success rate is between 0 and 1.
    const finalSuccessRate = Math.max(0.0001, Math.min(1, adjustedSuccessRate));
    const rand = Math.random();
    console.log(monster.name)
    console.log(finalSuccessRate)
    console.log(rand)
    return rand < finalSuccessRate;
}


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

    // Check if there's a line that meets the maxLength criterion
    const hasFullLengthLine = lines.some(line => 
        line.length === maxLength
    );
    
    
    if (!hasFullLengthLine) {
        console.log(`Running line check: `);
        for (let i = 0; i < lines.length; i++) {
            // If the line above exists
            if (i - 1 >= 0) {
                const diff = maxLength - lines[i - 1].length;
                if (diff > 2) {  // Check if we need to borrow from the current line
                    const borrow = lines[i].substring(0, diff - 2);
                    lines[i - 1] += " " + borrow + '-';
                    lines[i] = lines[i].substring(diff - 2);
                    break;
                }
            } 
            // If the line below exists
            else if (i + 1 < lines.length) {
                const diff = maxLength - lines[i].length;
                if (diff > 2 && lines[i + 1].length > diff) {  // Check if we can borrow from the next line
                    const borrow = lines[i + 1].substring(0, diff - 2);
                    lines[i] += " " + borrow + '-';
                    lines[i + 1] = lines[i + 1].substring(diff - 2);
                    break;
                }
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

