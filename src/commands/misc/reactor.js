module.exports = {
    name: 'reactor',
    description: 'reply to this (test function)',
  
    callback: async (client, interaction) => {
      const message = await interaction.reply({
              content: `react here!`,
              fetchReply: true, 
  
          });
  
          const filter = (reaction, user) => {
              return user.id === interaction.user.id
          };
  
        //   message
        //       .awaitReactions({filter, max: 4, time: 10000, errors: ["time"]})
        //       .then((collected) => console.log(collected.size))
        //       .catch((collected) => {
        //           console.group(`after a minute,  only ${collected.size} out of 4 reacted`);
        //       });

        const collector = message.createReactionCollector({filter, time: 10000})

        collector.on('collect', (reaction, user) => {
            console.log(`colleected`)
        });

        collector.on('end', collected => {
            console.log(`collected end`)
        })
    },
  };