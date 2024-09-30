const BASE_XP = 100;

function checkLevelRequired(currentLevel, currentXp) {
  let requiredXp = BASE_XP;

  requiredXp = BASE_XP;
    for (let i = 1; i < currentLevel; i++) {
      requiredXp += requiredXp / 5;
    }

  return Math.ceil(requiredXp += requiredXp / 5);
}

module.exports = {
  checkLevelRequired
};