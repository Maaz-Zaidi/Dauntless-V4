const { Client, Interaction,  EmbedBuilder, ApplicationCommandOptionType} = require('discord.js');
const User = require('../../models/user');
const Bank = require('../../models/bank');
const GlobalMessagePost = require('../../models/globalMessagePost');
const { formatDate } = require('../../utils/formatDate');

module.exports = {
    name: 'message',
    description: 'Displays global message board (higher prioritity for higher payments)',
    options: [
        {
            name: 'action',
            type: ApplicationCommandOptionType.String,
            description: 'Auction House action to perform. ',
            choices: [
                { name: 'View Message Board', value: 'view' },
                { name: 'Post Message', value: 'post' },
            ],
            required: true,
        },
        {
            name: 'title',
            type: ApplicationCommandOptionType.String,
            description: 'Set message title (max 40 characters)',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'post',
            type: ApplicationCommandOptionType.String,
            description: 'Set message content (max 250 characters)',
            required: false  // It's not required for the 'view' action
        },
        {
            name: 'payment',
            type: ApplicationCommandOptionType.Integer,
            description: 'Specify payment amount to the dauntless bank to post this message',
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

            const query = { userId: interaction.user.id };
            const user = await User.findOne(query);

            const action = interaction.options.getString('action');
            const title = interaction.options.getString('title');
            const post = interaction.options.getString('post');
            const payment = interaction.options.getInteger('payment') || 1;

            if (!user) {
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
            }

            if(action === "view"){
                const allPosts = await GlobalMessagePost.find();

                // Sort the posts based on the payment value in descending order
                allPosts.sort((a, b) => b.price - a.price); 

                let page = 0;
                const itemsPerPage = 5;
    
                const generateEmbed = (start) => {  // Note the addition of async here
                    const current = allPosts.slice(start, start + itemsPerPage);
                    const embed = new EmbedBuilder()
                        .setColor("Purple")
                        .setTitle('Global Message Board')
                        .setDescription("View all posted messages. You can create your own with /message post and add a title/description. The more you pay for your message the greater priority it will get in terms of visibility.")
                        .setFooter({ text: `Page ${start / itemsPerPage + 1} of ${Math.ceil(allPosts.length / itemsPerPage)}` });
                
                    let itemHighestBid = "";
                    let itemPoster = "";
                
                    if (allPosts.length !== 0) {
                        current.forEach(async item => {  
                            itemHighestBid = "";
                            itemPoster = "";
                            
                            const title = `${item.title} \`(${formatDate(item.postDate)})\``;
                            const message = `${item.message}`;
                            const payment = `${item.price} Doros`;
                
                            // Fetching the poster's username through the user ID
                            try {
                                const user = await client.users.fetch(item.userId);  // This line needs await, hence why we need async function and a for...of loop
                                itemPoster = `${user.displayName}`;
                            } catch (err) {
                                console.error(`Failed to fetch user with ID: ${item.userId}`);
                                itemPoster = `Unknown User`;
                            }
                
                            const poster = itemPoster;
                            embed.addFields({ name: title, value: `\`\`\`${message}\`\`\`\nPosted by: \`${poster}\`\nPayment: \`${payment}\`` });
                        });
                    }
                    else{
                        embed.setDescription("View all posted messages. You can create your own with /message post and add a title/description. The more you pay for your message the greater priority it will get in terms of visibility.\n\n**No Messages Yet**")
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
            }else if (action === "post"){
                if(!title){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Title')
                            .setDescription("Please specify a title in order to post a message")
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                if(title.length > 40){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Title Size')
                            .setDescription("Your title length is too long, please maintain it to 40 characters maximum.")
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                if(!post){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Content')
                            .setDescription("Please specify the content in order to post a message")
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                if(post.length > 250){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Invalid Content Size')
                            .setDescription("Your post length is too long, please maintain it to 250 characters maximum.")
                        interaction.editReply({embeds: [embed]})
                        return;
                }
                
                if(payment < 1){
                    const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: If you\'re broke just say that')
                            .setDescription(`You're payment value is too little. Go back to work slave`)
                            .setThumbnail('https://preview.redd.it/can-new-system-manhwas-implement-the-feature-of-hologram-v0-pykd456v3w2a1.png?auto=webp&s=81620a1306e7b8e9a23b32df087502a0f6da4d8e')
                        interaction.editReply({embeds: [embed]})
                        return;
                }

                const newPost = new GlobalMessagePost({
                    userId: user.userId,
                    title: title,
                    message: post,
                    price: payment
                })

                await newPost.save();
                
                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Message Posted Successfully`)
                    .setDescription(`Scuessfully posted the message: *'${title}'* for a ${payment} Doros`)
                interaction.editReply({embeds: [embed]});

            }
        } catch (error) {
            console.log(`Error in message board: ${error}`);
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: Message Board could not be accessed`)
                        .setDescription(`Message Board could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
        }
    }
};
