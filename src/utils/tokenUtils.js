function getTotalTokens(stamina) {
  return 2 + Math.floor(stamina / 100);
}

module.exports = {
    getTotalTokens
};