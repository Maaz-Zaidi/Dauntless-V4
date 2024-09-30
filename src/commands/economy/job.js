const { Client, Interaction, ApplicationCommandOptionType, EmbedBuilder  } = require('discord.js');
const User = require('../../models/user');

module.exports = {
  name: 'job',
  description: 'Select your job type',
  options: [
    {
      name: 'type',
      type: ApplicationCommandOptionType.String,
      description: 'Type of the job you want to select',
      choices: [
        { name: 'Office', value: 'office' },
        { name: 'Contract', value: 'contract' },
        { name: 'Service', value: 'service' },
        { name: 'Business', value: 'business' }
      ],
      required: true,
    }
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

      if (!user) {
        const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
        return;
      }

      user.currentJob = interaction.options.getString('type');
      await user.save();
      
      const embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle(`Job Type Update`)
          .setDescription(`You've successfully selected the ${user.currentJob} job.`);
      interaction.editReply({embeds: [embed]});
    } catch (error) {
      console.log(`Error with /job: ${error}`);
      const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Job could not be accessed`)
                        .setDescription(`/Job could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
    }
  },
};
