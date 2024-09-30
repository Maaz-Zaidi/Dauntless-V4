const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/user');
const { checkLevelUp } = require('../../utils/xpUtils');
const Effect = require('../../models/effect');
const Title = require('../../models/title');
const Usables = require('../../models/usable');
const Inventory = require('../../models/inventory');
const Bank = require('../../models/bank');


const SYMBOLS = ['cherry', 'bar', 'seven', 'apple', 'grape', 'orange', 'boom'];

const SYMBOLS_EMOJI_MAP = {
    cherry: ':cherries:',
    bar: ':chocolate_bar:',
    seven: ':seven:',
    apple: ':apple:',
    grape: ':grapes:',
    orange: ':tangerine:',
    boom: ':boom:'
};

const rollSlots = () => [
    [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
    [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]],
    [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]
];

const getMultiplier = (results) => {
    for (const line of results) {
        if (line.every(symbol => symbol === 'cherry')) return 5;
        if (line.every(symbol => symbol === 'seven')) return 10;
        if (line.every(symbol => symbol === 'apple' || symbol === 'grape' || symbol === 'cherry' || symbol === 'orange')) return 1;
        if (line.every(symbol => symbol === line[0])) return 3;
    }
    return 0;
}

const checkBooms = (results) => {
    let boomCount = 0;
    for (const line of results) {
        for (const symbol of line) {
            if (symbol === 'boom') {
                boomCount++;
            }
        }
        if(boomCount === 3){
            return true
        }
        else{
            boomCount = 0;
        }
    }
    return boomCount >= 3;
};


module.exports = {
    name: 'slots',
    description: 'Roll the slots. If all symbols match a pattern, multiply your bet.',
    options: [
        {
            name: 'bet',
            type: ApplicationCommandOptionType.Integer,
            description: 'The amount you want to bet to be tripled (1 by default)',
            required: false
        },
    ],
    /**
    *
    * @param {Client} client
    * @param {Interaction} interaction
    */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const user = await User.findOne({ userId: interaction.user.id });

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("You must register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]});
                return;
            }

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

            const energyEffect = await Effect.findOne({userId: interaction.user.id, effectedType: "Gambling"})
            const lastSlotTime = user.lastSlot;
            const currentTime = new Date();

            // Calculate the difference in milliseconds
            const timeDifference = currentTime - lastSlotTime;

            // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
            const fiveMinutesInMilliseconds = 1 * 60 * 1000;

            if (!energyEffect && user.lastSlot && timeDifference < fiveMinutesInMilliseconds) {
                const timeLeft = Math.round((fiveMinutesInMilliseconds - timeDifference) / 60000); // Convert the difference to minutes
                const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`Halt: Time Restriction`)
                                .setDescription(`You need to wait \`${timeLeft} minute(s)\` before you can play slots again.`)
                            interaction.editReply({embeds: [embed]})
                            return;
            }

            user.lastSlot = new Date();

            const betAmount = interaction.options.getInteger('bet') || 1;

            if (user.balance < betAmount) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Know your worth')
                        .setDescription("You don't have this much to bet.")
                    interaction.editReply({embeds: [embed]});
                    return;
            }

            if (1 > betAmount) {
                const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Betting Amount')
                        .setDescription("Don't try to scam me bitch.")
                    interaction.editReply({embeds: [embed]});
                    return;
            }


            const rollResults = rollSlots();
            const rollResultsEmojis = rollResults.map(line => line.map(symbol => SYMBOLS_EMOJI_MAP[symbol]));
            const multiplier = getMultiplier(rollResults);

            let winnings = betAmount * multiplier;

            if (checkBooms(rollResults)) {
                winnings = -2 * betAmount; // User loses double their bet amount
            }

            user.balance += winnings;

            if (winnings < 0) { // Adjusted the condition to only add XP when the user wins
                let adjustmentStatement = ""
                if(user.balance < betAmount * 2){
                    user.balance = 0;
                    adjustmentStatement = `\nDid not have enough so emptied your bank~`
                }
                else{
                    user.balance -= betAmount * 2;
                }
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Failure: Ouch...')
                    .setDescription(`The slots rolled:\n\n${rollResultsEmojis.map(line => "[ㅤ " + line.join(' ㅤ|ㅤ ') + " ㅤ]").join('\n\n')}\n\nLanded on the **BOOM** (double penalty)\nYou've lost \`${betAmount} doros\`${adjustmentStatement}`);
                interaction.editReply({embeds: [embed]});
            }
            else if (multiplier > 0) {
                
                let taxStatement = ""
                if(winnings >= 500){
                    let itemName = "Tax Evasion";
                    const targetItem = await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true });
                        
                    if (!targetItem) {
                        interaction.editReply(`Item: ${itemName} does not exist in the database`);
                        return;
                    }
                    let tax = Math.floor((winnings) * 0.20)

                    const existingItem = await Usables.findOne({ name: targetItem.name, userId: user.userId });
                    if (existingItem) {
                        user.balance += winnings;
                        taxStatement = "\n\nYou also successfully evaded Dauntless Tax! Good job.";
                    } else {
                        user.balance += winnings - tax;
                        bank.balance += tax
                        await bank.save();
                        taxStatement = `\n\nDauntless will charge a rounded 20% tax on these winnings (${tax} Doros)\nReason: Winnings over 500.`
                    }
                }
                else{
                    user.balance += winnings;
                }
                
                const xpgiven = Math.floor(Math.random() * Math.ceil(betAmount / 3)) + 1;

                user.luckXp += xpgiven;
                const result = checkLevelUp(user.luckXp, user.luckLevel , user.luckBonus);
                user.luckXp = result.xp;
                user.luckLevel = result.level;

                //Title Assignment
                let titleAssignment = "";
                const newTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: null})

                if (!newTitleMoneyBags) {
                    const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Existing Registering Title')
                                .setDescription("An error occured, please report to the developer.")
                            interaction.editReply({embeds: [embed]})
                            return;
                }

                const equippedTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: user.userId})

                //Equips the moneybag title:
                if(!equippedTitleMoneyBags && user.balance > 50000) {
                    const userInventory = await Inventory.findOne({ userId: user.userId });
                        
                    if (!userInventory) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;

                    }
                    const newItemData = {...newTitleMoneyBags._doc};  // _doc gives you the properties of the mongoose document
                                        
                    newItemData.userId = user.userId;
                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                    const newItem = new Title(newItemData);
                    await newItem.save();
                    userInventory.titles.push(newItem._id)
                    await userInventory.save()

                    titleAssignment += "\n\nGained the title: *\"Mr. MoneyBags\"*"
                }

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Success: You Won!')
                    .setDescription(`The slots rolled:\n\n${rollResultsEmojis.map(line => "[ ㅤ" + line.join('ㅤ |ㅤ ') + " ㅤ]").join('\n\n')}\n\nYou won \`${winnings} doros\`\nGained \`${xpgiven} Luck XP\`${taxStatement}${titleAssignment}`);
                interaction.editReply({embeds: [embed]});
            } else {
                user.balance -= betAmount;
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Failure: Almost There!')
                    .setDescription(`The slots rolled:\n\n${rollResultsEmojis.map(line => "[ㅤ " + line.join(' ㅤ|ㅤ ') + " ㅤ]").join('\n\n')}\n\nYou've lost \`${betAmount} doros\``);
                interaction.editReply({embeds: [embed]});
            }



            // Save the updated user data
            await user.save();
                
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error: /Slots could not be accessed')
                .setDescription(`/Slots could not be accessed, please report to the developer`)
            interaction.editReply({embeds: [embed]});
            return;
        }
    }
};