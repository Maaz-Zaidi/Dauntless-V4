const mongoose = require('mongoose');
const collections = [
    'banks',
    'effects',
    'equipment',
    'globalmarketposts',
    'inventories',
    'materials',
    'monsters',
    'quests',
    'recipebooks',
    'spells',
    'recipes',
    'stealhistories',
    'stocks',
    'tables',
    'titles',
    'usables',
    'users'
];

async function addBalanceHistoryToExistingUsers() {
    const usersWithoutHistory = await User.find({ balanceHistory: { $exists: false } });

    const updatePromises = usersWithoutHistory.map(user => {
        user.balanceHistory = [];
        return user.save();
    });

    await Promise.all(updatePromises);
    console.log("Updated all users!");
}

async function replaceUserId(oldId, newId) {
    const updatePromises = collections.map(async (collectionName) => {
        const Collection = mongoose.model(collectionName, new mongoose.Schema({}, { strict: false, collection: collectionName }));
        const result = await Collection.updateMany(
            { userId: oldId }, // Filter for userId
            { $set: { userId: newId } } // Replace with newId
        );
        console.log(`Updated ${result.modifiedCount} documents in ${collectionName}`);
    });

    await Promise.all(updatePromises);

    console.log("All applicable userIds updated!");
    mongoose.connection.close();
}

// replaceUserId("mystermysterymanTemp1", "forgotten");

// addBalanceHistoryToExistingUsers();
