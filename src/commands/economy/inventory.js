const { Client, Interaction, EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const Inventory = require('../../models/inventory');
const Equipment = require('../../models/equipment');
const Usables = require('../../models/usable');
const Materials = require('../../models/material');
const Stocks = require('../../models/stock');
const RecipeBooks = require('../../models/recipeBook');

module.exports = {
    name: 'inventory',
    description: 'Displays user inventory',
    /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply();
            const query = { userId: interaction.user.id };
            
            // Fetch user data
            const user = await User.findOne(query);

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            // Fetch inventory data
            const inventory = await Inventory.findOne(query)
                .populate('equipment')
                .populate('usables')
                .populate('materials')
                .populate('stocks')
                .populate('spells')
                .populate('recipeBooks')
                .populate('titles');
                const currentPage = {
                    equipment: 0,
                    usables: 0,
                    materials: 0,
                    recipeBooks: 0,
                    spells: 0,
                    titles: 0,
                    stocks: 0,
                  };
                  
                  // Modify setEmbedPage to accept page numbers and only display limited items
                  const ITEMS_PER_PAGE = 10;
                  
                  
                
                const setEmbedPage = async (page, pageNumber) => {
                    let inventoryEmbed = new EmbedBuilder();
                    let desc = `${interaction.user.displayName}'s storage. Navigate by reacting to the corresponding reactions for the four categories (\`Equipment, Usables, Materials, Incantations, Crafting Ledgers, Titles, and Stocks\`). You can move through categories with (⬅️ ➡️)`;
                    inventoryEmbed.setColor("Purple")
                    inventoryEmbed.setTitle(`Inventory`);
    
                    // Extract a subset of items based on the pageNumber
                    const start = pageNumber * ITEMS_PER_PAGE;
                    const end = start + ITEMS_PER_PAGE;
                    
                    let items = [];
                    
                    switch(page) {
                        case "equipment":
                            inventoryEmbed.setDescription(`${desc}\n\n**Equipment:**`);
                            items = inventory.equipment.slice(start, end);
                            for (let item of items) {
                                inventoryEmbed.addFields({
                                  name: `${item.name} [${item.rank} Rank]`,
                                  value: `\`\`\`Quantity:  x ${item.quantity}\nNet Value: ${item.quantity * item.price} Doros\`\`\``
                            });}

                            if (items.length === 0) {
                                inventoryEmbed.addFields({name:'Empty', value: '\`\`\`N/A\`\`\`'});
                            }
                            inventoryEmbed.setFooter({text: `Page ${pageNumber + 1} / ${Math.ceil(inventory.equipment.length / ITEMS_PER_PAGE) } (Equipment)`});
                            break;
                        case "usables":
                            inventoryEmbed.setDescription(`${desc}\n\n**Usables:**`);
                            items = inventory.usables.slice(start, end);
                            for (let item of items) {
                                let consom = ""
                                if(item.consumable){
                                    consom = "[Consumable Item]"
                                }
                                inventoryEmbed.addFields({
                                  name: `${item.name} ${consom}`,
                                  value: `\`\`\`Quantity:  x ${item.quantity}\nNet Value: ${item.quantity * item.price} Doros\`\`\``
                            });}

                            if (items.length === 0) {
                                inventoryEmbed.addFields({name:'Empty', value: '\`\`\`N/A\`\`\`'});
                            }
                            inventoryEmbed.setFooter({text: `Page ${pageNumber + 1} / ${Math.ceil(inventory.usables.length / ITEMS_PER_PAGE) } (Usables)`});
                            break;
                    
                        case "materials":
                            inventoryEmbed.setDescription(`${desc}\n\n**Materials:**`);
                            items = inventory.materials.slice(start, end);
                            for (let item of items) {
                                inventoryEmbed.addFields({
                                  name: item.name,
                                  value: `\`\`\`Quantity:  x ${item.quantity}\nNet Value: ${item.quantity * item.price} Doros\`\`\``
                            });}

                            if (items.length === 0) {
                                inventoryEmbed.addFields({name:'Empty', value: '\`\`\`N/A\`\`\`'});
                            }
                            inventoryEmbed.setFooter({text: `Page ${pageNumber + 1} / ${Math.ceil(inventory.materials.length / ITEMS_PER_PAGE) } (Materials)`});
                            break;
                    
                        case "recipeBooks":
                            inventoryEmbed.setDescription(`${desc}\n\n**Crafting Ledgers:**`);
                            items = inventory.recipeBooks.slice(start, end);
                            for (let item of items) {
                                inventoryEmbed.addFields({
                                  name: item.name,
                                  value: `\`\`\`Quantity:  x ${item.quantity}\nNet Value: ${item.quantity * item.price} Doros\`\`\``
                            });}

                            if (items.length === 0) {
                                inventoryEmbed.addFields({name:'Empty', value: '\`\`\`N/A\`\`\`'});
                            }
                            inventoryEmbed.setFooter({text: `Page ${pageNumber + 1} / ${Math.ceil(inventory.recipeBooks.length / ITEMS_PER_PAGE) } (Crafting Ledgers)`});
                            break;
                    
                        case "spells":
                            inventoryEmbed.setDescription(`${desc}\n\n**Incantations:**`);
                            items = inventory.spells.slice(start, end);
                            for (let item of items) {
                                inventoryEmbed.addFields({
                                  name: `${item.name} [${item.rank} Rank]`,
                                  value: `\`\`\`Type: ${item.type}\nNet Value: ${item.price} Doros\`\`\``
                            });}

                            if (items.length === 0) {
                                inventoryEmbed.addFields({name:'Empty', value: '\`\`\`N/A\`\`\`'});
                            }
                            inventoryEmbed.setFooter({text: `Page ${pageNumber + 1} / ${Math.ceil(inventory.spells.length / ITEMS_PER_PAGE) } (Incantations)`});
                            break;

                        case "titles":
                            inventoryEmbed.setDescription(`${desc}\n\n**Titles:**`);
                            items = inventory.titles.slice(start, end);
                            for (let item of items) {
                                function capitalizeFirstLetter(string) {
                                    return string.charAt(0).toUpperCase() + string.slice(1);
                                }

                                const boostData = item.boost.toObject(); // Convert the Mongoose sub-document to a plain object
                                let additionalInfo = [];
                                const boostedStats = [];
                                for (const [key, value] of Object.entries(boostData)) {
                                    if (value > 0) {
                                        const statString = `${capitalizeFirstLetter(key)} +${value}`;
                                        boostedStats.push(statString);
                                    }
                                }

                                if (boostedStats.length) {
                                    additionalInfo.push(...boostedStats);
                                }
                                inventoryEmbed.addFields({
                                  name: `"${item.name}"`,
                                  value: `\`\`\`Bonus: ${[...additionalInfo].join(', ')}\`\`\``
                                });
                            }

                            if (items.length === 0) {
                                inventoryEmbed.addFields({name:'Empty', value: '\`\`\`N/A\`\`\`'});
                            }
                            inventoryEmbed.setFooter({text: `Page ${pageNumber + 1} / ${Math.ceil(inventory.titles.length / ITEMS_PER_PAGE) } (Titles)`});
                            break;
                    
                        case "stocks":
                            inventoryEmbed.setDescription(`${desc}\n\n**Stocks:**`);
                            items = inventory.stocks.slice(start, end);
                            for (let item of items) {
                                const trueStock = await Stocks.findOne({ name: { $regex: new RegExp("^" + item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }});
                                inventoryEmbed.addFields({
                                  name: `${item.name} (${item.description})`,
                                  value: `\`\`\`Quantity:  x ${item.quantity}\nNet Value: ${item.quantity * item.price} Doros -> ${item.quantity * trueStock.price} Doros\`\`\``
                            });}

                            if (items.length === 0) {
                                inventoryEmbed.addFields({name:'Empty', value: '\`\`\`N/A\`\`\`'});
                            }
                            inventoryEmbed.setFooter({text: `Page ${pageNumber + 1} / ${Math.ceil(inventory.stocks.length / ITEMS_PER_PAGE) } (Stocks)`});
                            break;
                    }
                  
                  return inventoryEmbed;
                };
                let category = "equipment";
                const initialEmbed = await setEmbedPage(category, 0);

                const inventoryMessage = await interaction.editReply({ 
                    embeds: [initialEmbed],
                    fetchReply: true,
                });

                // Add reactions for next and previous controls
                await inventoryMessage.react('⬅️');
                await inventoryMessage.react('➡️');
                await inventoryMessage.react('⚔️');
                await inventoryMessage.react('🔑');
                await inventoryMessage.react('📦');
                await inventoryMessage.react('📖');
                await inventoryMessage.react('📒');
                await inventoryMessage.react('📝');
                await inventoryMessage.react('💰');
   

                const filter = (reaction, user) => ['⚔️', '🔑', '📦', '📒', '📖', '📝', '💰', '⬅️', '➡️'].includes(reaction.emoji.name) && user.id !== inventoryMessage.author.id; 
                
                const collector = inventoryMessage.createReactionCollector({ filter, time: 180000 }); // 3 minutes in milliseconds
                
                collector.on('collect', async (reaction, userReacted) => {
                    const userReactor = reaction.message.guild.members.cache.find(member => member.id === userReacted.id);

                    // Remove user's reaction
                    reaction.users.remove(userReactor.id); 
                    const totalPages = Math.ceil(inventory[category].length / ITEMS_PER_PAGE);                 
                
                    switch(reaction.emoji.name) {
                        case "⚔️":
                        category = "equipment";
                        break;
                        case "🔑":
                        category = "usables";
                        break;
                        case "📦":
                        category = "materials";
                        break;
                        case "📒":
                        category = "recipeBooks";
                        break;
                        case "📖":
                        category = "spells";
                        break;
                        case "📝":
                        category = "titles";
                        break;
                        case "💰":
                        category = "stocks";
                        break;
                        case "➡️": 
                            if (currentPage[category] < totalPages - 1) {
                                currentPage[category]++;
                            }
                            else{
                                currentPage[category] = 0;
                            }
                        break;
                        case "⬅️": 
                            if (currentPage[category] > 0) {
                                currentPage[category]--;
                            } else {
                                currentPage[category] = totalPages - 1;
                            }                    
                        break;
                    }
                    interaction.editReply({ embeds: [await setEmbedPage(category, currentPage[category])] });
                });
                
        } catch (error) {
            console.log(`Error in /inventory: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Inventory could not be accessed`)
                        .setDescription(`Inventory could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
