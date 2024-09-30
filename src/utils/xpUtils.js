const BASE_XP = 100;

function checkLevelUp(currentXp, currentLevel, bonusLevel) {
    // Function to calculate required XP for a given level
    function calculateRequiredXp(level) {
        let requiredXp = BASE_XP;
        for (let i = 1; i < level + bonusLevel; i++) {
            requiredXp += requiredXp / 5;
        }
        return requiredXp += requiredXp / 5;
    }

    // Check for level-up (positive XP overflow)
    let requiredXp = calculateRequiredXp(currentLevel);
    while (currentXp >= requiredXp) {
        currentXp -= requiredXp; // Reset XP
        currentLevel++; // Increase level

        // Recalculate the XP required for the new level
        requiredXp = calculateRequiredXp(currentLevel);
    }

    // Check for level-down (negative XP)
    while (currentXp < 0 && currentLevel > 0) {
        currentLevel--; // Decrease level

        if (currentLevel <= 0) {
            // Reset level and XP to 0 if current level is going below 0
            currentLevel = 0;
            currentXp = 0;
            break;
        }

        // Get the XP required for the previous level to subtract it from the current XP
        requiredXp = calculateRequiredXp(currentLevel);
        currentXp += requiredXp;
    }

    return {
        xp: Math.floor(currentXp),
        level: currentLevel,
    };
}

module.exports = {
    checkLevelUp
};
