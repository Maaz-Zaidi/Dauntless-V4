require('dotenv').config();
const { Client, IntentsBitField, Events,  } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const presetData = require('./presetData');
const marketPresetData = require('./marketPresetData');
const craftingPresetData  = require('./craftingPresetData');
const stockPresetData = require('./stockPresetData');
const equipmentPresetData = require('./equipmentPresetData');
const serverPresetData = require('./serverPresetData');
const spellPresetData = require('./spellPresetData');
const titlePresetData = require('./titlePresetData');
const newPresetData = require('./1newPresets');

const scripts = require('./scripts');

const User = require('./models/user');
const Bank = require('./models/bank');
const GlobalMarketPost = require('./models/globalMarketPost');
const Equipment = require('./models/equipment');
const Materials = require('./models/material');
const Usables = require('./models/usable');
const RecipeBooks = require('./models/recipeBook');
const Stock = require('./models/stock');
const Spell = require('./models/spell');
const Inventory = require('./models/inventory');
const findCorruptedItems = require('./findCurruptedItems');

process.on('uncaughtException', (err) => {
    require('fs').appendFileSync('error_log.txt', `${new Date().toISOString()} - Uncaught exception: ${err}\n`);
  });
  
process.on('unhandledRejection', (reason, p) => {
    require('fs').appendFileSync('error_log.txt', `${new Date().toISOString()} - Unhandled rejection at: Promise ${p} reason: ${reason}\n`);
  });

  process.on('DiscordAPIError', (err) => {
    require('fs').appendFileSync('error_log.txt', `${new Date().toISOString()} - Uncaught exception: ${err}\n`);
  });

const client = new Client({
  intents: 32767
  // [
  //   IntentsBitField.Flags.Guilds,
  //   IntentsBitField.Flags.GuildMembers,
  //   IntentsBitField.Flags.GuildMessages,
  //   IntentsBitField.Flags.GuildPresences,
  //   IntentsBitField.Flags.MessageContent,
  // ],
});

const events = [
    { name: "Tech Boom", value: 0.05 },
    { name: "Economic Crash", value: -0.05 },
    { name: "New Regulations", value: -0.03 },
    { name: "Breakthrough in Research", value: 0.08 },
    { name: "Company Scandal", value: -0.10 },
    { name: "Strong Quarterly Report", value: 0.04 },
    { name: "Product Recall", value: -0.04 },
    { name: "Major Acquisition", value: 0.03 },
    { name: "Lawsuit Filed", value: -0.02 },
    { name: "Competitor Bankruptcy", value: 0.06 }
];

let updateCounter = 0;

async function updateStockPrices() {
    try {
        const UPPER_THRESHOLD = 4950;
        const LOWER_THRESHOLD = 735;
        const stocks = await Stock.find({ userId: null });

        let event = null;
        updateCounter++;
        if (updateCounter % 10 === 0) {
            event = events[Math.floor(Math.random() * events.length)];
        }

        for (const stock of stocks) {
            let randomChange;
            
            if (stock.price < LOWER_THRESHOLD) {
                randomChange = Math.round(0.004 * stock.price + ((Math.random() - 0.2) * 9)); // Higher chance to recover
            } else if (stock.price > UPPER_THRESHOLD) {
                randomChange = -Math.round(0.003 * stock.price + ((Math.random() - 0.2) * 9)); // Higher chance to decrease
            } else {
                randomChange = Math.round((Math.random() - 0.51) * 18); // Average change between -9 to +9
            }
        
            if (event) {
                let eventEffect = Math.round(event.value * stock.price);
        
                // Cap the event effect to avoid extreme swings
                eventEffect = Math.max(-50, Math.min(50, eventEffect));
        
                randomChange += eventEffect;
            }
        
            const newPrice = Math.round(stock.price + randomChange);
            let change = (randomChange > 0) ? `+${randomChange} Doros Increase` : `${randomChange} Doros Decrease`;
            
            if (randomChange === 0) change = "Stagnant";
        
            // Update history
            stock.history.push(newPrice);
            if (stock.history.length > 10) {
                stock.history.shift();
            }
        
            stock.price = newPrice;
            stock.change = change;
            await stock.save();
        }

        if (event) {
            const bank = await Bank.findOne({name: "Dauntless"});
            bank.event = event.name;
            console.log(`event: ${event.name}`)
            await bank.save();
        }

        console.log("\nSuccessfully updated stock market " + new Date());
    } catch (error) {
        console.error("\nError updating stock prices: ", error);
    }
}

async function updateAuctionHouse(){

  console.log("\nUpdating auction market " + new Date());
  const allPosts = await GlobalMarketPost.find();
  const currentTime = new Date();
            
  for (let post of allPosts) {
      // Convert saleEnd from hours to milliseconds and add to saleTimeStamp
      const timePassedSincePost = currentTime - post.saleTimeStamp;
      const auctionDurationInMilliseconds = post.saleEnd * 60 * 60 * 1000;
      
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
              const winnerInventory = await Inventory.findOne({userId: post.userId})
              console.log(`Post for item ${post.bidItem} has ended. No bids were placed.`);
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
                  console.log(post.item._id);
                  bidItem.userId = post.userId;
                  
                  if(post.onModel === "Equipment"){
                      winnerInventory.equipment.push(newItem._id);
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

(async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB.');

    // await presetData();
    // await marketPresetData();
    // await craftingPresetData();
    // await stockPresetData();
    // await equipmentPresetData();
    // await serverPresetData();
    // await spellPresetData();
    // await titlePresetData();
    // await newPresetData();

    //Scripts for Updates:
    // await scripts();

    //await findCorruptedItems();

    eventHandler(client);

    client.login(process.env.TOKEN);

    await updateStockPrices(); // Call it once upon startup
    setInterval(updateStockPrices, 5 * 60 * 1000); // Update every 5 minutes

    await updateAuctionHouse(); // Call it once upon startup
    setInterval(updateAuctionHouse, 60 * 60 * 1000); // Update every 60 minutes
  } catch (error) {
    console.log(`Error: ${error}`);
  }
})();

