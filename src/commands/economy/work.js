const { Client, Interaction, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder, TextInputBuilder, TextInputStyle, ModalBuilder} = require('discord.js');
const { checkLevelUp } = require('../../utils/xpUtils');
const User = require('../../models/user');
const Equipment = require('../../models/equipment');
const Usables = require('../../models/usable');
const Inventory = require('../../models/inventory');
const Bank = require('../../models/bank');
const Effect = require('../../models/effect');
const Title = require('../../models/title');
const sharp = require('sharp');


const office = ["You spilled your coffee on your manager's clothes, but barely managed to avoid getting fired by licking his shoes clean. You earned",
                "You got into a fist fight with your colleague today and embarassingly lost, but because you were left shamed with you underwear flipped over your trousers, your workplace pitied you and only fired your colleague. You made",
                "You did an exceptionally good job today, but your manager stole all your achievements in front of the higher ups. You beat him to a pulp and spit on his face for this insane insult to your pride, thus protecting your honor. Your work-crush saw this and was impressed by your strength and you guys got married. Then, you woke up, having realized it was all a grand dream and your boss had still stolen your achievements, you decided to... go home. Atleast you earned",
                "You made some coffee today and decided to do absolutely nothing at work, somehow you wern't caught and still made",
                "You decided to goof off and played cards with your friends all day at work, despite the constant nagging of your teammate, you wern't caught and still made",
                "You mistakenly forwarded a shit-talking email about your boss to everyone in the office. In a desperate attempt to make up for it, you organized an impromptu karaoke session in the conference room. Your boss, surprisingly, belted out an unforgettable rendition of 'Baka Mitai'. The singing was so bad that people started getting dizzy, and no one remembered the email. Miraculously, you still earned",
                "You tried to fix the office printer by following a DIY video on YouTube. Unfortunately, you ended up turning it into a bubble machine (You're fucking stupid). Everyone enjoyed the unexpected bubble party, though. Good vibes all around and you got away with it (how tf). At the end of the day, you earned",
                "You started a petition to have 'Nap Time' after lunch, thinking it would be a joke. To your surprise, it gained massive support. The management is now considering it, and colleagues are praising your 'innovative' approach to productivity. You may have changed office culture forever. Today, you earned",
                "In a bid to lighten the mood, you replaced the regular office muzak with recordings of shitting sounds and forest ambiance. Your boss walked in, took a deep breath, and commented on the 'refreshing atmosphere'. Unexpected win! You made",
                "During lunch, you accidentally mixed up your meal with your boss's super spicy Thai food. Watching him tear up and sniffle during the post-lunch meeting was a scene. However, he seemed to appreciate the unexpected flavor kick. At the end of the day, you made",
                "You brought your pet parrot to work, thinking it's 'Bring Your Pet to Work Day'. Turns out, that's next month. However, the parrot charmed everyone by mimicking the ringtone of every phone in the office. People loved it, and you, for a change, felt like the cool colleague. You earned",
                "You turned the office storage room into a makeshift cinema and invited a few colleagues for a 'secret' movie session. Halfway through, the boss walked in. You thought you were doomed, but he just asked if he could join. It became the highlight of everyone's day. Despite the goof-off, you still made",
                "Attempting to make a grand entrance, you tried to skateboard into a meeting room. You fell flat on your face, but the laughter it generated broke the ice for what was supposed to be a tense meeting. They say humor is invaluable, and today, you earned",
                "You started a wild rumor that a famous celebrity was visiting the office. It was all fun and games until local news showed up. Instead of admitting the joke, you gave an 'exclusive' interview about the office's work culture. Somehow, the spotlight worked in favor, and you made",
                "Instead of the usual PowerPoint presentation, you decided to perform an interpretive dance summarizing the quarterly reports. People were confused, amused, but most importantly, they were engaged. It was unorthodox, but you might have started a trend. For your creative approach, you earned",
                "You accidentally used the boss's mug for your morning coffee. In panic, you painted a replica yourself. To your surprise, he complimented the 'new' design. Perhaps you missed your calling as an artist. Either way, you made",
                "The Wi-Fi went down, and while waiting for IT, you started a game of charades. Soon, half the office joined. By the time the net was back up, everyone was in splits and the workday was almost over. Not the most productive day, but surely memorable. And yes, you still earned",
                "During a boring meeting, you slipped into a fantasy where you were a knight, defending the office from dragons. When asked for your input, you described your valiant battle. There was a moment of silence, then applause from people who pitied you (what a dumbass). Your shit storytelling somehow saved the day and you made",
                "You mistook the HR room for a bathroom. Not your best moment. However, you took this awkward situation and turned it into an advocacy for better signage. HR actually agreed. Today, you somehow earned",
                "You hosted an unplanned marshmallow-eating contest. Everyone was in, including the strict finance manager. Turns out, he's a marshmallow champ from his college days. You didn't win, but you definitely earned",
                "In an attempt to prove the strength of your office chair, you leaned back too far and tumbled. Everyone saw. Instead of being embarrassed, you turned it into a lesson on office safety. Dumbass! Today, you managed to earn",
                "You pitched an idea for 'Funky Hat Fridays'. Everyone laughed it off initially. But by Friday, half the office was donning eccentric hats. Your quirky idea became a hit. For your fashion-forward thinking, you earned",
                "You tried to be a good Samaritan by watering the office plants. Turns out, they were all artificial. Your deed didn't go unnoticed as everyone had a good laugh. Maybe not the hero move you intended, but for bringing joy, you made",
                "You set your ringtone to the sound of a typewriter. Each time you received a message, it sounded like you were hard at work. No one caught on, and you had a relaxed day. Today, for your sheer ingenuity, you made",
                "You started a whisper campaign that there was hidden treasure in the office. By noon, people were looking under desks and checking behind paintings. It was all in good fun, and while no treasure was found, the adventurous spirit was rewarding. Today, for your playful mischief, you earned",
                "In an attempt to rebel, you stole 7 coffee mugs from your workplace. Literally no one noticed and you got away with it. To this day, the echo of you bragging about your achievement can be heard throughout the hallways. You earned"]

