const { Client, Interaction, EmbedBuilder } = require('discord.js');
const User = require('../../models/user');
const Inventory = require('../../models/inventory'); // Import the Inventory model
const ForgingTable = require('../../models/forgingTable');
const Title = require('../../models/title');

module.exports = {
  name: 'register',
  description: 'Register with the Dauntless Bank.',
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
        interaction.reply({
          content: 'You can only run this command inside a server.',
          ephemeral: true,
        });
        return;
    }
    try {
      await interaction.deferReply();

      const query = { userId: interaction.member.id };

      let user = await User.findOne(query);

      if (user) {
        const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Existing User')
                    .setDescription("You are already registered with the Dauntless Bank.")
                interaction.editReply({embeds: [embed]})
                return;
      }

      const newTitle = await Title.findOne({name: "New Adventurer", userId: null})

      if (!newTitle) {
        const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Existing Registering Title')
                    .setDescription("An error occured, please report to the developer.")
                interaction.editReply({embeds: [embed]})
                return;
      }

      const newItemData = {...newTitle._doc};  // _doc gives you the properties of the mongoose document
                            
      newItemData.userId = interaction.member.id;
      delete newItemData._id;  // Remove the _id so mongoose will generate a new one

      const newItem = new Title(newItemData);
      await newItem.save();

      // Create a new Inventory for the user
      const newInventory = new Inventory({
        userId: interaction.member.id,
        equipment: [],
        usables: [],
        materials: [],
        spells: [],
        stocks: [],
        recipeBooks: [],
        titles: [],
      });

      newInventory.titles.push(newItem._id)

      const newTable = new ForgingTable({
        userId: interaction.member.id,
        materials: [],
      });

      await newTable.save(); 
      await newInventory.save(); // Save the inventory to the database

      user = new User({
        ...query,
        inventory: newInventory._id,  // Link the new user to their inventory
        table: newTable._id,
      });
      
      await user.save(); // Save the user to the database with their new inventory

      const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle(`Registered Successfully`)
                    .setDescription(`You successfully registered with the Bank and were given the title "New Adventurer", equip it for bonus stats. Welcome to dauntless ~`)
                interaction.editReply({embeds: [embed]});
    } catch (error) {
      console.log(`Error with /register: ${error}`);
      const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Register could not be accessed`)
                        .setDescription(`/Register could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
    }
  },
};
