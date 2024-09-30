const User = require('./models/user');

async function addBalanceHistoryToExistingUsers() {
    const usersWithoutHistory = await User.find({ balanceHistory: { $exists: false } });

    const updatePromises = usersWithoutHistory.map(user => {
        user.balanceHistory = [];
        return user.save();
    });

    await Promise.all(updatePromises);
    console.log("Updated all users!");
}

// addBalanceHistoryToExistingUsers();
