const { Client, Interaction,  EmbedBuilder, ApplicationCommandOptionType} = require('discord.js');
const User = require('../../models/user');
const Bank = require('../../models/bank');
const GlobalMarketPost = require('../../models/globalMarketPost');
const Equipment = require('../../models/equipment');
const Materials = require('../../models/material');
const Usables = require('../../models/usable');
const RecipeBooks = require('../../models/recipeBook');
const Stocks = require('../../models/stock');
const Spells = require('../../models/spell');
const Inventory = require('../../models/inventory');
const { formatDate } = require('../../utils/formatDate');


module.exports = {
    name: 'auction',
    description: 'Browse and participate in the global dauntless auctionhouse.',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Auction House action to perform. ',
            choices: [
                { name: 'Browse Auction', value: 'view' },
                { name: 'Create Auction', value: 'create' },
                { name: 'Bid', value: 'bid' }
            ],
            required: true,
        },
        {
            name: 'item',
            type: ApplicationCommandOptionType.String,
            description: 'Provide this only if action is "Create Auction" or "Bid".',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'quantity',
            type: ApplicationCommandOptionType.Integer,
            description: 'Quantity of the item to place on auction, deafault value is 1',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'time',
            type: ApplicationCommandOptionType.Integer,
            description: 'Time limit for the auction to take place in hours (max 24 hours ). Default time is 1 hour',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'bid',
            type: ApplicationCommandOptionType.Integer,
            description: 'Starting bid to place if on a new auction or bid to place on an ongoing auction. Default is 100',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'user',
            type: ApplicationCommandOptionType.String,
            description: 'Only needed when placing a bid, specify which bidder you are bidding for. (username, not tag)',
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

            const checkExpiredPostsAndHighestBidders = async () => {
                const allPosts = await GlobalMarketPost.find();
                const currentTime = new Date();
            
                for (let post of allPosts) {
                    // Convert saleEnd from hours to milliseconds and add to saleTimeStamp
                    const timePassedSincePost = currentTime - post.saleTimeStamp;
                    const auctionDurationInMilliseconds = post.saleEnd * 60 * 60 * 1000;
                    console.log(`${timePassedSincePost} and ${auctionDurationInMilliseconds}`)
                    // Check if the post has expired
                    if (timePassedSincePost > auctionDurationInMilliseconds) {


                        let highestBid = post.price;
                        let highestBidderId = null;
            
                        for (let bid of post.bids) {
                            if (bid.bid > highestBid) {
                                highestBid = bid.bid;
                                highestBidderId = bid.userId;
                            }
                        }
            
                        // Log the highest bidder's information
                        if (highestBidderId) {
                            console.log(`Post for item ${post.bidItem} has ended. Highest bidder is User ID: ${highestBidderId} with a bid of ${highestBid} Doros.`);
                            const bidWinner = await User.findOne({userId: highestBidderId})
                            const bidder = await User.findOne({userId: post.userId})
                            const winnerInventory = await Inventory.findOne({userId: highestBidderId})
                            if(!bidWinner){
                                return console.log(`could not find user: ${highestBidderId}`);
                            }
                            if(!winnerInventory){
                                return console.log(`could not find inventory: ${highestBidderId}`);
                            }
                            if(!bidder){
                                return console.log(`could not find bidder/poster: ${bidder}`);
                            }
                            bidder.balance += highestBid;
                            bidWinner.balance -= highestBid;

                            const targetEquipment = await Equipment.findOne({ name: post.bidItem, userId: highestBidderId  });
                            const targetUsable = await Usables.findOne({ name: post.bidItem, userId: highestBidderId  });
                            const targetMaterial = await Materials.findOne({ name: post.bidItem, userId: highestBidderId  });
                            const targetBook = await RecipeBooks.findOne({ name: post.bidItem, userId: highestBidderId  });
                            const targetItem = targetEquipment || targetUsable || targetMaterial || targetBook;

                            if(targetItem){
                                targetItem.quantity += post.quantity;
                                await targetItem.save();
                                if (targetEquipment) await Equipment.findByIdAndRemove(post.item._id);
                                if (targetUsable) await Usables.findByIdAndRemove(post.item._id);
                                if (targetMaterial) await Materials.findByIdAndRemove(post.item._id);
                                if (targetBook) await RecipeBooks.findByIdAndRemove(post.item._id);
                            }else{
                                const bidItem = await Equipment.findById(post.item._id) || await Materials.findById(post.item._id) || await Usables.findById(post.item._id) || await RecipeBooks.findById(post.item._id);
                                bidItem.userId = post.userId;
                                if(post.onModel === "Equipment"){
                                    winnerInventory.equipment.push(post.item._id);
                                }
                                else if(post.onModel === "Material"){
                                    winnerInventory.materials.push(post.item._id);
                                }
                                else if(post.onModel === "Usable"){
                                    winnerInventory.usables.push(post.item._id);
                                }
                                else if(post.onModel == "RecipeBook"){
                                    winnerInventory.recipeBooks.push(post.item._id);
                                }
                                await bidItem.save();
                            }
                            
                            await winnerInventory.save();
                            await bidWinner.save();
                            await bidder.save();

                            await GlobalMarketPost.findByIdAndRemove(post._id);
                            
                        } else {
                            console.log(`Post for item ${post.bidItem} has ended. No bids were placed.`);
                            const winnerInventory = await Inventory.findOne({userId: post.userId})
                            const targetEquipment = await Equipment.findOne({ name: post.bidItem, userId: post.userId  });
                            const targetUsable = await Usables.findOne({ name: post.bidItem, userId: post.userId  });
                            const targetMaterial = await Materials.findOne({ name: post.bidItem, userId: post.userId  });
                            const targetBook = await RecipeBooks.findOne({ name: post.bidItem, userId: post.userId  });
                            const targetItem = targetEquipment || targetUsable || targetMaterial || targetBook;

                            if(targetItem){
                                targetItem.quantity += post.quantity;
                                await targetItem.save();
                                if (targetEquipment) await Equipment.findByIdAndRemove(post.item._id);
                                if (targetUsable) await Usables.findByIdAndRemove(post.item._id);
                                if (targetMaterial) await Materials.findByIdAndRemove(post.item._id);
                                if (targetBook) await RecipeBooks.findByIdAndRemove(post.item._id);
                            }
                            else{
                                const bidItem = await Equipment.findById(post.item._id) || await Materials.findById(post.item._id) || await Usables.findById(post.item._id) || await RecipeBooks.findById(post.item._id);
                                bidItem.userId = post.userId;
                                console.log(post.userId);
                                if(post.onModel === "Equipment"){
                                    winnerInventory.equipment.push(post.item._id);
                                }
                                else if(post.onModel === "Material"){
                                    winnerInventory.materials.push(post.item._id);
                                    console.log(post.item._id);
                                }
                                else if(post.onModel === "Usable"){
                                    winnerInventory.usables.push(post.item._id);
                                }
                                else if(post.onModel == "RecipeBook"){
                                    winnerInventory.recipeBooks.push(post.item._id);
                                }
                                await bidItem.save();
                            }
                            
                            await winnerInventory.save();
                            await GlobalMarketPost.findByIdAndRemove(post._id);
                        }
                    }
                }
            }
            
            // Call the function
            await checkExpiredPostsAndHighestBidders();
            
            const query = { userId: interaction.user.id };
            const user = await User.findOne(query);

            const action = interaction.options.getString('action');
            const itemName = interaction.options.getString('item');
            const time = interaction.options.getInteger('time') || 1;
            const bid = interaction.options.getInteger('bid') || 100;
            const quantity = interaction.options.getInteger('quantity') || 1;
            const bidUser = interaction.options.getString('user');

            if(!action){
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid Action')
                    .setDescription("Please select a valid option to perform")
                interaction.editReply({embeds: [embed]})
                return;
            }

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            if(action === "view"){
                const allPosts = await GlobalMarketPost.find();

                let page = 0;
                const itemsPerPage = 5;
    
                const generateEmbed = (start) => {
                    const current = allPosts.slice(start, start + itemsPerPage);
                    const embed = new EmbedBuilder()
                        .setColor("Purple")
                        .setTitle('Global Auction House')
                        .setDescription("View all ongoing auctions. You can create your own with /auction create and add bids for ongoing auctions. If you win a bid after the time-limit ends, the item will automatically deposit inside your inventory, and the transaction will be automatically completed. Note: If your balance does not support the bid you placed when the auction ends, you will go into debt.")
                        .setFooter({ text: `Page ${start / itemsPerPage + 1} of ${Math.ceil(allPosts.length / itemsPerPage)}`} );

                    let itemHighestBid = "";
                    let itemPoster = "";

                    if(allPosts.length!==0){
                        current.forEach(async item => {
                            itemHighestBid = "";
                            itemPoster = "";
                            
                            const itemNames = `${item.bidItem} x ${item.quantity} \`(${formatDate(item.saleTimeStamp)})\``;
                            const itemQuantities = `${item.quantity}`;
                        
                            // Getting the highest bid
                            if (item.bids.length > 0) {
                                const highestBid = Math.max(...item.bids.map(bid => bid.bid));
                                itemHighestBid = `${highestBid} Doros`;
                            } else {
                                itemHighestBid = `${item.price} Doros`;
                            }

                            const ihb = itemHighestBid;
                        
                            // Calculating the remaining time
                            const endTime = new Date(item.saleTimeStamp).getTime() + (item.saleEnd * 60 * 60 * 1000); // saleEnd is in hours
                            const now = Date.now();
                            const totalRemainingMinutes = Math.round((endTime - now) / (60 * 1000));

                            const hours = Math.floor(totalRemainingMinutes / 60);
                            const minutes = totalRemainingMinutes % 60;
                            let hr;
                            let mn;
                            (hours < 10) ? hr = `0${hours}` : hr = `${hours}`;
                            (minutes < 10) ? mn = `0${minutes}` : mn = `${minutes}`;

                            const itemRemainingTime = `${hr}h : ${mn}m`;
                        
                            // Fetching the poster's username through the user ID
                            try {
                                const user = await client.users.fetch(item.userId);
                                itemPoster = `${user.username}`;
                            } catch (err) {
                                console.error(`Failed to fetch user with ID: ${item.userId}`);
                                itemPoster = `Unknown User`;
                            }

                            const poster = itemPoster;
                            embed.addFields({name: itemNames, value: `\`\`\`\nPosted by: ${poster}\nCurrent highest bid: ${ihb}\nTime remaining: ${itemRemainingTime}\`\`\``});
                            
                        });
                    }
                    else{
                        embed.setDescription("View all ongoing auctions. You can create your own with /auction create and add bids for ongoing auctions. If you win a bid after the time-limit ends, the item will automatically deposit inside your inventory, and the transaction will be automatically completed. Note: If your balance does not support the bid you placed when the auction ends, you will go into debt.\n\n**No Ongoing Auctions**");
                    }
                    embed.addFields();
                    return embed;
                }
                const marketMessage = await interaction.editReply({
                    embeds: [generateEmbed(0)],
                    fetchReply: true,
                });
                await marketMessage.react('⬅️');
                await marketMessage.react('➡️');
                const filter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === interaction.user.id;
                const collector = marketMessage.createReactionCollector({ filter, time: 100000 });
                collector.on('collect', async (reaction) => {
                    console.log("test")
                    reaction.users.remove(interaction.user.id);
                    if (reaction.emoji.name === '➡️') {
                        if (page < allPosts.length - itemsPerPage) page += itemsPerPage;
                    } else if (reaction.emoji.name === '⬅️') {
                        if (page > 0) page -= itemsPerPage;
                    }
    
                    interaction.editReply({ embeds: [generateEmbed(page)] });
                });
            }else if (action === "create"){
                if(!itemName){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Invalid Item Input`)
                        .setDescription(`Please specify the item which you would like to bid for`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
                if (quantity < 1){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription("Unable to sell less then one of an item, you cannot scam the scammer.")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                if(bid<1){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription("Bid is too low, don't play with me bitch")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                if(time<1){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription("Time set is too low, don't play with me bitch")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
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
            
                const targetEquipment = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetUsable = await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetMaterial = await Materials.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetBook = await RecipeBooks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetStock = await Stocks.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetSpell = await Spells.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: user.userId  });
                const targetItem = targetEquipment || targetUsable || targetMaterial || targetBook || targetStock || targetSpell;

                if(targetStock || targetSpell){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Category')
                        .setDescription("You cannot place this category of item under auction.")
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                if(!targetItem){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Item')
                            .setDescription(`Item '${itemName}' does not exist within Dauntless`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }
            
                if (!(userInventory.equipment.includes(targetItem._id) || userInventory.usables.includes(targetItem._id) || userInventory.materials.includes(targetItem._id) || userInventory.recipeBooks.includes(targetItem._id))) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You don't have any '${itemName}' in your inventory to place for auction. Scam me one more time and watch`)
                        .setThumbnail('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJkCI2ZBY68l1Vbnkp4uKrTRdyap5zrh8amA&usqp=CAU')
                    interaction.editReply({embeds: [embed]})
                    return;

                }
            
                if (targetItem.quantity < quantity) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: ${itemName} is not in possession`)
                        .setDescription(`You only have ${targetItem.quantity} of ${itemName}. You can't place ${quantity} for auction.`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
                let actionstatement = ""

                const newPost = new GlobalMarketPost();
                newPost.userId = user.userId;
                (time > 24) ? newPost.saleEnd = 24 : newPost.saleEnd = time;
                (time > 24) ? actionstatement = "\n\nSale time was reduced to 24h, cannot auction an item for longer then a day." : actionstatement = "";
                
                newPost.quantity = quantity;
                newPost.saleTimeStamp = new Date();
                console.log(newPost.saleTimeStamp)
                newPost.price = bid;
                newPost.bidItem = targetItem.name;
                newPost.bidUser = interaction.user.username;
                newPost.bids = [];
            
                // Reduce item quantity or remove from inventory
                if (targetItem.quantity === quantity) {
                    if (targetEquipment) userInventory.equipment.remove(targetEquipment._id) && (newPost.onModel = "Equipment");
                    if (targetUsable) userInventory.usables.remove(targetUsable._id) && (newPost.onModel = "Usable");
                    if (targetMaterial) userInventory.materials.remove(targetMaterial._id) && (newPost.onModel = "Material");
                    if (targetBook) userInventory.recipeBooks.remove(targetBook._id) && (newPost.onModel = "RecipeBook");
                    targetItem.userId = "A" + user.userId;
                    newPost.item = targetItem._id;
                    await targetItem.save()
                } else {
                    targetItem.quantity -= quantity;
                    await targetItem.save();

                    const newItemData = {...targetItem._doc};  // _doc gives you the properties of the mongoose document
                    
                    newItemData.userId = "A" + user.userId;
                    delete newItemData._id;  // Remove the _id so mongoose will generate a new one

                    if (targetEquipment) {
                        newPost.onModel = "Equipment";
                        const newItem = new Equipment(newItemData);
                        newItem.quantity = quantity;
                        await newItem.save();
                        newPost.item = newItem._id;
                    }
                    if (targetUsable) {
                        newPost.onModel = "Usable";
                        const newItem = new Usables(newItemData);
                        newItem.quantity = quantity;
                        await newItem.save();
                        newPost.item = newItem._id;
                    }
                    if (targetMaterial) {
                        newPost.onModel = "Material";
                        const newItem = new Materials(newItemData);
                        newItem.quantity = quantity;
                        await newItem.save();
                        newPost.item = newItem._id;
                    }
                    if (targetBook) {
                        newPost.onModel = "RecipeBook";
                        const newItem = new RecipeBooks(newItemData);
                        newItem.quantity = quantity;
                        await newItem.save();
                        newPost.item = newItem._id;
                    }
                }
                
                await newPost.save();
            
                await user.save();
                await userInventory.save();
            
                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Auction Reciept: Inputted your item for sale.`)
                    .setDescription(`Successfully created an auction for x ${quantity} of ${newPost.bidItem}. Starting bid is ${bid} Doros and time limit is ${time} hours.${actionstatement}`)
                interaction.editReply({embeds: [embed]});

            }else if (action === "bid"){
                if(!itemName){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Invalid Item Input`)
                        .setDescription(`Please specify the item which you would like to bid for`)
                    interaction.editReply({embeds: [embed]})
                    return;
                }
                if(!bidUser){
                    const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(`Error: Invalid User Input`)
                    .setDescription(`Please specify the owner of the auction which you want to bid for alongside the item (not display name but tag)`)
                interaction.editReply({embeds: [embed]})
                    return;
                }

                
                const targetBid = await GlobalMarketPost.findOne({bidItem: itemName, bidUser: bidUser})
                

                if(!targetBid){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Post')
                            .setDescription(`The post ('${itemName}') you are trying to bid for does not exist within Dauntless`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                if(targetBid.userId === user.userId){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid IQ')
                            .setDescription(`You cannot bid for your own item dumbass`)
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                if(user.balance<bid){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Know your worth')
                            .setDescription(`You don't have enough balance to bid for ${itemName}. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                if(bid<1){
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Amount')
                        .setDescription("Bid is too low, don't play with me bitch")
                        .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                    interaction.editReply({embeds: [embed]})
                    return;
                }
                


                const currentTime = new Date();

                // Calculate the difference in milliseconds between now and when the post was created
                const timePassedSincePost = currentTime - targetBid.saleTimeStamp;

                // Calculate the duration the post should be active in milliseconds
                const auctionDurationInMilliseconds = targetBid.saleEnd * 60 * 60 * 1000;

                // Check if the post has expired
                if (timePassedSincePost > auctionDurationInMilliseconds) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Sale Expired')
                        .setDescription("This sale has already ended, apologies and thank you for your participation in the auction. Please participate again in the future")
                    interaction.editReply({embeds: [embed]})
                    return;
                }

                let highestBid = 0;
                if(!targetBid.bids){
                    targetBid.bids = [];
                }

                if (targetBid.bids.length > 0) {
                    highestBid = Math.max(...targetBid.bids.map(bid => bid.bid));
                }
                else{
                    highestBid = targetBid.price;
                }
                console.log(highestBid)

                if(bid <= highestBid + 49){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Know your worth')
                            .setDescription(`You must bid atleast 50 doros higher than the previous highest bid in order to participate. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                targetBid.bids.push({userId: interaction.user.id, bid: bid, bidTimeStamp: new Date()})
                await targetBid.save();
                
                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Auction Reciept: Succesfull Bid.`)
                    .setDescription(`Successfully bid ${bid} doros for ${itemName}. This balance will be deposited and stored with the auction house until the auction is completed. Note: If your balance does not support the bid you placed when the auction ends, you will go into debt.`)
                interaction.editReply({embeds: [embed]});

            }
        } catch (error) {
            console.log(`Error in /auction: ${error}`);
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Error: Auction could not be accessed`)
                .setDescription(`Auction could not be accessed, report to the developer`)
            interaction.editReply({embeds: [embed]})
            return;
        }
    }
};