const contract = ["You were hired to redesign a website for a company that still believed neon green text on a purple background was the peak of modern design. After saving their online reputation, you were rewarded with",
                  "You accepted a contract to organize a conference for people who believe the earth is shaped like a taco. Weirdly enough, it was a hit, and your unique event management skills landed you",
                  "A local businessman hired you to teach him how to use PowerPoint. Two hours in, you realized he was still struggling with turning on his computer. Your patience (and almost acted upon intrusive thoughts) earned you",
                  "You were contracted to write the biography of a woman who claimed she had been abducted by aliens... twice. Her tales about zuck were out of this world, and so was your compensation of",
                  "You took a gig creating logos for a man who wanted to start a business selling sand... to desert-dwellers. Surprisingly, business was booming, and for your contribution, you received",
                  "Someone needed a PR campaign for their new invention: edible socks. They tasted salty but made for a great story. You managed to get them a spot on a local talk show and made a cushy",
                  "You got a freelance job to tutor a teenager in history. Halfway through, you discovered his 'textbook' was just a pile of berserk manga volumes. To no surprise, he aced his exams, and went on to become a famous philosopher. His grateful parents handed you",
                  "You got a freelance job to tutor a teenager in philosophy. Halfway through, you discovered his 'textbook' was just him playing persona 5. To no surprise, he failed his exams, and went on to become homeless. Somehow you were still paid",
                  "A bakery contracted you to help them go viral. They thought that meant putting their pastries in a vial. After a quick social media lesson and some 'viral' pastries, you walked away with",
                  "You were hired to manage the social media for a guy who believed hashtags were something you ate with corned beef. After setting him straight and trending his business, your account grew by",
                  "An author needed your help to ghostwrite a book about her life as a psychic. You jokingly said you'd predicted she'd hire you. She didn't get the joke, but still, your bad joke got you",
                  "You landed a contract to paint a mural for a vegan gym - they wanted a broccoli lifting weights. Though you questioned the concept, you gave it your all. Your shitty masterpiece netted you",
                  "A startup hired you to create a jingle for their product: waterproof socks. You penned a catchy tune, 'For feet that rock and never get wet shocks.' The CEO loved it so much he gave you",
                  "You were recruited to set up Wi-Fi for a senior center. It took three days to explain that Wi-Fi wasn't a new kind of pie. After two assaults and one attempted manslaughter, you were fired. Luckily you still got",
                  "A tech firm needed you to design a logo for their new product: the iStone (it was literally just a rock). You delivered a minimalistic masterpiece and the cavemen, err, board members gave you",
                  "An artist contracted you to make a documentary about his work - which was primarily creating sculptures out of expired milk. The smell was horrific, but the story was oddly captivating. For your resilient nostrils and work, you were rewarded",
                  "A local farmer hired you to design a website for his chickens who apparently also served as models. You created a top-notch poultry portfolio and were clucked...err...clicked a payment of",
                  "You were hired to choreograph a dance for a flash mob proposal at a local fast-food joint. The bride-to-be said no, but the video went viral for being a shit designer (no wonder the bride said no). Your moves were so bad, but you still received",
                  "A company wanted to launch scented shoes and needed your marketing expertise. You organized a 'sniff and tell' event and, shockingly, it was a hit! For making feet the talk of the town (intersting preferences), you bagged"]

