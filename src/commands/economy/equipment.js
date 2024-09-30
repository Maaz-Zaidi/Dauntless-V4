const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const Equipment = require('../../models/equipment');
const Usables = require('../../models/usable');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Material = require('../../models/material');
const Stocks = require('../../models/stock');
const RecipeBooks = require('../../models/recipeBook');
const Bank = require('../../models/bank');
const Title = require('../../models/title');
const { checkLevelRequired } = require('../../utils/levelUtils');

module.exports = {
    name: 'equipment',
    description: 'Access your current setup to view, equip or unequip items',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Equipment action you want to perform',
            choices: [
                { name: 'View Setup', value: 'view' },
                { name: 'Equip Items', value: 'equip' },
                { name: 'Unequip Items', value: 'unequip' }
            ],
            required: true,
        },
        {
            name: 'item',
            type: ApplicationCommandOptionType.String,
            description: 'Name of the item you want to equip/unequip',
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
                const title = user.title ? await Title.findById(user.title) : null;

                const ring1Details = user.ring1 ? await Equipment.findById(user.ring1) : null;
                const ring2Details = user.ring2 ? await Equipment.findById(user.ring2) : null;
                const ring3Details = user.ring3 ? await Equipment.findById(user.ring3) : null;
                const ring4Details = user.ring4 ? await Equipment.findById(user.ring4) : null;
                const ring5Details = user.ring5 ? await Equipment.findById(user.ring5) : null;
                
                const weaponDetails = user.weapon ? await Equipment.findById(user.weapon) : null;
                const chestDetails = user.chest ? await Equipment.findById(user.chest) : null;
                const headDetails = user.head ? await Equipment.findById(user.head) : null;
                const armsDetails = user.arms ? await Equipment.findById(user.arms) : null;
                const legsDetails = user.legs ? await Equipment.findById(user.legs) : null;

                let ringView = "";
                let itemView= "";
                let titleView = "";

                // Check if each item exists and add to equipmentFields

                (title) ? titleView += `\`\`\`"${title.name}"\`\`\`` : titleView += `\`\`\`(T) [None]\`\`\``; 
                
                (ring1Details) ? ringView += `\`\`\`(1) ${ring1Details.name} [${ring1Details.rank} Rank]\`\`\`` : ringView += `\`\`\`(1) [None]\`\`\``; 
                (ring2Details) ? ringView += `\`\`\`(2) ${ring2Details.name} [${ring2Details.rank} Rank]\`\`\`` : ringView += `\`\`\`(2) [None]\`\`\``;
                (ring3Details) ? ringView += `\`\`\`(3) ${ring3Details.name} [${ring3Details.rank} Rank]\`\`\`` : ringView += `\`\`\`(3) [None]\`\`\``;
                (ring4Details) ? ringView += `\`\`\`(4) ${ring4Details.name} [${ring4Details.rank} Rank]\`\`\`` : ringView += `\`\`\`(4) [None]\`\`\``;
                (ring5Details) ? ringView += `\`\`\`(5) ${ring5Details.name} [${ring5Details.rank} Rank]\`\`\`` : ringView += `\`\`\`(5) [None]\`\`\``;

                (weaponDetails) ? itemView += `\`\`\`(Weapon)   ${weaponDetails.name} [${weaponDetails.rank} Rank]\`\`\`` : itemView += `\`\`\`(Weapon)   [None]\`\`\``; 
                (chestDetails)  ? itemView += `\`\`\`(Chest)    ${chestDetails.name} [${chestDetails.rank} Rank]\`\`\`` : itemView += `\`\`\`(Chest)    [None]\`\`\``;
                (headDetails)   ? itemView += `\`\`\`(Helmet)   ${headDetails.name} [${headDetails.rank} Rank]\`\`\`` : itemView += `\`\`\`(Helmet)   [None]\`\`\``;
                (armsDetails)   ? itemView += `\`\`\`(Gauntlet) ${armsDetails.name} [${armsDetails.rank} Rank]\`\`\`` : itemView += `\`\`\`(Gauntlet) [None]\`\`\``;
                (legsDetails)   ? itemView += `\`\`\`(Legging)  ${legsDetails.name} [${legsDetails.rank} Rank]\`\`\`` : itemView += `\`\`\`(Legging)  [None]\`\`\``;

                const embed = new EmbedBuilder()
                    .setColor("Purple")
                    .setTitle(`${interaction.user.displayName}'s Equipment`)
                    .setDescription("You can equip and unequip items using /equipment `equip` `[equipment name]` and /equipment `unequip` `[equipment name]`. Use /wiki `[equipment]` to learn more.")
                    .addFields({name: "Current Title:", value: titleView})
                    .addFields({name: "Rings:", value: ringView})
                    .addFields({name: "Armour: ", value: itemView})
                    // .setThumbnail(some_url_for_a_thumbnail)   // If you have an image for equipment you can use this.

                return interaction.editReply({ embeds: [embed] });
            }
            else if (action === 'unequip') {
                 // Find the equipped item by its 'E' prefixed userId and name
                 const itemName = interaction.options.getString('item'); // Assuming you have the option in the command setup

                 
                 if(!itemName){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Equipment')
                            .setDescription("Input a valid Equipment in order to attempt to unequip.")
                        interaction.editReply({embeds: [embed]})
                        return;
                 }

                 if(itemName.toLowerCase() === "all"){
                    // To be written
                 }

                 const equippedItem = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: "E" + user.userId });
                 const equippedTitle = await Title.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId });
                    
                 if (!equippedItem && !equippedTitle) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Item is not equipped`)
                        .setDescription(`You don't have '${itemName}' currently equipped.`)
                    interaction.editReply({embeds: [embed]})
                    return;

                 }
                 else if(equippedTitle){
                    const title = user.title ? await Title.findById(user.title) : null;
                    if(title){
                        if(equippedTitle.boost.labor) {
                            const xpBefore = checkLevelRequired(user.laborBonus, 0)
                            const xpAfter = checkLevelRequired(user.laborBonus - equippedTitle.boost.labor, 0)
                            const newXP = (xpAfter / xpBefore) * (user.laborXp)
        
                            user.laborXp = Math.floor(newXP)
                            user.laborBonus -= equippedTitle.boost.labor
                        };
                         if(equippedTitle.boost.hunting) {
                            const xpBefore = checkLevelRequired(user.huntingBonus, 0)
                            const xpAfter = checkLevelRequired(user.huntingBonus - equippedTitle.boost.hunting, 0)
                            const newXP = (xpAfter / xpBefore) * (user.huntingXp)
        
                            user.huntingXp = Math.floor(newXP)
                            user.huntingBonus -= equippedTitle.boost.hunting
                         };
                         if(equippedTitle.boost.luck) {
                            const xpBefore = checkLevelRequired(user.luckBonus, 0)
                            const xpAfter = checkLevelRequired(user.luckBonus - equippedTitle.boost.luck, 0)
                            const newXP = (xpAfter / xpBefore) * (user.luckXp)
        
                            user.luckXp = Math.floor(newXP)
                            user.luckBonus -= equippedTitle.boost.luck
                         };
                         if(equippedTitle.boost.strength) {
                            const xpBefore = checkLevelRequired(user.strengthBonus, 0)
                            const xpAfter = checkLevelRequired(user.strengthBonus - equippedTitle.boost.strength, 0)
                            const newXP = (xpAfter / xpBefore) * (user.strengthXp)
        
                            user.strengthXp = Math.floor(newXP)
                            user.strengthBonus -= equippedTitle.boost.strength
                         };
                         if(equippedTitle.boost.mentality) {
                            const xpBefore = checkLevelRequired(user.mentalityBonus, 0)
                            const xpAfter = checkLevelRequired(user.mentalityBonus - equippedTitle.boost.mentality, 0)
                            const newXP = (xpAfter / xpBefore) * (user.mentalityXp)
        
                            user.mentalityXp = Math.floor(newXP)
                            user.mentalityBonus -= equippedTitle.boost.mentality
                         };
                         if(equippedTitle.boost.dexterity) {
                            const xpBefore = checkLevelRequired(user.dexterityBonus, 0)
                            const xpAfter = checkLevelRequired(user.dexterityBonus - equippedTitle.boost.dexterity, 0)
                            const newXP = (xpAfter / xpBefore) * (user.dexterityXp)
        
                            user.dexterityXp = Math.floor(newXP)
                            user.dexterityBonus -= equippedTitle.boost.dexterity
                         };
                         if(equippedTitle.boost.defense) {
                            const xpBefore = checkLevelRequired(user.defenseBonus, 0)
                            const xpAfter = checkLevelRequired(user.defenseBonus - equippedTitle.boost.defense, 0)
                            const newXP = (xpAfter / xpBefore) * (user.defenseXp)
        
                            user.defenseXp = Math.floor(newXP)
                            user.defenseBonus -= equippedTitle.boost.defense
                         };
                        if(equippedTitle.boost.hp) user.hpBonus -= equippedTitle.boost.hp;
                        if(equippedTitle.boost.stamina) user.staminaBonus -= equippedTitle.boost.stamina;
                        if(equippedTitle.boost.combat) user.combatBonus -= equippedTitle.boost.combat;

                        if (user.title && user.title.toString() === equippedTitle._id.toString()) user.title = null;
                        await user.save();

                        const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Title Update`)
                        .setDescription(`You've successfully unequipped the title: "${itemName}". \n\n(User XP was redistributed accordingly to the ratio)`);
                        return interaction.editReply({embeds: [embed]});      
                    }
                    else{
                        const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`Error: No Item`)
                        .setDescription(`You do not have any title equipped to unequip.`);
                        return interaction.editReply({embeds: [embed]});    
                    }
                 }
             
                 const userInventory = await Inventory.findOne({ userId: user.userId });
             
                 if (!userInventory) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Inventory does not exist')
                        .setDescription("Unable to find inventory, report error to the developer")
                    interaction.editReply({embeds: [embed]})
                    return;

                 }
             
                 // Check if the item exists in the user's inventory
                 const existingItem = await Equipment.findOne({ name: equippedItem.name, userId: user.userId });

                 if (existingItem) {
                     // Increase its quantity if it exists in the inventory
                     existingItem.quantity += 1;
                     await existingItem.save();
                 } else {
                     // Else, create a new item entry in the inventory
                     const newItemData = {...equippedItem._doc};  // get properties of the mongoose document
                     newItemData.userId = user.userId;
                     delete newItemData._id;  // Remove the _id so mongoose will generate a new one
             
                     const newItem = new Equipment(newItemData);
                     newItem.quantity = 1;
                     await newItem.save();
             
                     userInventory.equipment.push(newItem._id);
                 }

                 if(equippedItem.boost.labor) {
                    const xpBefore = checkLevelRequired(user.laborBonus, 0)
                    const xpAfter = checkLevelRequired(user.laborBonus - equippedItem.boost.labor, 0)
                    const newXP = (xpAfter / xpBefore) * (user.laborXp)

                    user.laborXp = Math.floor(newXP)
                    user.laborBonus -= equippedItem.boost.labor
                };
                 if(equippedItem.boost.hunting) {
                    const xpBefore = checkLevelRequired(user.huntingBonus, 0)
                    const xpAfter = checkLevelRequired(user.huntingBonus - equippedItem.boost.hunting, 0)
                    const newXP = (xpAfter / xpBefore) * (user.huntingXp)

                    user.huntingXp = Math.floor(newXP)
                    user.huntingBonus -= equippedItem.boost.hunting
                 };
                 if(equippedItem.boost.luck) {
                    const xpBefore = checkLevelRequired(user.luckBonus, 0)
                    const xpAfter = checkLevelRequired(user.luckBonus - equippedItem.boost.luck, 0)
                    const newXP = (xpAfter / xpBefore) * (user.luckXp)

                    user.luckXp = Math.floor(newXP)
                    user.luckBonus -= equippedItem.boost.luck
                 };
                 if(equippedItem.boost.strength) {
                    const xpBefore = checkLevelRequired(user.strengthBonus, 0)
                    const xpAfter = checkLevelRequired(user.strengthBonus - equippedItem.boost.strength, 0)
                    const newXP = (xpAfter / xpBefore) * (user.strengthXp)

                    user.strengthXp = Math.floor(newXP)
                    user.strengthBonus -= equippedItem.boost.strength
                 };
                 if(equippedItem.boost.mentality) {
                    const xpBefore = checkLevelRequired(user.mentalityBonus, 0)
                    const xpAfter = checkLevelRequired(user.mentalityBonus - equippedItem.boost.mentality, 0)
                    const newXP = (xpAfter / xpBefore) * (user.mentalityXp)

                    user.mentalityXp = Math.floor(newXP)
                    user.mentalityBonus -= equippedItem.boost.mentality
                 };
                 if(equippedItem.boost.dexterity) {
                    const xpBefore = checkLevelRequired(user.dexterityBonus, 0)
                    const xpAfter = checkLevelRequired(user.dexterityBonus - equippedItem.boost.dexterity, 0)
                    const newXP = (xpAfter / xpBefore) * (user.dexterityXp)

                    user.dexterityXp = Math.floor(newXP)
                    user.dexterityBonus -= equippedItem.boost.dexterity
                 };
                 if(equippedItem.boost.defense) {
                    const xpBefore = checkLevelRequired(user.defenseBonus, 0)
                    const xpAfter = checkLevelRequired(user.defenseBonus - equippedItem.boost.defense, 0)
                    const newXP = (xpAfter / xpBefore) * (user.defenseXp)

                    user.defenseXp = Math.floor(newXP)
                    user.defenseBonus -= equippedItem.boost.defense
                 };
                 if(equippedItem.boost.hp) user.hpBonus -= equippedItem.boost.hp;
                 if(equippedItem.boost.stamina) user.staminaBonus -= equippedItem.boost.stamina;
                 if(equippedItem.boost.combat) user.combatBonus -= equippedItem.boost.combat;

                 

                 // Now remove the item from the equipment slot and delete it
                 switch (equippedItem.type.toLowerCase()) {
                     case 'ring':
                         if (user.ring1 && user.ring1.toString() === equippedItem._id.toString()) user.ring1 = null;
                         else if (user.ring2 && user.ring2.toString() === equippedItem._id.toString()) user.ring2 = null;
                         else if (user.ring3 && user.ring3.toString() === equippedItem._id.toString()) user.ring3 = null;
                         else if (user.ring4 && user.ring4.toString() === equippedItem._id.toString()) user.ring4 = null;
                         else if (user.ring5 && user.ring5.toString() === equippedItem._id.toString()) user.ring5 = null;
                         break;
                     
                     case 'weapon':
                         if (user.weapon && user.weapon.toString() === equippedItem._id.toString()) user.weapon = null;
                         break;
                     
                     case 'chest':
                         if (user.chest && user.chest.toString() === equippedItem._id.toString()) user.chest = null;
                         break;

                     case 'head':
                         if (user.head && user.head.toString() === equippedItem._id.toString()) user.head = null;
                         break;

                     case 'arms':
                         if (user.arms && user.arms.toString() === equippedItem._id.toString()) user.arms = null;
                         break;

                     case 'legs':
                         if (user.legs && user.legs.toString() === equippedItem._id.toString()) user.legs = null;
                         break;

                     // You can add more cases if you have other equipment types.
                     default:
                         console.warn(`Unknown equipment type: ${equippedItem.type}`);
                 }

             
                 console.log("Unequiped Item Successfully.")
                 await user.save();
                 await userInventory.save();
                 await Equipment.findByIdAndRemove(equippedItem._id);  // permanently delete the equipped item
             
                 const embed = new EmbedBuilder()
                    .setColor("Green")
                     .setTitle(`Equipment Update`)
                     .setDescription(`You've successfully unequipped ${itemName}. It has been added back to your inventory.\n\n(User XP was redistributed accordingly to the ratio)`);
                 interaction.editReply({embeds: [embed]});             
            }
            else if (action === 'equip') {
                
                const itemName = interaction.options.getString('item'); // Assuming you have the option in the command setup
                const equippedTitle = await Title.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId });
                if(!itemName){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Equipment')
                            .setDescription("Input a valid Equipment in order to attempt to equip.")
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
                else if(equippedTitle){
                    const title = user.title ? await Title.findById(user.title) : null;
                    if(!title){
                        if(equippedTitle.boost.labor) {
                            const xpBefore = checkLevelRequired(user.laborBonus, 0)
                            const xpAfter = checkLevelRequired(user.laborBonus + equippedTitle.boost.labor, 0)
                            const newXP = (xpAfter / xpBefore) * (user.laborXp)
        
                            user.laborXp = Math.floor(newXP)
                            user.laborBonus += equippedTitle.boost.labor;
                        }
                        if(equippedTitle.boost.hunting) {
                            const xpBefore = checkLevelRequired(user.huntingBonus, 0)
                            const xpAfter = checkLevelRequired(user.huntingBonus + equippedTitle.boost.hunting, 0)
                            const newXP = (xpAfter / xpBefore) * (user.huntingXp)
        
                            user.huntingXp = Math.floor(newXP)
                            user.huntingBonus += equippedTitle.boost.hunting
                        };
                        if(equippedTitle.boost.luck) {
                            const xpBefore = checkLevelRequired(user.luckBonus, 0)
                            const xpAfter = checkLevelRequired(user.luckBonus + equippedTitle.boost.luck, 0)
                            const newXP = (xpAfter / xpBefore) * (user.luckXp)
        
                            user.luckXp = Math.floor(newXP)
                            user.luckBonus += equippedTitle.boost.luck
                        };
                        if(equippedTitle.boost.strength) {
                            const xpBefore = checkLevelRequired(user.strengthBonus, 0)
                            const xpAfter = checkLevelRequired(user.strengthBonus + equippedTitle.boost.strength, 0)
                            const newXP = (xpAfter / xpBefore) * (user.strengthXp)
        
                            user.strengthXp = Math.floor(newXP)
                            user.strengthBonus += equippedTitle.boost.strength
                        };
                        if(equippedTitle.boost.mentality) {
                            const xpBefore = checkLevelRequired(user.mentalityBonus, 0)
                            const xpAfter = checkLevelRequired(user.mentalityBonus + equippedTitle.boost.mentality, 0)
                            const newXP = (xpAfter / xpBefore) * (user.mentalityXp)
        
                            user.mentalityXp = Math.floor(newXP)
                            user.mentalityBonus += equippedTitle.boost.mentality
                        };
                        if(equippedTitle.boost.dexterity) {
                            const xpBefore = checkLevelRequired(user.dexterityBonus, 0)
                            const xpAfter = checkLevelRequired(user.dexterityBonus + equippedTitle.boost.dexterity, 0)
                            const newXP = (xpAfter / xpBefore) * (user.dexterityXp)
        
                            user.dexterityXp = Math.floor(newXP)
                            user.dexterityBonus += equippedTitle.boost.dexterity
                        };
                        if(equippedTitle.boost.defense) {
                            const xpBefore = checkLevelRequired(user.defenseBonus, 0)
                            const xpAfter = checkLevelRequired(user.defenseBonus + equippedTitle.boost.defense, 0)
                            const newXP = (xpAfter / xpBefore) * (user.defenseXp)
        
                            user.defenseXp = Math.floor(newXP)
                            user.defenseBonus += equippedTitle.boost.defense
                        };
                        if(equippedTitle.boost.hp) user.hpBonus += equippedTitle.boost.hp;
                        if(equippedTitle.boost.stamina) user.staminaBonus += equippedTitle.boost.stamina;
                        if(equippedTitle.boost.combat) user.combatBonus += equippedTitle.boost.combat;

                        user.title = equippedTitle._id;
                        await user.save();

                        const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setTitle(`Title Update`)
                        .setDescription(`You've successfully equipped the title: "${itemName}".\n\n(User XP was redistributed accordingly to the ratio)`);
                        return interaction.editReply({embeds: [embed]});      
                    }
                    else{
                        const embed = new EmbedBuilder()
                        .setColor("Red")
                        .setTitle(`Error: Item Already Equipped`)
                        .setDescription(`You already have a title equipped. Please unequip it first.`);
                        return interaction.editReply({embeds: [embed]});    
                    }
                 }

                // Find the item in the inventory 
                const targetEquipment = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId });
                console.log("Equipment name:" + new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i"))
                console.log("User name:" + user.userId)
                if(!targetEquipment){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`Unable to find '${itemName}'. Scam me one more time and watch`)
                        .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                    interaction.editReply({embeds: [embed]})
                    return;

                }

                // Check if item is in the user's inventory
                if (!userInventory.equipment.includes(targetEquipment._id)) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Developer Error`)
                        .setDescription(`You own '${itemName}' but it does not exist in your inventory, report to the developer.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                // Check if the item's slot is available in the user's equipment slots
                // (e.g., if the item is a ring, check if a ring slot is available)
                let slotAvailable = false;
                let slotName = '';
                switch (targetEquipment.type.toLowerCase()) {
                    case 'ring':
                        if (!user.ring1) {
                            slotAvailable = true;
                            slotName = 'ring1';
                        } else if (!user.ring2) {
                            slotAvailable = true;
                            slotName = 'ring2';
                        } else if (!user.ring3) {
                            slotAvailable = true;
                            slotName = 'ring3';
                        } else if (!user.ring4) {
                            slotAvailable = true;
                            slotName = 'ring4';
                        } else if (!user.ring5) {
                            slotAvailable = true;
                            slotName = 'ring5';
                        }
                        break;
                    case 'weapon':
                        slotAvailable = !user.weapon;
                        slotName = 'weapon';
                        break;
                    case 'chest':
                        slotAvailable = !user.chest;
                        slotName = 'chest';
                        break;
                    case 'head':
                        slotAvailable = !user.head;
                        slotName = 'head';
                        break;
                    case 'arms':
                        slotAvailable = !user.arms;
                        slotName = 'arms';
                        break;
                    case 'legs':
                        slotAvailable = !user.legs;
                        slotName = 'legs';
                        break;
                    // You can add more cases if you have other equipment types.
                    default:
                        //NO ITEM IN INVENTORY
                        const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Invalid Equipment Type`)
                        .setDescription(`This equipment type ${targetEquipment.type} is unable to be equipped.`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                if (!slotAvailable) {
                    //NO ITEM IN INVENTORY
                    const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(`Error: No Free Slots`)
                    .setDescription(`You don't have a free slot to equip the ${itemName}. Try unequpping an item.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                const newItemData = {...targetEquipment._doc};  // _doc gives you the properties of the mongoose document
                    
                newItemData.userId = "E" + user.userId;
                delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                const newItem = new Equipment(newItemData);
                newItem.quantity = 1;
                await newItem.save();

                // Equip the item
                user[slotName] = newItem._id;

                if(newItemData.boost.labor) {
                    const xpBefore = checkLevelRequired(user.laborBonus, 0)
                    const xpAfter = checkLevelRequired(user.laborBonus + newItemData.boost.labor, 0)
                    const newXP = (xpAfter / xpBefore) * (user.laborXp)

                    user.laborXp = Math.floor(newXP)
                    user.laborBonus += newItemData.boost.labor;
                }
                if(newItemData.boost.hunting) {
                    const xpBefore = checkLevelRequired(user.huntingBonus, 0)
                    const xpAfter = checkLevelRequired(user.huntingBonus + newItemData.boost.hunting, 0)
                    const newXP = (xpAfter / xpBefore) * (user.huntingXp)

                    user.huntingXp = Math.floor(newXP)
                    user.huntingBonus += newItemData.boost.hunting
                };
                if(newItemData.boost.luck) {
                    const xpBefore = checkLevelRequired(user.luckBonus, 0)
                    const xpAfter = checkLevelRequired(user.luckBonus + newItemData.boost.luck, 0)
                    const newXP = (xpAfter / xpBefore) * (user.luckXp)

                    user.luckXp = Math.floor(newXP)
                    user.luckBonus += newItemData.boost.luck
                };
                if(newItemData.boost.strength) {
                    const xpBefore = checkLevelRequired(user.strengthBonus, 0)
                    const xpAfter = checkLevelRequired(user.strengthBonus + newItemData.boost.strength, 0)
                    const newXP = (xpAfter / xpBefore) * (user.strengthXp)

                    user.strengthXp = Math.floor(newXP)
                    user.strengthBonus += newItemData.boost.strength
                };
                if(newItemData.boost.mentality) {
                    const xpBefore = checkLevelRequired(user.mentalityBonus, 0)
                    const xpAfter = checkLevelRequired(user.mentalityBonus + newItemData.boost.mentality, 0)
                    const newXP = (xpAfter / xpBefore) * (user.mentalityXp)

                    user.mentalityXp = Math.floor(newXP)
                    user.mentalityBonus += newItemData.boost.mentality
                };
                if(newItemData.boost.dexterity) {
                    const xpBefore = checkLevelRequired(user.dexterityBonus, 0)
                    const xpAfter = checkLevelRequired(user.dexterityBonus + newItemData.boost.dexterity, 0)
                    const newXP = (xpAfter / xpBefore) * (user.dexterityXp)

                    user.dexterityXp = Math.floor(newXP)
                    user.dexterityBonus += newItemData.boost.dexterity
                };
                if(newItemData.boost.defense) {
                    const xpBefore = checkLevelRequired(user.defenseBonus, 0)
                    const xpAfter = checkLevelRequired(user.defenseBonus + newItemData.boost.defense, 0)
                    const newXP = (xpAfter / xpBefore) * (user.defenseXp)

                    user.defenseXp = Math.floor(newXP)
                    user.defenseBonus += newItemData.boost.defense
                };
                if(newItemData.boost.hp) user.hpBonus += newItemData.boost.hp;
                if(newItemData.boost.stamina) user.staminaBonus += newItemData.boost.stamina;
                if(newItemData.boost.combat) user.combatBonus += newItemData.boost.combat; 

                await user.save();

                if (targetEquipment.quantity > 1){
                    targetEquipment.quantity -= 1;
                    await targetEquipment.save();
                } else{
                    userInventory.equipment.remove(targetEquipment._id);
                    await Equipment.findByIdAndRemove(targetEquipment._id);
                }

                //Title Assignment
                let titleAssignment = "";
                const newTitleSunWarrior= await Title.findOne({name: "Praise the Sun", userId: null})
                const newTitleDraconian = await Title.findOne({name: "Draconian", userId: null})
                const newTitleBlackSwordsman = await Title.findOne({name: "The Black Swordsman", userId: null})
                const newTitleBlackKnight = await Title.findOne({name: "Black Knight", userId: null})
                const newTitleSilverKnight = await Title.findOne({name: "Silver Knight", userId: null})
                const newTitleAbyssalFlameBearer = await Title.findOne({name: "Abyssal Flamebearer", userId: null})
                const newTitleDestiny = await Title.findOne({name: "Bearer of Destiny", userId: null})
                const newTitleRedCommander = await Title.findOne({name: "Blood-Red Commander", userId: null})

                if (!newTitleSunWarrior || !newTitleDraconian || !newTitleBlackSwordsman || !newTitleBlackKnight || !newTitleSilverKnight || !newTitleAbyssalFlameBearer || !newTitleDestiny || !newTitleRedCommander) {
                    const embed = new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Error: Existing Registering Title')
                                .setDescription("An error occured, please report to the developer.")
                            interaction.editReply({embeds: [embed]})
                            return;
                }

                const equippedTitleSunWarrior = await Title.findOne({name: "Praise the Sun", userId: user.userId})
                const equippedTitleDraconian = await Title.findOne({name: "Draconian", userId: user.userId})
                const equippedTitleBlackSwordsman = await Title.findOne({name: "The Black Swordsman", userId: user.userId})
                const equippedTitleBlackKnight = await Title.findOne({name: "Black Knight", userId: user.userId})
                const equippedTitleSilverKnight = await Title.findOne({name: "Silver Knight", userId: user.userId})
                const equippedTitleAbyssalFlameBearer = await Title.findOne({name: "Abyssal Flamebearer", userId: user.userId})
                const equippedTitleDestiny = await Title.findOne({name: "Bearer of Destiny", userId: user.userId})
                const equippedTitleRedCommander = await Title.findOne({name: "Blood-Red Commander", userId: user.userId})

                //Equips the moneybag title:
                if(!equippedTitleSunWarrior || !equippedTitleDraconian || !equippedTitleBlackSwordsman || !equippedTitleBlackKnight || !equippedTitleSilverKnight || !equippedTitleAbyssalFlameBearer || !equippedTitleDestiny || !equippedTitleRedCommander) {
                    const weaponDetails = user.weapon ? await Equipment.findById(user.weapon) : null;
                    const chestDetails = user.chest ? await Equipment.findById(user.chest) : null;
                    const headDetails = user.head ? await Equipment.findById(user.head) : null;
                    const armsDetails = user.arms ? await Equipment.findById(user.arms) : null;
                    const legsDetails = user.legs ? await Equipment.findById(user.legs) : null;
                    const ring1 = user.ring1 ? await Equipment.findById(user.ring1) : null;
                    const ring2 = user.ring2 ? await Equipment.findById(user.ring2) : null;
                    const ring3 = user.ring3 ? await Equipment.findById(user.ring3) : null;
                    const ring4 = user.ring4 ? await Equipment.findById(user.ring4) : null;
                    const ring5 = user.ring1 ? await Equipment.findById(user.ring5) : null;
                    if(chestDetails && headDetails && armsDetails && legsDetails && chestDetails.name === "Armour of the Sun" && headDetails.name === "Iron Helm" && armsDetails.name === "Iron Bracelets" && legsDetails.name === "Iron Leggings" && !equippedTitleSunWarrior){
                        const newItemData = {...newTitleSunWarrior._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Praise the Sun\"*"
                    }
                    else if(chestDetails && headDetails && armsDetails && legsDetails && chestDetails.name === "Dragonslayer Armour" && headDetails.name === "Dragonslayer Helm" && armsDetails.name === "Dragonslayer Gauntlets" && legsDetails.name === "Dragonslayer Leggings" && !equippedTitleDraconian){
                        const newItemData = {...newTitleDraconian._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Draconian\"*"
                    }
                    else if(chestDetails && weaponDetails && chestDetails.name === "Midnight Coat" && weaponDetails.name === "Dark Repulser" && !equippedTitleBlackSwordsman){
                        const newItemData = {...newTitleBlackSwordsman._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"The Black Swordsman\"*"
                    }
                    else if(chestDetails && headDetails && armsDetails && legsDetails && chestDetails.name === "Black Knight Armour" && headDetails.name === "Black Knight Helm" && armsDetails.name === "Black Knight Gauntlets" && legsDetails.name === "Black Knight Leggings" && !equippedTitleBlackKnight){
                        const newItemData = {...newTitleBlackKnight._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Black Knight\"*"
                    }
                    else if(chestDetails && headDetails && armsDetails && legsDetails && chestDetails.name === "Silver Knight Armour" && headDetails.name === "Silver Knight Helm" && armsDetails.name === "Silver Knight Gauntlets" && legsDetails.name === "Silver Knight Leggings" && !equippedTitleSilverKnight){
                        const newItemData = {...newTitleSilverKnight._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Silver Knight\"*"
                    }
                    else if(chestDetails && headDetails && armsDetails && legsDetails && chestDetails.name === "Abyssal Dragonscale Armour" && headDetails.name === "Abyssal Dragonscale Helm" && armsDetails.name === "Abyssal Dragonscale Gauntlets" && legsDetails.name === "Abyssal Dragonscale Leggings" && !equippedTitleAbyssalFlameBearer){
                        const newItemData = {...newTitleAbyssalFlameBearer._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Abyssal Flamebearer\"*"
                    }
                    if(((ring1 && ring1.name === 'Ring of Destiny') || (ring2 && ring2.name === 'Ring of Destiny') || (ring3 && ring3.name === 'Ring of Destiny') || (ring4 && ring4.name === 'Ring of Destiny') || (ring5 && ring5.name === 'Ring of Destiny')) && !equippedTitleDestiny){
                        const newItemData = {...newTitleDestiny._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Bearer of Destiny\"*"
                    }
                    if(((ring1 && ring1.name === 'Ring of the Great Void') || (ring2 && ring2.name === 'Ring of the Great Void') || (ring3 && ring3.name === 'Ring of the Great Void') || (ring4 && ring4.name === 'Ring of the Great Void') || (ring5 && ring5.name === 'Ring of the Great Void')) && weaponDetails && weaponDetails.name === "True Demon King\'s Longsword" && !equippedTitleRedCommander){
                        const newItemData = {...newTitleRedCommander._doc};  // _doc gives you the properties of the mongoose document
                                        
                        newItemData.userId = user.userId;
                        delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                        const newItem = new Title(newItemData);
                        await newItem.save();
                        userInventory.titles.push(newItem._id)
                        await userInventory.save()

                        titleAssignment += "\n\nGained the title: *\"Blood-Red Commander\"*"
                    }
                }

                console.log('Successfully Equipped Item.')
                await userInventory.save()
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle(`Equipment Update`)
                    .setDescription(`You've successfully equipped ${itemName}. It has been removed from your inventory and placed in your equipment slot.\n\n(User XP was redistributed accordingly to the ratio)${titleAssignment}`);
                interaction.editReply({embeds: [embed]});

            }
            else{
                console.log("invalid command addition");
            }
    

        } catch (error) {
            console.log(`Error in /equipment view: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Equipments could not be accessed`)
                        .setDescription(`Equipments could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
