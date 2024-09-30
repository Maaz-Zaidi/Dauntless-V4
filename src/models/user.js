const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  inventoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  tableId: {
    type: Schema.Types.ObjectId,
    ref: 'Table'
  },
  balance: {
    type: Number,
    default: 0,
  },
  balanceHistory: [Number],
  lastDaily: {
    type: Date,
    default: null,
  },
  lastWork: {
    type: Date,
    default: null,
  },
  lastSlot: {
    type: Date,
    default: null,
  },
  lastDice: {
    type: Date,
    default: null,
  },

  title: {
    type: Schema.Types.ObjectId,
    ref: 'Title'
  },

  //hunt items
  lastHunt: {
    type: Date,
    default: null,
  },
  huntTokens: {
    type: Number,
    default: 0,
  },
  huntAttempts: {
    type: Number,
    default: 0,
  },

  lastSteal: {
    type: Date,
    default: null,
  },

  lastLottery: {
    type: Date,
    default: null,
  },

  //passives
  passiveSlot1: {
    type: String,
    default: "",
    reqired: true,
  },
  passiveDate1: {
    type: Date,
    default: new Date(),
    required: true,
  },

  passiveSlot2: {
    type: String,
    default: "",
    reqired: true,
  },
  passiveDate2: {
    type: Date,
    default: new Date(),
    required: true,
  },

  passiveSlot3: {
    type: String,
    default: "",
    reqired: true,
  },
  passiveDate3: {
    type: Date,
    default: new Date(),
    required: true,
  },

  //Equipment Slots
  ring1: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  ring2: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  ring3: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  ring4: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  ring5: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },

  weapon: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },

  chest: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  head: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  arms: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  legs: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },

  spellSlot1: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment'
  },
  spellSlot2: {
    type: Schema.Types.ObjectId,
    ref: 'Spell'
  },
  spellSlot3: {
    type: Schema.Types.ObjectId,
    ref: 'Spell'
  },
  spellSlot4: {
    type: Schema.Types.ObjectId,
    ref: 'Spell'
  },

  //main stats
  hp: {
    type: Number,
    default: 100,
  },
  stamina: {
    type: Number,
    default: 100,
  },
  combat: {
    type: Number,
    default: 10,
  },

  hpBonus: {
    type: Number,
    default: 0,
  },
  staminaBonus: {
    type: Number,
    default: 0,
  },
  combatBonus: {
    type: Number,
    default: 0,
  },
  
  // stats
  laborXp: {
    type: Number,
    default: 0,
  },
  huntingXp: {
    type: Number,
    default: 0,
  },
  luckXp: {
    type: Number,
    default: 0,
  },
  strengthXp: {
    type: Number,
    default: 0,
  },
  mentalityXp: {
    type: Number,
    default: 0,
  },
  dexterityXp: {
    type: Number,
    default: 0,
  },
  defenseXp: {
    type: Number,
    default: 0,
  },
  
  laborLevel: {
    type: Number,
    default: 0,
  },
  huntingLevel: {
    type: Number,
    default: 0,
  },
  luckLevel: {
    type: Number,
    default: 0,
  },
  strengthLevel: {
    type: Number,
    default: 0,
  },
  mentalityLevel: {
    type: Number,
    default: 0,
  },
  dexterityLevel: {
    type: Number,
    default: 0,
  },
  defenseLevel: {
    type: Number,
    default: 0,
  },

  laborBonus: {
    type: Number,
    default: 0,
  },
  huntingBonus: {
    type: Number,
    default: 0,
  },
  luckBonus: {
    type: Number,
    default: 0,
  },
  strengthBonus: {
    type: Number,
    default: 0,
  },
  mentalityBonus: {
    type: Number,
    default: 0,
  },
  dexterityBonus: {
    type: Number,
    default: 0,
  },
  defenseBonus: {
    type: Number,
    default: 0,
  },

  currentJob: {
    type: String,
    enum: ['office', 'contract', 'service', 'business'],
    default: 'office'
},
});

userSchema.pre('save', function(next) {
  if (this.isModified('balance')) {
    this.balanceHistory.unshift(this.balance);
    if (this.balanceHistory.length > 20) {
      this.balanceHistory.pop();
    }
  }
  next();
});

module.exports = model('User', userSchema);