const service = ["You were offered doros to say the N-Word. You claimed", 
                  "You worked as cheap labour and made ",
                  "You were hired as a spy for Dauntless for 3 days and made ",
                  "You knocked on doors as a salesman for Dauntless for 2 hours and made ",
                  "You married someone older than you, killed them, and inherited ",
                  "A nigerian prince gave you ",
                  "Your dad got rich and decided to give you ",
                  "The Dauntless government offered you a job that lasted 6 days before it became necessary to fire you. You made ",
                  "You find a crumpled up lottery ticket on the ground as you walk outside, and you realise that it was actually a winning card! It's not as much as you would've wanted, but you still got",
                  "You accept a job from a shady man in an alleyway to deliver an envelope to a building in a remote location. You were tempted to open it to check what it was, but you were told not to and you didn't want to risk it. After delivering the package a strange man wearing black sunglasses and a red tuxedo gave you",
                  "You get a job working as a chef at a fast food restaurant. Unfortunately, you were having a really bad day on your first day of the job, and completely mixed up the ingredients to someone's salad and you were fired on the spot before being paid. Thankfully, the person that received the salad was a professional chef who was looking for new ideas for dishes. Even though the salad was terrible, for inspiring him to create a new dish, he tipped you",
                  "You decide to look around the house, underneath the cushions of the couch and in places that you would never normally check, finding hundreds of coins! You found a total of",
                  "You apply to a no-experience-needed tutoring job as an English teacher for a foreign kid online. The pay wasn't very high for all of the time you spent teaching him, but you just kept on using Google Translate and it was enough for you to be a sufficient tutor. You were paid",
                  "You spend the evening placing bets on other people's brawls, and after a long stressful time of losing and gaining money, you finished with a profit of",
                  "You apply for a job at a local movie theatre as the person who sells popcorn and helps maintain the machine. It was a very busy day due to the new release of the Tales of Wing movie, so you didn't get a break. You were paid",
                  "You were informed that a relative who you never even knew existed had just passed away, and you were given a small amount of his inheritance in the mail. You recieved",
                  "You were paid to playtest a beta version of a new video game called 'Tales of Wing - King'. The game was extremely unbalanced, so you had to write a bunch of comments and feedback on it, but you didn't even no where to start with them because the game was so fundamentally flawed. You spent several hours critiquing it before you submitted your feedback. A lean man with straight black hair and glasses denied all of your criticism, but still begrudgingly gave you",
                  "You uploaded a video on YouTube that had major clickbait, but was actually just a stolen video from reddit, and received a decent amount of views. Youtube AdSense paid you",
                  "You joined a local band playing the triangle, and after an unforgettably shit performance at the town's fair, you were given a share of",
                  "You took on the challenging job of teaching elderly folks how to use the latest smartphones. After nearly killing one of them due to anger, you were fired. Luckily you still got",
                  "You rented out your room on a popular home-sharing platform for a weekend. You returned to find a hand-written thank-you note from a renowned author who had been your guest. She was in town secretly writing her next best-seller and your room had been her haven due to it's messiness she somehow found inspiratioin in. Alongside the note, you found",
                  "You took a job helping to hand-paint an elaborate community mural. The hours were long, and paint ended up in places you didn't even know you had. But, the community's gratitude was immense (even though you're terrible at painting), and your contribution to the town's post-apocolyptic aesthetics was well-compensated with",
                  "You spent a day as a human billboard, advertising the grand opening of 'Madame Wing's Exotic Hat Shop'. The costume was ridiculous and the sun was blazing, but passersby's smiles and giggles made the day fly by. At sunset, Madame Wing handed you",
                  "You signed up to be an extra in a local indie film. Expecting a minor role in the background, you were shocked when the director gave you a line. Though it was just three words, your surprise acting debut earned you",
                  "You became a dog walker for the day. Balancing 7 leashes, with dogs ranging from a tiny Chihuahua to a gigantic Great Dane, was no walk in the park. But, the joy of being surrounded by wagging tails and happy barks made up for it. Your adventure paid you",
                  "A local streamer was looking for someone to set the scene behind him during his live streams, and you were hired. Every so often, you'd waltz or tiptoe behind him, making funny faces or holding amusing props. His viewership doubled that day and he gratefully handed you",
                  "You were roped into a competitive duck-herding event. Never having heard of such a thing, you relied on wild gestures and loud quacks. The ducks were more confused than herded, but the audience was in stitches. For your unintended comedy act, you were rewarded ",
                  "A neighborhood kid paid you to stand guard outside his secret club's headquarters (aka his backyard treehouse) to ensure no 'uncool adults' would enter. You took your duty seriously, challenging every passerby with a password. The kid was pleased with your dedication and paid you",
                  "You took a one-day gig at a pop-up photo booth, making sure the props were in order and snapping pictures of people. From silly faces to dick pics, you captured them all. The grateful booth owner handed you",
                  "You spent an afternoon teaching tourists how to properly throw boomerangs at the local park. Two people were killed, one was injured, but the joy and laughter of the attempts made it a day to remember. For your 'expert' instruction, you earned",
                  "You were recruited by a tech startup for a day to be a 'professional button pusher' for their new app's live demo. You were nervous but managed to push the button flawlessly when needed. They were so pleased, they gave you",
                  "A magician in town hired you as an assistant for his street performance. You had no idea what you were doing and accidentally revealed a few of his tricks. Still, the crowd seemed to love the unintentional comedy despite your shit skills. The magician, seeing the silver lining, paid you"
]

