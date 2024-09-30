const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Material = require('../../models/material');
const Usable = require('../../models/usable');
const Bank = require('../../models/bank');
const Effect = require('../../models/effect');
const Title = require('../../models/title');
const {checkLevelUp} = require('../../utils/xpUtils');
const StealHistory = require('../../models/stealHistory');

module.exports = {
    name: 'steal',
    description: 'Attempt to steal from another user',
    options: [
        {
            name: 'target',
            type: ApplicationCommandOptionType.User,
            description: 'User you want to steal from',
            required: true
        },
        {
            name: 'amount',
            type: ApplicationCommandOptionType.Integer,
            description: 'Amount you want to steal',
            required: true
        }
    ],
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();
            
            const targetId = interaction.options.getUser('target');
            const stolenAmount = interaction.options.getInteger('amount');
            
            // Fetching the thief and target data from the database.
            const thief = await User.findOne({ userId: interaction.user.id });
            const target = await User.findOne({ userId: targetId.id });
            
            if (!thief) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Register with the Dauntless Bank (/register) attempting a theft.")
                interaction.editReply({embeds: [embed]})
                return;
            }
            
            if (!target) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("The target user does not exist/ or is not registered.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            const stealHistory = await StealHistory.findOne({ userId: interaction.user.id });

            if(!stealHistory){
                const newHistory = new StealHistory({
                    userId: interaction.user.id,
                });
                await newHistory.save();

                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Unregistered Thief')
                    .setDescription("You were not registered in the thieves guild, registering you now. Try using this command again.")
                interaction.editReply({embeds: [embed]})
                return;
            }
            
            if(interaction.user.id === targetId.id){
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid IQ')
                        .setDescription("I don't know what you're trying to do but you cannot steal from yourself-")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
            }

            if (stolenAmount > target.balance){
                const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Know their worth')
                            .setDescription(`The target does not have enough doros to steal the amount you inputted.`)
                            .setThumbnail('https://preview.redd.it/the-faces-of-lloyd-from-the-greatest-estate-developer-20-v0-p4nxmzcpsce91.png?width=458&format=png&auto=webp&s=4995657365a3d6b82059959b2325afdb881f9f73')
                        interaction.editReply({embeds: [embed]})
                        return;
            }
            
            if(stolenAmount < 1){
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription("Unable to steal less such a miniscule amount, don't play with me bitch.")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;

            }

            const energyEffect = await Effect.findOne({userId: interaction.user.id, effectedType: "Steal"})
            const lastStealTime = thief.lastSteal;
            const currentTime = new Date();

            // Calculate the difference in milliseconds
            const timeDifference = currentTime - lastStealTime;

            // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
            const fiveMinutesInMilliseconds = 5 * 60 * 1000;
            

            if (!energyEffect && thief.lastSteal && timeDifference < fiveMinutesInMilliseconds) {
                const timeLeft = Math.round((fiveMinutesInMilliseconds - timeDifference) / 60000); // Convert the difference to minutes
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Halt: Wanted Status Restriction`)
                        .setDescription(`You just commited a theft. The Dauntless Police is now alert of you. Stay low for atleast \`${timeLeft} minute(s)\` before perform a heist on trying to steal from ${targetId} again.`)
                    interaction.editReply({embeds: [embed]})
                    return;
              }
        
            thief.lastSteal = new Date();

            const thiefInventory = await Inventory.findOne({ userId: thief.userId });
            const ropeItem = await Material.findOne({ name: "Rope", userId: thief.userId });
            const securityModule = await Usable.findOne({name: "Bank Security Module", userId: target.userId})

            let balancer = thief.balance;
            if(target.balance < thief.balance) balancer = target.balance;
            
            let successRate = 100 - ((stolenAmount/balancer) * 90);
            if(successRate > 50){
                successRate = 50;
            }
            let additionalStatements = "";

            if (ropeItem && ropeItem.quantity > 1) {
                successRate += 5;  // Rope adds a 5% success rate.
                ropeItem.quantity -= 1;  // Remove one rope from the thief's inventory.
                await ropeItem.save();
                additionalStatements = "`You consumed x 1 Rope.`\n\n"
            }
            else if (ropeItem){
                successRate += 5;
                thiefInventory.materials.remove(ropeItem._id);
                await Material.findByIdAndRemove(ropeItem._id);
                await thiefInventory.save();
            }

            // Calculate dexterity-based increase with a cap of 10
            let dexterityIncrease = (thief.dexterityLevel + thief.dexterityBonus - target.defenseBonus - target.defenseLevel) * 0.5;
            dexterityIncrease = Math.min(dexterityIncrease, 7); // Cap at +7

            // Calculate luck-based increase with a cap of 10
            let luckIncrease = (thief.luckLevel + thief.luckBonus - target.luckLevel - target.luckBonus) * 0.3;
            luckIncrease = Math.min(luckIncrease, 7); // Cap at +7

            // Add capped values to the success rate
            successRate += dexterityIncrease;
            successRate += luckIncrease;
                        
            
            if(securityModule){
                successRate -= securityModule.quantity;
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`Security Module`)
                    .setDescription(`A Level ${securityModule.quantity} Security Module has been triggered, hindering your heist`)
                interaction.editReply({embeds: [embed]});
            }

            if(successRate > 85){
                successRate = 85;
            }

            if(successRate < 2){
                additionalStatements += "With an impossible desparity in odds (< 1%), "
            }
            else if(successRate < 5){
                additionalStatements += "With an overwhelming desparity in odds (< 5%), "
            }
            else if(successRate < 10){
                additionalStatements += "With an overwhelming desparity in odds (<10%), "
            }
            else if(successRate < 20){
                additionalStatements += "With a large desparity in odds (<20%), "
            }
            else if(successRate < 30){
                additionalStatements += `With the odds not being in ${interaction.user.displayName}'s favour (<30%), `
            }
            else if(successRate < 40){
                additionalStatements += `With the odds not being in ${interaction.user.displayName}'s favour (<40%), `
            }
            else if(successRate < 50){
                additionalStatements += `With an even chance at succeeding (<50%), `
            }
            else if(successRate < 60){
                additionalStatements += `With an even chance at succeeding (<60%), `
            }
            else if(successRate < 70){
                additionalStatements += `With the odds in ${interaction.user.displayName}'s favour (<70%), `
            }
            else if(successRate < 80){
                additionalStatements += `With the odds, highly in ${interaction.user.displayName}'s  favour (<80%), `
            }
            else if(successRate < 90){
                additionalStatements += `With the odds, overwhelming in ${interaction.user.displayName}'s  favour (<90%), `
            }

            const randomNumber = Math.random() * 100;  // Random number between 0 and 100.
            let neutral = successRate*2;
            
            if (successRate > 35){
                neutral = successRate + 15
            }
            if (successRate > 50){
                neutral = successRate + 5;
            }
            
            console.log(randomNumber)
            console.log(successRate)
            if (randomNumber <= successRate) {
                // Here you can implement the logic for a successful theft. 
                // For instance, transferring some balance from the target to the thief.
                target.balance -= stolenAmount;
                thief.balance += stolenAmount;

                const xpgiven = Math.floor(Math.random() * Math.ceil(stolenAmount / 5)) + 1;

                thief.dexterityXp += xpgiven;
                const result = checkLevelUp(thief.dexterityXp, thief.dexterityLevel , thief.dexterityBonus);
                thief.dexterityXp = result.xp;
                thief.dexterityLevel = result.level;

                //Title Assignment
                let titleAssignment = "";
                const newTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: null})
                const newTitleFox = await Title.findOne({name: "Fox Cultist", userId: null})

                if (!newTitleMoneyBags || !newTitleFox) {
                    const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Existing Registering Title')
                                .setDescription("An error occured, please report to the developer.")
                            interaction.editReply({embeds: [embed]})
                            return;
                }

                const equippedTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: thief.userId})
                const equippedTitleFox = await Title.findOne({name: "Fox Cultist", userId: thief.userId})

                //Equips the moneybag title:
                if(!equippedTitleMoneyBags && thief.balance > 50000) {
                    const userInventory = await Inventory.findOne({ userId: thief.userId });
                        
                    if (!userInventory) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;

                    }
                    const newItemData = {...newTitleMoneyBags._doc};  // _doc gives you the properties of the mongoose document
                                        
                    newItemData.userId = thief.userId;
                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                    const newItem = new Title(newItemData);
                    await newItem.save();
                    userInventory.titles.push(newItem._id)
                    await userInventory.save()

                    titleAssignment += "\n\nGained the title: *\"Mr. MoneyBags\"*"
                }

                if(!equippedTitleFox && successRate < 5) {
                    const userInventory = await Inventory.findOne({ userId: thief.userId });
                        
                    if (!userInventory) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;

                    }
                    const newItemData = {...newTitleFox._doc};  // _doc gives you the properties of the mongoose document
                                        
                    newItemData.userId = thief.userId;
                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                    const newItem = new Title(newItemData);
                    await newItem.save();
                    userInventory.titles.push(newItem._id)
                    await userInventory.save()

                    titleAssignment += "\n\nGained the title: *\"Fox Cultist\"*"
                }

                await target.save();
                await thief.save();

                const history = {userId: target.userId, heistNetGain: stolenAmount, heistDate: new Date(), result: true, probability: successRate}
                stealHistory.totalGain += stolenAmount;
                stealHistory.history.push(history)

                await stealHistory.save();

                if( securityModule){
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Successfull Heist`)
                        .setDescription(`${additionalStatements}You successfully stole \`${stolenAmount} Doros\` from ${targetId} and gained \`${xpgiven} XP\` towards Dexterity. That broke ass didn't see it coming.${titleAssignment}`)
                    interaction.followUp({embeds: [embed]});
                }
                else{
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Successfull Heist`)
                        .setDescription(`${additionalStatements}You successfully stole \`${stolenAmount} Doros\` from ${targetId} and gained \`${xpgiven} XP\` towards Dexterity. That broke ass didn't see it coming.${titleAssignment}`)
                    interaction.editReply({embeds: [embed]});
                }
            } 
            else if (randomNumber <= neutral){
                const history = {userId: target.userId, heistNetGain: 0, heistDate: new Date(), result: false, probability: successRate}
                stealHistory.history.push(history)

                await stealHistory.save();

                if( securityModule){
                    const embed = new EmbedBuilder()
                        .setColor("Orange")
                        .setTitle(`Partial Failure`)
                        .setDescription(`You were unable to steal anything from ${targetId}, but escaped in the nick of time from the grasps of the dauntless police.`)
                    interaction.followUp({embeds: [embed]});
                }
                else{
                    const embed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle(`Partial Failure`)
                    .setDescription(`You were unable to steal anything from ${targetId}, but escaped in the nick of time from the grasps of the dauntless police.`)
                    interaction.editReply({embeds: [embed]});
                }
            }
            else {
                const history = {userId: target.userId, heistNetGain: -stolenAmount, heistDate: new Date(), result: false, probability: successRate}
                stealHistory.totalLoss += stolenAmount;
                stealHistory.history.push(history)

                await stealHistory.save();
                
                let stealStatement = "";
                if(stolenAmount >= thief.balance){
                    thief.balance = 0
                    stealStatement = "Since you did'nt have that much money, they suspend your account instead leaving you 0 doros. "
                }
                else{
                    thief.balance -= stolenAmount;
                }

                await thief.save();
                if( securityModule){
                    const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`Heist Failure`)
                        .setDescription(`${additionalStatements}You were caught by the dauntless police who charged you ${stolenAmount} Doros for trying to steal from ${targetId}. ${stealStatement}`)
                    interaction.followUp({embeds: [embed]});
                }
                else{
                    const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle(`Heist Failure`)
                    .setDescription(`${additionalStatements}You were caught by the dauntless police who charged you ${stolenAmount} Doros for trying to steal from ${targetId}. ${stealStatement}`)
                    interaction.editReply({embeds: [embed]});
                }
            }

        } catch (error) {
            console.error("Error with the steal command:", error);
            return interaction.editReply('An error occurred while processing your heisht attempt. Please try again.');
        }
    }
}
