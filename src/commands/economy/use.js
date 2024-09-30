const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType, MessageActionRow, ReactionCollector} = require('discord.js');
const Usables = require('../../models/usable');
const Effect = require('../../models/effect');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Bank = require('../../models/bank');
const RecipeBook = require('../../models/recipeBook');
const Monsters = require('../../data/monster'); // assuming you have a separate file with all monsters and their data
const Equipment = require('../../models/equipment');
const Materials = require('../../models/material');
const Stocks = require('../../models/stock');
const Spell = require('../../models/spell');
const recipe = require('../../models/recipe');
const Title = require('../../models/title');


const axios = require('axios');
const sharp = require('sharp');

const {checkLevelUp} = require('../../utils/xpUtils');


module.exports = {
    name: 'use',
    description: 'Use an item from your inventory',
    options: [
        {
            name: 'item',
            type: ApplicationCommandOptionType.String,
            description: 'Name of the item you want to use',
            required: true
        }
    ],
    callback: async (client, interaction) => {
        try {
            

        let itemName = interaction.options.getString('item');

        if (itemName.toLowerCase() === "cht"){
            itemName = "consumable hunt token"
        }

        const user = await User.findOne({ userId: interaction.user.id });
        const targetUsable = await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId });
        const targetBook = await RecipeBook.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId }).populate('recipes');
        console.log(itemName)
        console.log(user.userId)
        const bank = await Bank.findOne({name: "Dauntless"})

        if(!bank){
            await interaction.deferReply();
            const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Developer Error')
                    .setDescription("Error with dauntless bank, please report to developer.")
                interaction.editReply({embeds: [embed]})
                return;
        }

        if (!(targetUsable || targetBook)) {
            await interaction.deferReply();
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You don't have any '${itemName}' in your inventory to use. Scam me one more time and watch`)
                        .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                    interaction.editReply({embeds: [embed]})
                    return;
        }

        if((targetUsable && !targetUsable.consumable)){
            await interaction.deferReply();
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Invalid Item`)
                        .setDescription(`'${itemName}' is not a consumable item.`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }

        const userInventory = await Inventory.findOne({ userId: user.userId });
        if (!userInventory) {
            await interaction.deferReply();
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;

        }

        if(targetBook){
            await interaction.deferReply();
            allRecipes = targetBook.recipes

            let page = 0;
            const itemsPerPage = 5;

            const generateEmbed = (start) => {
                const current = allRecipes.slice(start, start + itemsPerPage);
                const embed = new EmbedBuilder()
                    .setColor("Purple")
                    .setTitle(`Viewing: ${targetBook.name}`)
                    .setDescription(`${targetBook.description}`)
                    .setFooter({ text: `Page ${start / itemsPerPage + 1} of ${Math.ceil(allRecipes.length / itemsPerPage)}`} );

                if(allRecipes.length!==0){
                    current.forEach(async item => {
                        const result = item.resultingItem
                        const requiredItems = item.items.map(i => `${i.item} (x ${i.quantity})`).join('\n');
                        embed.addFields({name: result, value: `\`\`\`${requiredItems}\`\`\``});
                        
                    });
                }
                else{
                    embed.setDescription(`${targetBook.description}\n\n**No Recipes**`);
                }
                embed.addFields();
                return embed;
            }
            const marketMessage = await interaction.editReply({
                embeds: [generateEmbed(0)],
                fetchReply: true,
                ephemeral: true 
            });
            await marketMessage.react('⬅️');
            await marketMessage.react('➡️');
            const filter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;
            const collector = marketMessage.createReactionCollector({ filter, time: 100000 });
            collector.on('collect', async (reaction) => {
                reaction.users.remove(interaction.user.id);
                if (reaction.emoji.name === '➡️') {
                    if (page < allRecipes.length - itemsPerPage) page += itemsPerPage;
                } else if (reaction.emoji.name === '⬅️') {
                    if (page > 0) page -= itemsPerPage;
                }
            
                interaction.editReply({ embeds: [generateEmbed(page)], ephemeral: true });
            });            
        }
        else{
            // Delete the usable or reduce its quantity
            if (targetUsable.quantity === 1) {
                userInventory.usables.remove(targetUsable._id)
                await Usables.findByIdAndRemove(targetUsable._id);
            } else {
                targetUsable.quantity -= 1;
                await targetUsable.save();
            }

            await userInventory.save();

            if(itemName.toLowerCase() === "lottery ticket"){
                await interaction.deferReply();
                const timeSinceLastLottery = new Date() - user.lastDaily;
    
                // If the user has already claimed their daily doros in the last 1 hours, inform them of their cooldown
                if (user.lastLottery && timeSinceLastLottery < 60 * 60 * 1000) {
                    const hoursLeft = Math.round((30 * 60 * 1000 - timeSinceLastLottery) / (60 * 1000));
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Halt: Gambling Restriction`)
                        .setDescription(`You've used a lottery ticket! Please wait ${hoursLeft} minute(s) to use again.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
    
                user.lastLottery = new Date();
    
                // Logic to determine the random amount of doros and add to the user's balance
                if (Math.random() < 0.0005) {
                    user.balance += bank.lottery;
                    bank.lottery = 50000;

                    //Title Assignment
                    let titleAssignment = "";
                    const newTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: null})
                    const newTitleGambler = await Title.findOne({name: "Gambling Addict", userId: null})

                    if (!newTitleMoneyBags || !newTitleGambler) {
                        const embed = new EmbedBuilder()
                                    .setColor('Red')
                                    .setTitle('Error: Existing Registering Title')
                                    .setDescription("An error occured, please report to the developer.")
                                interaction.editReply({embeds: [embed]})
                                return;
                    }

                    const equippedTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: user.userId})
                    const equippedGambler = await Title.findOne({name: "Gambling Addict", userId: user.userId})

                    if(!equippedGambler) {
                        const newItemData = {...newTitleGambler._doc};  // _doc gives you the properties of the mongoose document
                                            
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Gambling Addict\"*"
                    }

                    //Equips the moneybag title:
                    if(!equippedTitleMoneyBags && user.balance > 50000) {
                        const newItemData = {...newTitleMoneyBags._doc};  // _doc gives you the properties of the mongoose document
                                            
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\nGained the title: *\"Mr. MoneyBags\"*"
                    }

                    const embed = new EmbedBuilder()
                        .setColor('Gold')
                        .setTitle(`Incredible Feat: Lottery Winner`)
                        .setDescription(`**You just won the fucking lottery!!!!!!!!!** No need to ever work in your life again ~ \n\n(Gained ${bank.lottery} Doros)${titleAssignment}`)
                    interaction.editReply({embeds: [embed]})
                    
                }
                else{
                    const embed = new EmbedBuilder()
                        .setColor('DarkGold')
                        .setTitle(`Partial Success: Almost Made It!`)
                        .setDescription(`You didn't win, but you were so close. I'm sure you will if you try one more time!!`)
                    interaction.editReply({embeds: [embed]})
                }
                
                // Save the updated user data
                await bank.save();
                await user.save();     
            }
            else if(itemName.toLowerCase() === "consumable hunt token"){
                await interaction.deferReply();
                user.huntTokens+= 1;
                await user.save();   
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 ${itemName}`)
                .setDescription(`Gained an additional Hunt token. Warning: excess hunt tokens will be reset after the 30 minute time interval.`)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "consumable hunt card"){
                await interaction.deferReply();
                user.huntAttempts-= 1;
                await user.save();   
                if(user.huntAttempts < 0){
                    const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle(`Partial Success: Used x 1 ${itemName}`)
                    .setDescription(`Gained an additional Hunt Attempt. Failure: Due to already having 0 attempted hunts, nothing was changed.`)
                    return interaction.editReply({embeds: [embed]})
                }
                else{
                    const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle(`Success: Used x 1 ${itemName}`)
                    .setDescription(`Gained an additional Hunt Attempt. Warning: Cannot have negative hunt attempts, be careful.`)
                    return interaction.editReply({embeds: [embed]})
                }
                
            }
            else if(itemName.toLowerCase() === "pill of eternity tier 1"){
                await interaction.deferReply();
                user.hp += 5;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Eternity Tier 1`)
                .setDescription(`Succesfully cultivated your max health to \`+ 5\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of eternity tier 2"){
                await interaction.deferReply();
                user.hp += 20;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Eternity Tier 2`)
                .setDescription(`Succesfully cultivated your max health to \`+ 20\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of eternity tier 3"){
                await interaction.deferReply();
                user.hp += 50;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Eternity Tier 3`)
                .setDescription(`Succesfully cultivated your max health to \`+ 50\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of tempering tier 1"){
                await interaction.deferReply();
                user.stamina += 5;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Tempring Tier 1`)
                .setDescription(`Succesfully cultivated your max stamina to \`+ 5\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of tempering tier 2"){
                await interaction.deferReply();
                user.stamina += 20;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Tempring Tier 2`)
                .setDescription(`Succesfully cultivated your max stamina to \`+ 20\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of tempering tier 3"){
                await interaction.deferReply();
                user.stamina += 50;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Tempring Tier 3`)
                .setDescription(`Succesfully cultivated your max stamina to \`+ 50\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of awakening tier 1"){
                await interaction.deferReply();
                user.combat += 5;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Tempring Tier 1`)
                .setDescription(`Succesfully cultivated your max combat to \`+ 5\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of awakening tier 2"){
                await interaction.deferReply();
                user.combat += 20;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Tempring Tier 2`)
                .setDescription(`Succesfully cultivated your max combat to \`+ 20\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "pill of awakening tier 3"){
                await interaction.deferReply();
                user.combat += 50;
                await user.save();
                const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle(`Success: Used x 1 Pill of Tempring Tier 3`)
                .setDescription(`Succesfully cultivated your max combat to \`+ 50\``)
                return interaction.editReply({embeds: [embed]})
            }
            else if(itemName.toLowerCase() === "kobold lord's sigil" || itemName.toLowerCase() === "infernal east compass" || itemName.toLowerCase() === "ember eye" || itemName.toLowerCase() === "singularity stone" || itemName.toLowerCase() === "sigil of eternity"){
                let monsterName = ""
                const monsters = await Monsters.find({}); 

                if(itemName.toLowerCase() === "kobold lord's sigil") monsterName = "<Illfang>, Kobold Lord"
                if(itemName.toLowerCase() === "infernal east compass") monsterName = "<Agares>, Sovereign of East Hell"
                if(itemName.toLowerCase() === "ember eye") monsterName = "<Asmodeus>, Devil of Lust and Wrath"
                if(itemName.toLowerCase() === "singularity stone") monsterName = "<Sol>, Monarch of the Great Void"
                if(itemName.toLowerCase() === "sigil of eternity") monsterName = "<???>, The Oldest Dream"

                const monster = await Monsters.findOne({name: monsterName});
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
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Unable to summon Boss')
                        .setDescription("Unable to summon Boss, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;
                }
            }
            else{
                await interaction.deferReply();
                const effectData = await Effect.findById(targetUsable.effect)
                
                if(!effectData){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Invalid Effect`)
                        .setDescription(`Although you're item has already been used, the effect associated with the item is invalid. Contact the developer to report this bug.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                const effectExistance = await Effect.findOne({userId: user.userId, name: effectData.name})
                if(effectExistance){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Existing Effect`)
                        .setDescription(`This specific item effect is already ongoing, please wait for it to end.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
                const newItemData = {...effectData._doc};  // _doc gives you the properties of the mongoose document

                newItemData.userId = user.userId;
                newItemData.timeUsed = new Date();
                delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                const effect = new Effect(newItemData);
                await effect.save();

                let previousStats = 0

                if(effect.relativeAttribute && effect.relativeValue){
                    previousStats = user[effect.relativeAttribute];
                    if(effect.effectedType === "Addition"){
                        user[effect.relativeAttribute] += effect.relativeValue;
                    }
                    else if(effect.effectedType === "Subtraction"){
                        user[effect.relativeAttribute] -= effect.relativeValue;
                    }
                    else if(effect.effectedType === "Buff"){
                        user[effect.relativeAttribute] *= effect.relativeValue/100;
                    }
                    if(user[effect.relativeAttribute] < 0){
                        previousStats = user[effect.relativeAttribute] + effect.relativeValue
                        user[effect.relativeAttribute] = 0;
                    }
                    else{
                        previousStats = effect.relativeValue;
                    }
                    await user.save();
                }

                // Set a timer to delete the effect after its duration
                setTimeout(async () => {
                    if(effect.relativeAttribute && effect.relativeValue){
                        if(effect.effectedType === "Addition"){
                            user[effect.relativeAttribute] -= previousStats;
                        }
                        else if(effect.effectedType === "Subtraction"){
                            user[effect.relativeAttribute] += previousStats;
                        }
                        else if(effect.effectedType === "Buff"){
                            user[effect.relativeAttribute] /= previousStats/100;
                        }
                        await user.save();
                    }
                    await Effect.findByIdAndRemove(effect._id);
                    const embed = new EmbedBuilder()
                        .setColor('Grey')
                        .setTitle(`End: ${itemName}'s effect has ended`)
                        .setDescription(`It has been ${effect.useTime} minute(s), the effect has ended.`)
                    interaction.followUp({embeds: [embed]})
                }, effect.useTime * 60 * 1000); // Convert minutes to milliseconds

                const embed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle(`Success: Used x 1 ${itemName}`)
                        .setDescription(`You have used ${itemName}. Its effect will last for ${effect.useTime} minutes..`)
                    interaction.editReply({embeds: [embed]})
            }
        }
        } catch (error) {
            console.log(`Error with /use: ${error}`);
      const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Use could not be accessed`)
                        .setDescription(`/Use could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }

        
    }
};

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