const business = ["You started 'InstaGranny', a platform where old ladies shared their shittiest insults. Turns out, everyone loved the not-so granny grannies. Your profanity profits got you",
                  "You pitched 'Reusable Toilet Paper' on a business show. They laughed their asses off, but the joke gift market didn't. Wiping away the competition earned you",
                  "You bought a shipment of 'misprinted' pens. They all just wrote: 'Oops!'. Somehow, this became a hipster trend, and you sold them all. In the end, you raked in",
                  "Your consultancy on choosing which anime to watch next made a killing because people can't decide shit these days. Most people ended up watching my hero academia (booooo). Profiting off indecision, you earned",
                  "You rented out your forehead for ads. Now, job interviews suck with 'Eat At Joe's' inked on your face, but at least the stunt padded your wallet with",
                  "Your office-scented candles smelled like stale coffee and broken dreams. 'Eau de Unpaid Overtime' was strangely popular among the masochists, raking in",
                  "One-size-fits-none socks? Because screw logic. People loved the weird crap and your bank account thanked them with",
                  "Bottled city air? 'Deep Breath of Traffic Jam' was all the rage with those idiots. You couldn't believe the crap they'd buy. Cha-ching! You earned ",
                  "Helping people forget passwords was the dumbest genius move. Turns out, people love locking themselves out. This absurd gig got you ",
                  "'Mystery Boxes' of your junk. Some dumbass called it 'Vintage Air'. You laughed all the way to the bank with ",
                  "'How to Look Busy at Work' seminars? Employees ate that shit up. Thanks to corporate slackers, you pocketed ",
                  "A café where coffee beans were thrown at people. Some called it assault, others called it 'Organic Exfoliation'. Either way, those idiots netted you ",
                  "Your 'Photosynthesize Like a Plant' diet sold green lights and BS. Some vegans claimed they felt the chlorophyll. Idiots. You earned ",
                  "Grown-ups paying for nap time? Hell, they'd pay for anything if you called it 'rejuvenation therapy'. Your venture secured you ",
                  "An app that did nothing. Minimalism, my ass. But people loved 'Zen Screen' or some crap. Their stupidity? Your gain. You got away with",
                  "A delivery service for deliveries? Deliver-ception or just lazy-ass people? You didn't care. Doubling down, you made ",
                  "Your 'Corporate Ladder' workshop was an escalator. And those corporate dumbasses ate it up. Riding their gullibility, you cashed in",
                  "Selling empty boxes as 'DIY Kits'. Because anything with a high price is considered a premium item. They bought, you laughed, and your bank balance swelled by "
]

const { CaptchaGenerator } = require('captcha-canvas')

