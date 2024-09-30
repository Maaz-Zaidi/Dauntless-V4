const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const Equipment = require('../../models/equipment');
const Usables = require('../../models/usable');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Material = require('../../models/material');
const Stocks = require('../../models/stock');
const RecipeBooks = require('../../models/recipeBook');
const Bank = require('../../models/bank');
const Spell = require('../../models/spell');

module.exports = {
    name: 'attunement',
    description: 'Attune spells into 4 slots to prepare for duels or hunting bosses',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Incantation attunement interaction you want to perform',
            choices: [
                { name: 'View Attuned Incantations', value: 'view' },
                { name: 'Attune Incantation', value: 'equip' },
                { name: 'Remove Attunement', value: 'unequip' }
            ],
            required: true,
        },
        {
            name: 'incantation',
            type: ApplicationCommandOptionType.String,
            description: 'Name of the incantation you want to attune/remove',
            required: false  // It's not required for the 'view' action
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

            const action = interaction.options.getString('action');

            if(!action){
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid Action')
                    .setDescription("Please select a valid option to perform")
                interaction.editReply({embeds: [embed]})
                return;
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

            if (action === 'view') {
                const equipmentFields = [];
                
               // Fetch all equipment details using their ObjectIds
                const slot1 = user.spellSlot1 ? await Spell.findById(user.spellSlot1) : null;
                const slot2 = user.spellSlot2 ? await Spell.findById(user.spellSlot2) : null;
                const slot3 = user.spellSlot3 ? await Spell.findById(user.spellSlot3) : null;
                const slot4 = user.spellSlot4 ? await Spell.findById(user.spellSlot4) : null;

                let ringView= "";

                // Check if each item exists and add to equipmentFields
                
                (slot1) ? ringView += `\`\`\`(1) ${slot1.name} [${slot1.rank} Rank]\`\`\`` : ringView += `\`\`\`(1) [None]\`\`\``; 
                (slot2) ? ringView += `\`\`\`(2) ${slot2.name} [${slot2.rank} Rank]\`\`\`` : ringView += `\`\`\`(2) [None]\`\`\``;
                (slot3) ? ringView += `\`\`\`(3) ${slot3.name} [${slot3.rank} Rank]\`\`\`` : ringView += `\`\`\`(3) [None]\`\`\``;
                (slot4) ? ringView += `\`\`\`(4) ${slot4.name} [${slot4.rank} Rank]\`\`\`` : ringView += `\`\`\`(4) [None]\`\`\``;
                
                const embed = new EmbedBuilder()
                    .setColor("Purple")
                    .setTitle(`${interaction.user.username}'s Attunements`)
                    .setDescription("You can equip and unequip up to four incantations using /incationations `attune` `[spell name]` and /incationations `unattune` `[spell name]`. Use /wiki `[attunement]` to learn more.")
                    .addFields({name: "Incantation: ", value: ringView})

                return interaction.editReply({ embeds: [embed] });
            }
            else if (action === 'unequip') {
                 const itemName = interaction.options.getString('incantation'); // Assuming you have the option in the command setup
                 if(!itemName){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Incantation')
                            .setDescription("Input a valid incantation in order to attempt to remove.")
                        interaction.editReply({embeds: [embed]})
                        return;
                 }
                 const spell = await Spell.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } });

                 if (!spell) {
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Incantation')
                            .setDescription(`Incantation '${itemName}' does not exist within Dauntless`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }
                const slot1 = user.spellSlot1 ? await Spell.findById(user.spellSlot1) : null;
                const slot2 = user.spellSlot2 ? await Spell.findById(user.spellSlot2) : null;
                const slot3 = user.spellSlot3 ? await Spell.findById(user.spellSlot3) : null;
                const slot4 = user.spellSlot4 ? await Spell.findById(user.spellSlot4) : null;

                if(slot1 && slot1.name === spell.name){
                    
                    if (slot2) {user.spellSlot1 = user.spellSlot2;} else{user.spellSlot1 =null;} 
                    if (slot3) {user.spellSlot2 = user.spellSlot3;} else{user.spellSlot2 =null;} 
                    if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                    user.spellSlot4 = null;
                     
                } else if(slot2 && slot2.name === spell.name){

                    if (slot3) {user.spellSlot2 = user.spellSlot3;} else{user.spellSlot2 =null;} 
                    if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                    user.spellSlot4 = null;

                } else if(slot3 && slot3.name === spell.name){

                    if (slot4) {user.spellSlot3 = user.spellSlot4;} else{user.spellSlot3 =null;}
                    user.spellSlot4 = null;

                } else if(slot4 && slot4.name === spell.name){

                    user.spellSlot4 = null;
                } 
                else{
                    const embed = new EmbedBuilder()
                    .setColor("Green")
                     .setTitle(`Error: Invalid Attunement`)
                     .setDescription(`You do not have this attuned to unattune..`);
                    interaction.editReply({embeds: [embed]});       
                    return
                }

                 await user.save();
             
                 const embed = new EmbedBuilder()
                    .setColor("Green")
                     .setTitle(`Attunement Update`)
                     .setDescription(`You've successfully unattuned ${itemName}.`);
                 interaction.editReply({embeds: [embed]});             
            }
            else if (action === 'equip') {
                const itemName = interaction.options.getString('incantation'); // Assuming you have the option in the command setup
                if(!itemName){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Incantation')
                            .setDescription("Input a valid incantation in order to attempt to attune.")
                        interaction.editReply({embeds: [embed]})
                        return;
                 }
                // Fetch user's inventory
                const userInventory = await Inventory.findOne({ userId: user.userId });
                if (!userInventory) {
                   const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                // Find the item in the inventory 
                const targetSpell = await Spell.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } });

                if(!targetSpell){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Incantation')
                            .setDescription(`Incantation '${itemName}' does not exist within Dauntless`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                // Check if item is in the user's inventory
                if (!userInventory.spells.includes(targetSpell._id)) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You don't have any '${itemName}' in your inventory to attune. Scam me one more time and watch`)
                        .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                // Check if the item's slot is available in the user's equipment slots
                // (e.g., if the item is a ring, check if a ring slot is available)

                const slot1 = user.spellSlot1 ? await Spell.findById(user.spellSlot1) : null;
                const slot2 = user.spellSlot2 ? await Spell.findById(user.spellSlot2) : null;
                const slot3 = user.spellSlot3 ? await Spell.findById(user.spellSlot3) : null;
                const slot4 = user.spellSlot4 ? await Spell.findById(user.spellSlot4) : null;

                if (slot1 && slot2 && slot3 && slot4) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You don't have any available free slots to attune the incatation '${itemName}'. Try removing an attuned spell.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                if(!slot1){
                    user.spellSlot1 = targetSpell._id;
                }
                else if(!slot2){
                    user.spellSlot2 = targetSpell._id;
                }
                else if(!slot3){
                    user.spellSlot3 = targetSpell._id;
                }
                else if(!slot4){
                    user.spellSlot4 = targetSpell._id;
                }

                await user.save();

                await userInventory.save()
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle(`Attunement Update`)
                    .setDescription(`You've successfully attuned the incantation: ${itemName}.`);
                interaction.editReply({embeds: [embed]});

            }
            else{
                console.log("invalid command addition");
            }
    

        } catch (error) {
            console.log(`Error in /attunements view: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Attunements could not be accessed`)
                        .setDescription(`Attunements could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
            interaction.editReply('There was an error accessing the equipment. Please try again.');
        }
    }
};