module.exports = {
  name: 'work',
  description: 'Earn money by working',
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      

      const query = { userId: interaction.user.id };
      const user2 = await User.findOne(query);

      if (!user2) {
        await interaction.deferReply();
        const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Error: Invalid User')
                    .setDescription("Well, you must be a new arrival. Register with the Dauntless Bank (/register) before interacting.")
                interaction.editReply({embeds: [embed]})
                return;
        return;
      }

      if (!user2.currentJob) {
        await interaction.deferReply();
        interaction.editReply('You must select a job first with /job command.');
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

      const energyEffect = await Effect.findOne({userId: interaction.user.id, effectedType: "Work"})
      const lastWorkTime = user2.lastWork;
      const currentTime = new Date();

      // Calculate the difference in milliseconds
      const timeDifference = currentTime - lastWorkTime;

      // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
      const fiveMinutesInMilliseconds = 5 * 60 * 1000;

      if (!energyEffect && user2.lastWork && timeDifference < fiveMinutesInMilliseconds) {
        await interaction.deferReply();
        const timeLeft = Math.round((fiveMinutesInMilliseconds - timeDifference) / 60000); // Convert the difference to minutes
        const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Halt: Time Restriction`)
                        .setDescription(`You need to wait \`${timeLeft} minute(s)\` before working again.`)
                    interaction.editReply({embeds: [embed]})
                    return;
      }

      const work = async () => {
        const query = { userId: interaction.user.id };
        const user = await User.findOne(query);
  
        const energyEffect = await Effect.findOne({userId: interaction.user.id, effectedType: "Work"})
        const lastWorkTime = user.lastWork;
        const currentTime = new Date();

        // Calculate the difference in milliseconds
        const timeDifference = currentTime - lastWorkTime;

        // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
        const fiveMinutesInMilliseconds = 5 * 60 * 1000;

        if (!energyEffect && user.lastWork && timeDifference < fiveMinutesInMilliseconds) {
          const timeLeft = Math.round((fiveMinutesInMilliseconds - timeDifference) / 60000); // Convert the difference to minutes
          const embed = new EmbedBuilder()
                          .setColor('Red')
                          .setTitle(`Halt: Time Restriction`)
                          .setDescription(`You need to wait \`${timeLeft} minute(s)\` before working again.`)
                      interaction.editReply({embeds: [embed]})
                      return;
        }

        user.lastWork = new Date();
          const userInventory = await Inventory.findOne({ userId: user.userId });
    
          if (!userInventory) {
              const embed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Error: Inventory does not exist')
                            .setDescription("Unable to find inventory, report error to the developer")
                        interaction.followUp({embeds: [embed]})
                        return;
              return;
          }
    
    
          let userLuck = user.luckBonus + user.luckLevel;
          let earning, bonus, xpAmount, xpType, randomMessage;
          switch (user.currentJob) {
            case 'office':
                earning = 35 + ((user.mentalityLevel + user.mentalityBonus) + (user.dexterityLevel + user.dexterityBonus));
                bonus = ((Math.floor(Math.random() * (user.mentalityLevel + user.mentalityBonus) * 3)));
                xpAmount = Math.floor(Math.random() * (11 + bonus)) + 10; 
                xpType = 'mentality';
                randomMessage = office;
                break;
            case 'contract':
                baseFee = 70 + ((user.strengthLevel + user.strengthLevel) + (user.laborLevel + user.laborBonus))
                if(userLuck > baseFee){
                  userLuck = baseFee;
                }
                earning = Math.floor((Math.random() * (baseFee + 1 - userLuck)) + userLuck);
                bonus = ((Math.floor(Math.random() * (user.strengthLevel + user.strengthBonus) * 2)));
                xpAmount = Math.floor(Math.random() * (11 + bonus)) + 10;
                xpType = 'strength';
                randomMessage = contract;
                break;
            case 'service':
                baseFee = 35 + ((user.dexterityLevel + user.dexterityBonus) + (user.laborLevel + user.laborBonus))
                if(userLuck > baseFee){
                  userLuck = baseFee;
                }
                earning = Math.floor(Math.random() * (baseFee + 1 - userLuck)) + 20 + userLuck;
                bonus = ((Math.floor(Math.random() * (user.laborLevel + user.laborBonus) * 2)));
                xpAmount = Math.floor(Math.random() * (11 + bonus)) + 10;
                xpType = ['labor', 'dexterity'][Math.floor(Math.random() * 2)];
                randomMessage = service;
                break;
            case 'business':
                baseFee = 90 + ((user.luckLevel + user.luckBonus) + (user.defenseLevel + user.defenseBonus))
                if(userLuck > baseFee){
                  userLuck = baseFee;
                }
                earning = Math.floor((Math.random() * (baseFee + 1 - userLuck)) + userLuck);
                bonus = ((Math.floor(Math.random() * (user.luckLevel + user.luckBonus) * 2)));
                randomMessage = business;
                break;
          }
    
          let itemName = "Tax Evasion";
          const targetItem = await Equipment.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true }) 
            || await Usables.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , market: true });
            
          if (!targetItem) {
            interaction.editReply(`Item: ${itemName} does not exist in the database`);
            return;
          }
          let tax = Math.floor((earning) * 0.20)
          let taxStatement = "";
          const existingItem = await Usables.findOne({ name: targetItem.name, userId: user.userId });
          if (existingItem) {
            user.balance += earning + bonus;
            taxStatement = "You also successfully evaded Dauntless Tax! Good job.";
          } else {
            user.balance += earning + bonus - tax;
            bank.balance += tax
            await bank.save();
            taxStatement = `Dauntless will charge a rounded 20% tax on these earnings (${tax} Doros)`
          }
          user[xpType + 'Xp'] += xpAmount;
          // Handle XP and Level logic
          const result = checkLevelUp(user[xpType + 'Xp'], user[xpType + 'Level'], user[xpType + 'Bonus']);
          user[xpType + 'Xp'] = result.xp;
          user[xpType + 'Level'] = result.level;
    
          await user.save();
          let xpStatement = ''
    
          //Title Assignment
          let titleAssignment = "";
          const newTitleMoneyBags = await Title.findOne({name: "Mr. Moneybags", userId: null})
    
          if (!newTitleMoneyBags) {
            const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Existing Registering Title')
                        .setDescription("An error occured, please report to the developer.")
                    interaction.followUp({embeds: [embed]})
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
              interaction.followUp({embeds: [embed]})
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
    
          if(user.currentJob !== 'business'){
            xpStatement = `You also aqcuired ${xpAmount} XP towards ${xpType.charAt(0).toUpperCase() + xpType.slice(1)}.`;
          }
    
          const embed = new EmbedBuilder()
              .setColor("Green")
              .setTitle('You made money... Legally??!')
              .setDescription(randomMessage[Math.floor(Math.random() * randomMessage.length)] +  ` ${earning} Doros (+ ${bonus} bonus Doros). ${xpStatement}${titleAssignment}\n\n${taxStatement} `)
    
          interaction.followUp({ embeds: [embed] });
      }

      if(!energyEffect){
          let solved = false;
          function generateRandomString(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
          }
          
          const captchaAnswer = (generateRandomString(3));
          console.log(captchaAnswer);
    
          const captcha = new CaptchaGenerator()
            .setDimension(150, 650)
            .setCaptcha({text: `${captchaAnswer}`, size: 60, color: "green"})
            .setDecoy({opacity: 0.5})
            .setTrace({color: "green"})
    
          const buffer = captcha.generateSync();
    
          const embedCaptcha = new EmbedBuilder()
              .setTitle(`Pre-work Verification!`)
              .setImage('attachment://captcha.png')
              .setDescription("Solve this short captcha before you can claim your rewards! (Stop letting tristan bot the bot).")
              .setColor('Blue')
              
              
          const capButton = new ActionRowBuilder()
              .addComponents(
                  new ButtonBuilder()
                  .setCustomId("capButton")
                  .setLabel("Enter Answer")
                  .setStyle(ButtonStyle.Success))
    
          const capModal = new ModalBuilder()
          .setTitle("Submit Answer")
          .setCustomId("capModal")
    
          const answer = new TextInputBuilder()
          .setCustomId("answer")
          .setLabel("What did you see?")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Enter Answer")
    
          const firstActionRow = new ActionRowBuilder().addComponents(answer)
    
          capModal.addComponents(firstActionRow)
          
          const initialReply = await interaction.reply({
              embeds: [embedCaptcha],
              components: [capButton],
              files: [{ attachment: buffer, name: 'captcha.png' }]
          });
    
          const filter = (i) => i.user.id === interaction.user.id; // replace 'YOUR_BUTTON_CUSTOM_ID' with the customId you set for your button
    
          
    
          const collector = initialReply.createMessageComponentCollector({filter, time: 360000});
          let errorAwait = false;
          collector.on('collect', async i => {
              if (i.customId === 'capButton'){
                  console.log("about to show modal")
                  
                  if(!errorAwait){
                    await i.showModal(capModal);
                    errorAwait = true;
                    const filterModal = (int) => int.user.id === interaction.user.id && int.isModalSubmit() && int.customId === 'capModal';
    
                    // Await the modal interaction with an increased timeout for testing
                    try {
                        
                        const modalInteraction = await i.awaitModalSubmit({ filter: filterModal, time: 360000, errors: ['time'] });
                        
                        const answered = modalInteraction.fields.getTextInputValue('answer');
  
                        modalInteraction.deferUpdate();
                        
                        if (!solved && answered.toLowerCase() === captchaAnswer.toLowerCase()) {
                          errorAwait = false;
                          solved = true;
                          currentClick = true;
                          const newEmbed = new EmbedBuilder()
                          .setTitle(`Pre-work Verification!`)
                          .setDescription("Solve this short captcha before you can claim your rewards! (Stop letting tristan bot the bot).\n\nStatus: Solved.")
                          .setColor('Green')
                                
                            await initialReply.edit({
                                embeds: [newEmbed],
                                components: [],
                                files: []
                            });
                            
                            work();
                        } else if(!solved) {
                          errorAwait = false;
                          currentClick = false
                            return interaction.followUp({content: "Wrong answer, try again!", ephemeral: true});
                            
                        }
                    } catch (error) {
                        console.log('User did not respond in time.', error);
                        const newEmbed = new EmbedBuilder()
                          .setTitle(`Pre-work Verification!`)
                          .setDescription("Solve this short captcha before you can claim your rewards! (Stop letting tristan bot the bot).\n\nStatus: Timed out.")
                          .setColor('Red')
                                
                            await initialReply.edit({
                                embeds: [newEmbed],
                                components: [],
                                files: []
                            });
                        
                        return interaction.followUp({content: "You timed out on the captcha / an error occured. Try again?", ephemeral: true});
                    }
                  }
                  else{
                    const newEmbed = new EmbedBuilder()
                      .setTitle(`Pre-work Verification!`)
                      .setDescription("Solve this short captcha before you can claim your rewards! (Stop letting tristan bot the bot).\n\nStatus: Error.")
                      .setColor('Red')
                            
                        await initialReply.edit({
                            embeds: [newEmbed],
                            components: [],
                            files: []
                        });
                    
                    return interaction.followUp({content: "A small error occured. Just use this command again and it should be fine. If this happens too many times, contact the developer.", ephemeral: true});
                  }
              }
          })
    
          collector.on('end', async i => {
            console.log(`collected end`)
            if(!solved){
              const newEmbed = new EmbedBuilder()
              .setTitle(`Pre-work Verification!`)
              .setDescription("Solve this short captcha before you can claim your rewards! (Stop letting tristan bot the bot).\n\nStatus: Timed out.")
              .setColor('Red')
                    
                await initialReply.edit({
                              embeds: [newEmbed],
                              components: [],
                              files: []
                          });
                      
                      return interaction.followUp({content: "You timed out on the captcha.", ephemeral: true});
            }
        })
      }
      else{
        const lastWorkTime = energyEffect.timeUsed;
        const currentTime = new Date();

        // Calculate the difference in milliseconds
        const energyDifference = currentTime - lastWorkTime;

        // 5 minutes in milliseconds is 5 * 60 * 1000 = 300000
        const fiveMinutesInMilliseconds = 1 * 60 * 1000;

        const timeLeft = Math.round((fiveMinutesInMilliseconds - energyDifference) / 60000);
        const embedCaptcha = new EmbedBuilder()
              .setTitle(`Energy Effect: Bypass Captcha`)
              .setDescription(`Energy Effect: Skipping the captcha sequence due to the energy effect. Time remaining: \`${timeLeft} minute(s)\` `)
              .setColor('Blue')
              
          const initialReply = await interaction.reply({
              embeds: [embedCaptcha],
          });

        work();
      }

      

      
    } catch (error) {
      console.log(`Error with /work: ${error}`);
      const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`Error: /Work could not be accessed`)
                        .setDescription(`/Work could not be accessed, report to the developer`)
                    interaction.editReply({embeds: [embed]})
                    return;
    }
  },
};
