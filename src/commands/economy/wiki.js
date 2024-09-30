const { Client, Interaction, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const Equipment = require('../../models/equipment');
const Usables = require('../../models/usable');
const Material = require('../../models/material');
const Stocks = require('../../models/stock');
const RecipeBooks = require('../../models/recipeBook');
const Spell = require('../../models/spell');
const Monster = require('../../data/monster');

const axios = require('axios');
const Recipe = require('../../models/recipe');
const Title = require('../../models/title');

async function generateLineGraphURL(data) {
    const config = {
        type: 'line',
        data: {
            labels: Array.from({ length: data.length }, (_, i) => i + 1),
            datasets: [{
                data: data,
                borderColor: 'gold',
                borderWidth: 3,  // Increase the width of the line
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 16   // Increase font size
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.5)',
                        borderWidth: 2  // Increase the width of the grid lines
                    }
                },
                x: {
                    ticks: {
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 16  // Increase font size
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white',
                        font: {
                            weight: 'bold',
                            size: 16   // Increase font size
                        }
                    }
                }
            }
        }
    };

    const response = await axios.get('https://quickchart.io/chart', {
        params: {
            c: JSON.stringify(config)
        }
    });

    return response.request.res.responseUrl;
}

const guideStatement = "Welcome to Dauntless. From hunting enemies for their items, completing quests and working jobs to increase your economical standing, and crafting equipment, spells and consumable items to become stronger, you will strive for one thing, the peak, becoming invincible under the heavens."
    + "\n\n**Grow Your Balance:**"
    + "\n\nRising in the economical world of dauntless can be done through various means, be it legal or illegal, here are a couple ways to grow your bank and compete against other players:"
    + "\n\n• `/Work` to gain a calculated amount of doros along with bonuses"
    + "\n• Invest in `/Stocks` to grow your money"
    + "\n• Complete daily `/Quests` by handing in drops from monsters, and receiving doros"
    + "\n• Gambling against other people in a game of `/Blackjack` or `/Duel` with honor"
    + "\n• Roll `/Dice` against dauntless and double your bet"
    + "\n• `/Steal` money from other users and make it your own."
    + "\n• Sell your plunder on the `/market` or the global `/auction`!"
    + "\n\n**Grow Stronger:**"
    + "\n\nGrowing stronger means being able to fight higher level enemies, and win duels against players more consistently. Be it to defend your bank account from thieves, or use your luck to aid your gambling addiction, your attributes will have an effect in everything."
    + "\n\n• `/Hunt` enemies to steadily raise your hunting level, allowing you to progress further."
    + "\n• `/Forge` equipments and equip them to boost multiple combination of attributes"
    + "\n• `/Duel` other players and claim their strength as your own"
    + "\n• Participate in gambling to boost stats such as luck and a few others"
    + "\n• The more you `/Steal`, the higher your dexterity will reach."
    + "\n• `/Use` consumables to temporarily / permanently raise respective attributes."
    + "\n• `/Work` different jobs to raise different stats."
    + "\n• Acquire achivement titles mesteriously and equip for bonus attribute points."
    + "\n\n Finishing Note: All attributes can be both permenantly and temporarily raised through the use of consumables such as drinks, pills, and embers. It is important to be able to craft items to both equip and use."


const misc = [
    {
        keywords: ["stat", "stats", "attributes", "bonus"],
        description: "**Attributes in Dauntless**\n\nAttributes are core stats that determine a player's prowess, abilities, and advantages in the Dauntless world. They directly influence combat, hunting, earnings, and various activities.\n\n**1. Dexterity (Dex)**:\n- Role: Similar to strength, it's a weapon scaling attribute.\n- Benefits: Boosts weapon damage, increases success in stealing money, and enhances escape chances.\n- Leveling: Acquired by working service jobs, using the /daily command, and hunting monsters.\n- Bonus Levels: Gained through equipment, armours, titles, spell buffs, and rings.\n- Read More: `/wiki item: Dexterity`\n\n**2. Mentality**:\n- Role: Scales with specific weapons similar to strength.\n- Benefits: Enhances damage during duels and boss fights, and boosts earnings in office jobs.\n- Leveling: Through office jobs and winning blackjack.\n- Bonus Levels: Gained from armour, rings, spell buffs, and titles.\n- Read More: `/wiki item: Mentality`\n\n**3. Luck**:\n- Role: Influences ranges in luck-based activities.\n- Benefits: Better outcomes in /work, hunting, duels, boss fights, stealing, and gambling.\n- Leveling: Via gambling commands and the /daily command.\n- Read More: `/wiki item: Luck`\n\n**4. Hunting**:\n- Role: Determines monster hunting ability.\n- Recommendations: To hunt monsters, be AT LEAST 5 levels below them. For bosses, gather a team with the same hunting level.\n- Leveling: By hunting monsters and through the /daily command.\n- Bonus Levels: Acquired from equipment, titles, rings, and items.\n- Read More: `/wiki item: Hunting`\n\n**5. Labour**:\n- Role: Key for work scenarios.\n- Benefits: Higher labour yields better bonuses and earnings in service jobs.\n- Leveling: Working in service jobs and the /daily command.\n- Read More: `/wiki item: Labour`\n\n**6. Combat**:\n- Role: Dictates weapon damage. Unlike others, it's cultivated through crafted pills.\n- Benefits: Crucial for duels and boss fights, determining damage dealt to opponents.\n- Bonus Levels: Raised through equipment, rings, titles, spells, and consumables.\n- Read More: `/wiki item: Combat`\n\n**7. Health**:\n- Read More: `/wiki item: Health`\n\n**8. Stamina**:\n- Read More: `/wiki item: Stamina`\n\n**9. Defense**:\n- Read More: `/wiki item: Defense`\n\n**Note**: Mastery of these attributes is pivotal for any Dauntless player. They shape interactions, strategies, and outcomes in the expansive world."
    },    
    {
        keywords: ["hp", "health"],
        description: "**HP (Health Points)**\n\n**Overview**: HP represents the vitality and endurance of a character in combat situations. It's a pivotal metric when engaging in duels, fighting bosses, or any situation where one might take damage. The higher the HP, the more damage one can sustain before being defeated.\n\n**Acquisition and Cultivation**:\n- **Crafted Pills**: HP cannot be traditionally leveled up. Instead, players must cultivate their HP through the use of specially crafted pills.\n- **Temporary Boosts**: Drinks and embers can provide a temporary enhancement to one's HP, useful for imminent battles or challenges.\n\n**Combat Relevance**:\n- **Duels**: When engaging in duels with other players, the damage taken will be contingent on one's max HP. A higher HP can mean the difference between victory and defeat.\n- **Boss Fights**: Victory against formidable bosses often hinges on a player's ability to withstand damage. A robust HP ensures that players can tank hits more effectively, increasing their chances of success.\n\n**Equipment Bonuses**:\n- **Armour, Rings, and Titles**: Equipping certain items, like armor or rings, or even achieving specific titles, can provide passive bonuses to HP. These bonuses enhance one's resilience in combat, making them a valuable asset for any player.",
    },
    {
        keywords: ["sp", "stamina"],
        description: "**SP (Stamina Points)**\n\n**Overview**: Stamina serves as the primary energy reserve that powers the usage of spells and attacks during combat situations. It's a crucial resource that dictates the frequency and potency of one's actions in duels or against bosses. Once stamina is depleted, a character becomes unable to act, leaving them vulnerable.\n\n**Acquisition and Cultivation**:\n- **Crafted Pills**: Like HP, stamina cannot be directly leveled up. Players must cultivate their stamina through the use of special crafted pills.\n- **Temporary Boosts**: Certain drinks and embers offer a short-term boost to stamina, beneficial for upcoming battles or challenges.\n\n**Combat Relevance**:\n- **Duels and Boss Fights**: In combat scenarios, every weapon and spell possesses a stamina cost. Using these consumes a set amount of stamina, indicated on the respective weapon or spell description. Exceeding one's stamina limits in battle leads to inaction, making stamina management pivotal for victory.\n\n**Note**: It's essential to always be aware of one's stamina reserves. Running out at critical moments can turn the tide of any battle against you, making stamina conservation and strategic use key elements of combat strategy."
    },
    {
        keywords: ["combat", "power", "combat strength", "cp"],
        description: "**Combat Power**\n\n**Overview**: Combat Power (CP) dictates the offensive capabilities of a character and also **the amount of hunt tokens regenerated**. It primarily determines the damage output when utilizing weapons in combat scenarios. The higher the CP, the greater the damage inflicted upon adversaries, making it instrumental in duels and confrontations with bosses.\n\n**Acquisition and Cultivation**:\n- **Crafted Pills**: CP, like HP and SP, cannot be raised through traditional leveling. Cultivation of Combat Power is achieved via specially crafted pills.\n- **Temporary Boosts**: Consumable items, whether crafted or acquired from the market, can momentarily elevate one's CP, offering an edge in imminent combat scenarios.\n\n**Combat Relevance**:\n- **Duels and Boss Fights**: CP is pivotal in determining the damage dealt to opponents. In duels, the goal is to diminish the opponent's HP, and a higher CP accelerates this process. During these confrontations, each turn allows for a combat damage output based on one's CP, utilizing SP for execution.\n- **Spells**: Some spells, specifically attack-type spells, come with their inherent combat values. While these spells use the player's SP, they rely on their own combat values for determining damage, independent of the user's CP.\n\n**Equipment and Buffs**:\n- **Armour, Rings, and Titles**: Various equipment pieces can bestow passive CP bonuses. These equipment-induced enhancements can significantly bolster one's combat prowess.\n- **Spell Buffs**: Certain spells, when cast, can grant temporary CP boosts, further amplifying damage output for a limited duration.\n\n**Note**: Balancing CP with other stats ensures versatility in combat, allowing for both strong offense and resilient defense."
    },
    {
        keywords: ["labour", "labor"],
        description: "**Labour (Labor)**\n\n**Overview**: Labour is a reflection of a character's proficiency and expertise in service-oriented tasks and professions. Its level predominantly impacts earnings and bonuses when undertaking service jobs within the game. A higher labour level translates to superior job performance and, consequently, enhanced rewards.\n\n**Acquisition and Advancement**:\n- **Service Jobs**: Engaging in service jobs not only provides immediate earnings but also serves as a primary means to enhance one's labour level. Consistent work in these professions leads to incremental improvements in this stat.\n- **Daily Command**: Aside from working directly in service roles, players also have a chance to randomly level up their labour stat when claiming their /daily rewards. This adds an element of surprise and luck to the progression.\n\n**Economic Relevance**:\n- **Doro Bonuses and Earnings**: A commendable labour level is a ticket to better doro bonuses and increased base earnings from service jobs. It's a direct investment in one's economic prosperity within the game.\n\n**Note**: Focusing on labour is beneficial for players inclined towards economic gameplay, offering a steady income source and fostering financial growth."
    },
    {
        keywords: ["hunting"],
        description: "**Hunting**\n\n**Overview**: The Hunting stat quantifies a player's prowess and efficiency in tracking and engaging with monsters using the /hunt command. A strong hunting level is a testament to one's capability to take on formidable monsters and even bosses, making it a crucial aspect for those who seek combat-oriented challenges. The enemies you encounter will be based off your hunting level (20 level range up and down).\n\n**Acquisition and Advancement**:\n- **Hunting Monsters**: The primary method to boost one's hunting level. Engaging and successfully hunting monsters bestows XP, which contributes to the stat's growth.\n- **Daily Command**: Players also stand a chance to fortify their hunting level when claiming their /daily rewards. It provides an unpredictable yet exciting means of progression.\n- **Equipment and Items**: Certain gears like equipment, rings, and titles, or consumable items can provide passive or active enhancements to the hunting stat.\n\n**Hunting Dynamics**:\n- **Monsters**: To optimize success rates, it's recommended for players to target monsters that are at least 5 levels near their hunting level.\n- **Bosses**: Engaging bosses necessitates a coordinated effort. The general guideline suggests a party of at least 4 members, all bearing a hunting level equivalent to the boss's level.\n\n**Note**: Elevating one's hunting level opens the gateway to face tougher challenges and reap richer rewards, making it a sought-after stat for adventurers and combat enthusiasts. The monsters you encounter will be dependant on your level. Similarly lower level monsters will appear less as you level up, you can use regression based items to temporarily decrease your hunt level if you wish to hunt monsters at a lower base level."
    },
    {
        keywords: ["luck"],
        description: "**Luck**\n\n**Overview**: Luck is the linchpin of various activities within Dauntless, influencing outcomes across both combat and non-combat scenarios. It represents the game's RNG element, affecting everything from economic gains to battle dynamics. Its ubiquitous presence makes it a paramount attribute for players to focus on.\n\n**Acquisition and Advancement**:\n- **Gambling Commands**: Players can enhance their luck by participating in games of chance like dice or slots. The higher the bet, the more luck XP earned upon a win.\n- **Daily Command**: The /daily command provides a random chance for players to boost their luck level.\n- **Consumables**: Certain consumables offer a temporary boost to the luck stat, aiding players in crucial moments.\n\n**Effects of Luck**:\n- **Economic Activities**: Higher luck levels can positively skew outcomes in activities such as /work, increasing potential rewards.\n- **Combat Outcomes**: In duels or boss fights, luck impacts the variability of damage and the chances of landing critical hits.\n- **Theft Success**: The probability of a successful heist against other players is influenced by the luck stat.\n- **Gambling**: In games like dice or slots, a higher luck level gives players an edge.\n\n**Equipment and Enhancements**:\n- **Armour, Rings, and Titles**: Equipping specific items can provide passive bonuses to luck. The potency of the bonus varies based on the item.\n- **Spells**: During combat scenarios, spells can be employed to grant temporary luck enhancements.\n\n**Note**: Given its vast influence, optimizing luck is pivotal for players looking to succeed in various aspects of Dauntless."
    },
    {
        keywords: ["strength", "str"],
        description: "**Strength**\n\n**Overview**: Strength stands as a critical metric for many weapons within Dauntless. It's the primary scaling property that determines the damage output when certain weapons are equipped. A higher strength level means that weapons which scale with strength will inflict more damage, be it in duels, boss fights, or standard hunts.\n\n**Acquisition and Advancement**:\n- **Contract Work**: The profession of 'contract' is a prime avenue to enhance strength. Not only does working under this job boost strength, but the earnings from the job also increase proportionally with the strength level.\n- **Duels and Hunts**: Victories in duels and successful hunts offer a chance to augment one's strength level.\n- **Daily Command**: Engaging with the /daily command provides an opportunity for random attribute enhancement, including strength.\n\n**Strength in Combat**:\n- **Weapon Scaling**: Weapons that scale off strength derive their damage potential from the user's strength level. Hence, wielding such weapons with a high strength stat can be a formidable combination in combat.\n\n**Equipment and Consumables**:\n- **Titles, Equipments, Rings**: Equipping specific titles, armaments, or rings can provide passive bonuses to strength.\n- **Spell Buffs and Consumables**: In combat scenarios like duels or boss fights, spells can provide temporary buffs to strength. Additionally, consumables, especially crafted pills, can offer temporary surges in strength level.\n\n**Note**: Given its influential role in combat, players seeking to maximize their damage potential should focus on cultivating their strength attribute."
    },
    {
        keywords: ["mentality"],
        description: "**Mentality**\n\n**Overview**: Mentality is a core attribute that influences both combat and non-combat scenarios within Dauntless. It acts as a scaling property for certain weapons, determining the damage output based on the player's mentality level. Whether it's in duels, boss fights, or standard hunts, weapons that scale with mentality are more potent with a higher mentality level. Beyond combat, this attribute also dictates the earnings potential in certain job roles.\n\n**Acquisition and Advancement**:\n- **Office Work**: Engaging in office jobs allows players to cultivate their mentality, with higher levels translating to increased earnings and bonuses.\n- **Blackjack Matches**: Victory in blackjack can also bolster a player's mentality level.\n\n**Effects of Mentality**:\n- **Weapon Scaling**: Weapons that scale with mentality inflict more damage as the player's mentality level rises. This effect is evident in activities such as dueling, boss encounters, and regular hunts.\n- **Economic Advantages**: Players in office jobs will notice their earnings and bonuses scale positively with their mentality level.\n\n**Equipment and Enhancements**:\n- **Armour, Rings, and Titles**: Specific equipment and titles grant passive bonuses to mentality, bolstering its effects.\n- **Spells**: In combat, certain spells can temporarily enhance a player's mentality.\n- **Consumables**: Items can be used to temporarily boost the mentality stat, providing an edge in crucial moments.\n\n**Note**: Mentality serves as a dual-purpose attribute, crucial for both economic prosperity and combat efficiency in Dauntless."
    },
    {
        keywords: ["dexterity", "dex"],
        description: "**Dexterity (Dex)**\n\n**Overview**: Dexterity, often abbreviated as 'Dex', is an essential attribute for many in Dauntless. Serving as a scaling metric for a myriad of weapons, the efficacy of these weapons is directly influenced by the player's dexterity level. In combat scenarios like duels and boss fights, weapons that scale with dexterity can deliver more potent blows with higher Dex levels. Beyond combat, dexterity also facilitates stealthy endeavors, such as successfully pilfering from other players.\n\n**Acquisition and Advancement**:\n- **Service Jobs**: Working in service-oriented professions offers players the opportunity to hone their dexterity.\n- **Daily Command**: The /daily command sometimes grants dexterity XP, chosen at random.\n- **Monster Hunts**: Engaging in hunts can occasionally yield dexterity XP, enhancing the player's level.\n\n**Effects of Dexterity**:\n- **Weapon Scaling**: Weapons that scale with dexterity can inflict amplified damage proportional to the player's Dex level, proving invaluable in duels and boss engagements.\n- **Stealth Operations**: A heightened dexterity level augments the player's success rate when attempting to steal from others, also aiding in evasive maneuvers.\n\n**Equipment and Enhancements**:\n- **Armour, Rings, and Titles**: Wearing certain equipment or obtaining specific titles can endow players with passive bonuses to dexterity.\n- **Spells**: During duels, some spells can momentarily amplify a player's dexterity, granting a tactical advantage.\n- **Consumables**: Various items can be consumed to provisionally raise the dexterity stat, offering a strategic edge in pivotal situations.\n\n**Note**: Dexterity serves a multifaceted role, crucial for both combat efficiency and covert activities in Dauntless."
    },
    {
        keywords: ["defense", "def"],
        description: "**Defense**\n\n**Overview**: Defense serves as a protective shield against adversarial forces in Dauntless. The strength of this shield is determined by the player's defense level. In the heat of combat, whether against formidable bosses or dueling rivals, a fortified defense can significantly reduce incoming damage, and in some extreme instances, even transmute damage into healing. Furthermore, defense plays a pivotal role in safeguarding one's hard-earned assets by thwarting potential thieves from successful heists.\n\n**Acquisition and Advancement**:\n- **Daily Command**: Periodically, the /daily command bestows defense XP, chosen randomly among other attributes.\n- **Monster Hunts**: Engaging in hunts not only offers the thrill of combat but can also occasionally boost the player's defense level.\n- **Business Work**: Operating within the business sector provides another avenue to enhance defense, as it also scales the earnings from business-related tasks.\n\n**Effects of Defense**:\n- **Combat Mitigation**: A robust defense can effectively mitigate the damage received during confrontations, turning the tide of battle in favor of the defender.\n- **Bank Protection**: Those with heightened defense levels enjoy greater security against thievery, increasing the likelihood of unsuccessful heist attempts by adversaries.\n\n**Equipment and Enhancements**:\n- **Armour, Rings, and Titles**: Equipping specific items or earning particular titles can endow players with passive defense bonuses, bolstering their resilience.\n- **Spell Buffs**: During crucial encounters, certain spells can momentarily amplify a player's defense, providing a strategic edge.\n- **Consumables**: There exists a variety of items which, when consumed, offer a provisional boost to the defense stat, aiding players in dire situations.\n\n**Note**: In the unpredictable world of Dauntless, a strong defense often proves to be the best offense, ensuring survival against formidable challenges."
    },
    {
        keywords: ["spells", "incantations", "spell", "incantation", "magic", "magics"],
        description: "**Spells in Dauntless**\n\n**Overview**: Spells are paramount tools wielded by players in the world of Dauntless, primarily harnessed for combat applications. Ranging in a myriad of effects and intensities, these incantations can manifest as offensive strikes, robust shields, vital heals, potent buffs, debilitating debuffs, and even the erasure of an adversary's spell slots.\n\n**Function and Use**:\n- **Offense**: Some spells are tailor-made for aggressive confrontations, delivering damage directly to foes.\n- **Defense**: Defensive spells focus on erecting barriers or shields to absorb and nullify incoming attacks.\n- **Restoration**: Certain spells have the capability to restore health or stamina, ensuring continued participation in fights.\n- **Buffs and Debuffs**: This category of spells temporarily enhances the user's attributes or conversely, weakens the opponent's stats.\n- **Negation**: Uniquely designed to counteract enemy spells, these incantations can invalidate an opponent's spell slots during duels. However, they remain ineffective against formidable bosses.\n\n**Spell Loadout**:\n- **Equipping**: Players can equip up to 4 distinct spells at any given time, necessitating strategic choices based on combat needs.\n\n**Tier Classification**:\n- **Ranking System**: Spells are hierarchically organized into five distinct ranks. The lower echelons comprise of D-tier and A-tier spells. At the pinnacle lies the coveted S-tier spells, recognized for their unmatched power.\n\n**Note**: Mastery over spells is a mark of an adept player in Dauntless. Proper utilization of these magical tools can drastically tip the scales of battle, offering avenues to both offensive dominance and defensive resilience."
    },
    {
        keywords: ["armour", "chest", "chestplate", "chest plate", "armor"],
        description: "**Armor in Dauntless**\n\n**Overview**: Armor is a player's first line of defense, shielding them from the onslaught of enemies. These protective gear can vary in their robustness and design, often offering more than mere defense.\n\n**Function and Use**:\n- **Protection**: Fundamental to all armor pieces, they provide a barrier against physical harm during battles.\n- **Attribute Boost**: Certain armors can augment a player's inherent attributes, such as dexterity, luck, or mentality, influencing activities ranging from duels to hunting.\n\n**Tier Classification**:\n- **Ranking System**: Armor is graded from D-tier to the prestigious S-tier. Higher ranks often correlate with greater defense and potent attribute enhancements.\n\n**Note**: An armor's value isn't just in its defense but in the way it complements a player's style and strengths. Choosing the right armor can drastically alter one's survival odds in Dauntless."
    },
    {
        keywords: ["weapons", "weapon", "sword", "spear", "scaling", "arnament", "arnaments", "axe", "bow", "melee", "halberd"],
        description: "**Weapons in Dauntless**\n\n**Overview**: Weapons act as the primary tools for offense in Dauntless, dictating the flow of combat and influencing duel outcomes. Their power and efficiency are intertwined with player attributes.\n\n**Function and Use**:\n- **Offense**: The primary role of weapons is to deal damage, whether in duels, against bosses, or during hunts.\n- **Scaling**: A weapon's potency often aligns with specific attributes. This means that as a player improves a particular attribute, their weapon's damage, especially with those that scale accordingly, also increases.\n\n**Tier Classification**:\n- **Ranking System**: Weapons span from the D-tier to the elite S-tier, with superior tiers indicating enhanced damage and better attribute scaling.\n\n**Note**: Weapon choice is a testament to a player's strategy. The right weapon can amplify strengths, while the wrong one might expose vulnerabilities."
    },
    {
        keywords: ["helm", "headgear", "helmet", "mask", "head"],
        description: "**Helms in Dauntless**\n\n**Overview**: Helmets, or helms, safeguard a player's cranium, shielding them from potential fatal blows. Their significance transcends mere defense, sometimes serving as tools for attribute enhancement.\n\n**Function and Use**:\n- **Protection**: Helms primarily shield a player's head, a crucial protection during duels and battles.\n- **Attribute Boost**: Some helms can amplify player attributes, fine-tuning their proficiency in activities or battles.\n\n**Tier Classification**:\n- **Ranking System**: Ranging from D-tier to S-tier, the rank of a helm denotes its protective capability and potential attribute enhancements.\n\n**Note**: While often overlooked, the right helm can spell the difference between victory and defeat, especially in tightly-contested battles."
    },
    {
        keywords: ["gauntlets", "gloves",],
        description: "**Gauntlets in Dauntless**\n\n**Overview**: Gauntlets, or combat gloves, defend a player's hands, crucial for effective weapon handling and spell casting. Their value extends beyond mere defense, sometimes serving as conduits for attribute enhancement.\n\n**Function and Use**:\n- **Protection**: Gauntlets protect against hand injuries, ensuring weapons and spells can be wielded efficiently.\n- **Attribute Boost**: Like other gear, some gauntlets offer attribute boosts, refining player stats further.\n\n**Tier Classification**:\n- **Ranking System**: Gauntlets are classified from D-tier to the superior S-tier, with each tier denoting the quality of protection and bonuses they provide.\n\n**Note**: The right pair of gauntlets can subtly influence battle outcomes, ensuring a player's hands remain unhindered during intense combat."
    },    
    {
        keywords: ["leggings", "leg protection", "leg", "leg armour"],
        description: "**Leggings in Dauntless**\n\n**Overview**: Leggings shield the player's lower half, crucial for mobility and protection against low blows. These protective wears can also be embedded with attribute-enhancing properties.\n\n**Function and Use**:\n- **Protection**: Leggings protect against leg injuries, crucial for maintaining mobility in combat.\n- **Attribute Boost**: Some leggings come embedded with attribute boosts, affecting various in-game activities.\n\n**Tier Classification**:\n- **Ranking System**: Leggings span from D-tier to S-tier, with each rank offering varying levels of protection and attribute enhancements.\n\n**Note**: Leggings, while sometimes underestimated, play a crucial role in a player's overall defense and combat strategy."
    },
    {
        keywords: ["rings", "accessories", "ring"],
        description: "**Rings in Dauntless**\n\n**Overview**: Rings are unique accessories that allow players to fine-tune their attributes. While not offering direct protection, their potency in enhancing attributes is unmatched.\n\n**Function and Use**:\n- **Attribute Boost**: Rings primarily serve to provide boosts to various player attributes. Their effects can influence outcomes in battles, hunts, and other activities.\n- **Versatility**: With the ability to equip up to five rings, players can craft unique combinations to best suit their playstyle.\n\n**Tier Classification**:\n- **Ranking System**: Like other equipment, rings range from D-tier to the esteemed S-tier. Higher-tier rings offer more significant attribute enhancements.\n\n**Note**: The power of rings lies in their subtlety. A well-curated set can drastically shift the balance of power in any confrontation."
    },
    {
        keywords: ["titles", "achievements", "honor", "title", "achievement"],
        description: "**Titles in Dauntless**\n\n**Overview**: Titles are marks of distinction and honor in the Dauntless realm, representing a player's significant achievements and milestones. From slaying formidable dragons to crafting exclusive armor sets, titles are symbols of a player's dedication and prowess.\n\n**Function and Use**:\n- **Recognition**: Titles serve as a badge of honor, highlighting a player's extraordinary accomplishments. Equipping a title is a testament to one's experiences and adventures in the game.\n- **Attribute Boost**: Beyond mere recognition, titles bestow passive bonuses to a player's attributes. These boosts vary based on the title, affecting gameplay subtly but significantly.\n\n**Equipping Mechanism**:\n- **One at a Time**: While players can earn multiple titles, they can equip only one at any given moment, compelling them to choose the title that best complements their current strategy and gameplay style.\n\n**Note**: In the vast world of Dauntless, titles are more than just names. They echo tales of grandeur, challenges overcome, and the legacy of a player's journey. Choosing the right title can be a strategic advantage, amplifying inherent strengths and opening up new avenues of gameplay."
    },
];

const commands = [
    {
        name: "covenant",
        description: "**Economy - Balance**\n\nDisplays user balance and net growth/loss overtime."
    },
    {
        name: "covenant",
        description: "**Mage Tower - Covenant**\nAccess the Mage Tower's archives and gain a chance to learn various incantations. Spells that are purchased can be attuned in one of four slots, allowing users to use them in boss battles and duels. Spell types range from healing, over time effects, opponent spell restriction, attack, shields, buffs and debuffs.\n\n" +
            "• **Actions**: View Incantations, Buy Incantations, Sell Incantations\n" +
            "• **Usage**: Specify an action, followed by the spell name (if buying or selling). You can only learn/buy a spell once, you can choose to sell it as well but you won't retain it's abilities unless you purchase it again."
    },
    {
        name: "quest",
        description: "**Commission - Daily Quest**\nResets every day, hand in enemy drops for triple their price. Enemy drops can be acquired by hunting monsters within a safe level range.\n\n" +
            "• **View**: View the quest board for the daily quest requirements\n" +
            "• **Submit**: Submit quest items for a reward."
    },
    {
        name: "check",
        description: "**Information - Check Time Restrictions**\nCheck ongoing time / token restrictions for all commands. Gives time in hour : minute : second format, and also displays information if effects are ongoing.\n\n" +
            "• **Usage**: View all time restrictions."
    },
    {
        name: "dice",
        description: "**Gambling - Dice**\nRoll a dice and hope you're lucky. Your bet is doubled! On success, you level up your luck respective to how much you bet.\n\n" +
            "• **Bet**: Bet an amount to gamble, bet is doubled in case of victory, otherwise it is your loss :O (set to 1 by default)\n" +
            "• **Number**: Specify a number between 1 - 6 to bet on, if the dice lands on that value, you win!!! (set to 1 by default)."
    },
    {
        name: "slots",
        description: "**Gambling - Slots**\nTry your luck at the slot machine! Spin the slots and hope the symbols align in your favor. If they do, you'll get a reward based on the combination you land! Different combinations yield different multipliers, increasing your winnings!\n\n" +
            "• **Play**: Use the `/slots` command followed by your bet amount to spin the machine. If the symbols match your choice, your bet is multiplied!\n" +
            "• **Symbols & Multipliers**:\n" + 
            "  - **Cherry** (`:cherries:`): Get three cherries in a line to receive a x5 multiplier!\n" +
            "  - **Seven** (`:seven:`): Triple sevens yield a x10 multiplier!\n" +
            "  - **Mixed Fruits**: Getting a line of either apples (`:apple:`), grapes (`:grapes:`), cherries (`:cherries:`), or oranges (`:tangerine:`) awards a x1 multiplier!\n" +
            "  - **All Matching**: Any line with all the same symbol (other than special combinations) provides a x3 multiplier.\n\n" +
            "• **Bet**: Specify an amount to bet using the `bet` option. If your symbols match in a winning combination, you'll receive the corresponding multiplier of your bet. But be careful, if they don't match, you'll lose your bet!\n\n" +
            "• **How to Win**: Spin the slots and hope for the best! The machine randomly determines the outcome, but if the symbols match in a way described in the multipliers, you win big!"
    },
    {
        name: "attunement",
        description: "**Incantations - Attunement**\nBefore diving into the arcane duels or facing formidable bosses, attune your spells. Equip or remove spells from four different slots. Each user only has access to 4 spells. Note that negation spells have no effect on bosses and thus are excluded from the loadout on encounter.\n\n" +
            "• **Actions**: View Attuned Incantations, Attune Incantation, Remove Attunement\n" +
            "• **Usage**: Specify an action, then the incantation name (if equipping or removing). Spells which have the same effect will not be allowed to stack on top of each other during battle, so choose your loadout wisely."
    },
    {
        name: "auction",
        description: "**Auction House**\nEngage in the commerce of Dauntless. Browse, bid, or initiate auctions. Ensure to set the right bid and time.\n\n" +
            "• **Actions**: Browse Auction, Create Auction, Bid\n" +
            "• **Usage**: Depending on the action, specify item, quantity, time, bid amount, and user in order to create auctions or bid for items. Highest bidder by the end of the time limit will aquire the bid item. Consequences will be present if you do not have the required bid amount that you placed once the time limit ends."
    },
    {
        name: "bank",
        description: "**Dauntless Bank**\nDisplays the accumulation of user recieved tax and accumulative lottery globally. This presents the current pool applicable to be won by all users. Buying a lottery ticket will add to this pool."
    },
    {
        name: "blackjack",
        description: "**Gambling - Blackjack**\nChallenge your luck and skills! Initiate a game of blackjack and await an opponent to accept the bet. Place your Doros wisely. Upon victory, winner will acquire XP towards mentality respective to the level of their opponent, while the loser will forfeit mentality XP relative to their own level.\n\n" +
            "• **Usage**: Specify your bet amount. Each turn, users will be handed cards attributing to a value. If your total value exceeds 21, you will forfeit the game and lose the prize pool. If both users choose to 'stand', the player with a higher total value will win, if both players maintain the same values, the game will end in draw and nothing will stand to be gained. At the end of each game, each player will recieve respective Mentality XP relating to their performance, and the winner will gain the pool money."
    },
    {
        name: "forge",
        description: "**The Forge**\nEach player is provided access to a forge. View materials, add them, remove, or process them to craft your desired equipment, usables and materials.\n\n" +
            "• **Actions**: View Forge, Add Material, Remove Material, Process Forge (50% random penalty on processing if you do not have the recipe book required)\n" +
            "• **Usage**: Depending on the action, specify material, and its quantity. To craft items, requires you to know the exact recipe to the item you wish to forge. This can be done by purchasing/acquiring crafting ledgers which allow the user to gain insight into different crafting recipes. When processing an item, only the necessary items must be present within the forge, but the amounts relative to them can vary depending on how many items you wish to gain through the process. Leftoever items will remain in the forge to be used again, or retrieved back into the inventory."
    },
    {
        name: "daily",
        description: "**Dauntless Bank - Daily Claim**\nClaim random amounts of Doros and gain a XP towards a random attribute every 24 hours. Attribute varies accross every stat except point-based values such as HP, Stamina and Combat"
    },
    
    {
        name: "duel",
        description: "**Arena - Duel**\nChallenge warriors in the realm. Propose a duel and let the mightiest prevail!\n\n" +
            "• **Usage**: Place a bet amount to initiate the duel. Attune spells and equipment previously to gain a upperhand. Higher ranked weapons allow for heavier attacks, stronger defense, greater luck and more strategy. Equip different loadouts and outsmart your opponent. Weapon attacks increase in power through levels relative to their scaling, while all other attacks can be buffed through items and spells. Attributes can be temporarily raised if a usable has been consumed previous to accepting the duel."
    },
    
    {
        name: "equipment",
        description: "**Armoury - Equipment**\nPrepare for the battles ahead. Access your gear to view, equip, or unequip. Eeach equipment adds a unique combination of bonus levels to your attributes, helping in duels, hunts and all other activities performed in dauntless.\n\n" +
            "• **Actions**: View Setup, Equip Items, Unequip Items\n" +
            "• **Usage**: Specify an action and, if needed, the item to equip or unequip."
    },
    
    {
        name: "hunt",
        description: "**Monster Hunts**\nFace the beasts of Dauntless. Hunt monsters to gather precious materials, gain experience, and earn doros. But be wary - your hunting actions are limited. Success depends on your level, equipment and buffs. Reccomended level to hunt is within 5 hunting level ranges. Enemies will show up varying to the hunting level of the player, meaning as you progress, higher level enemies will be encountered more than lower level monsters. It is reccomended to eat regression pills if you wish to go back and hunt lower level areas.\n\n" +
            "• **Limitations**: 10 monster can be encountered per 30 minutes, with only 3 hunting actions in that timeframe. Successful hunts reward materials, experience, and occasionally other attributes and doros. Each time you use this command, a monster will appear for 3 minutes, the first user to react to the message will be allowed the chance to hunt it, allowing other users to interfere in your hunts if they wish. Occasionally, a boss battle will occur allowing a limited number (5) of users to participate together and aqcuire immense rewards."
    },
    
    {
        name: "inventory",
        description: "**Storage - Inventory**\nGaze upon your gathered treasures. Displays all items and materials you possess. Navigate by reacting to the corresponding reactions for the four categories (Equipment, Usables, Materials, Incantations, Crafting Ledgers, and Stocks). You can move through categories with (⬅️ ➡️)"
    },
    
    {
        name: "job",
        description: "**Career Path - Job Selection**\nChoose your profession in Dauntless. Different jobs come with their unique benefits.\n\n" +
            "• **Job Types**:\n\n Office: Allows for a base salary of 30 doros, but scales with mentality and dexterity, allowing for higher bonuses and base earnings. This job raises mentality.\nContract: Allows for a base volatile salary range of 0 - 70, but scales with strength and labour, allowing for higher bonuses and base earnings. This job raises strenght.\nService: Allows for a base volatile salary range of 20 - 35, but scales with dexterity and labour, allowing for higher bonuses and base earnings. This job raises either labour or dexterity.\nBusiness: Allows for a base volatile salary range of 0 - 95, but scales with luck and defense, allowing for higher bonuses and base earnings. This job does not raise attributes.\n\n" +
            "• **Usage**: Specify the job type to select your profession. Each job allows for access to different ranges of doros to be earned, and different categories of experience to be gained."
    },
    
    {
        name: "leaderboard",
        description: "**Dauntless Rankings - Leaderboard**\nWitness the wealthiest in the realm. View balance rankings server-wide." 
    },
    
    {
        name: "market",
        description: "**Dauntless Marketplace**\nEngage with the underground commerce, one stop source for all your drugs. Access the market to view items, make purchases, or sell your goods.\n\n" +
            "• **Actions**: View Items, Buy Items, Sell Items\n" +
            "• **Usage**: Choose an action and, if buying or selling, specify the item and its quantity."
    },
    {
        name: "message",
        description: "**Dauntless Message Board**\nView global announcements or create your own. Higher payments gain higher visibility.\n\n" +
            "• **Actions**: View Message Board, Post Message\n" +
            "• **Usage**: Decide to either view or post a message. When posting, set the title, content, and specify the payment for visibility."
    },
    
    {
        name: "register",
        description: "**Dauntless Bank - Registration**\nRegister for the Dauntless bank to begin."
    },
    
    {
        name: "status",
        description: "**Personal Ledger - Status**\nView your current levels. Display your statistics and attributes."
    },
    
    {
        name: "steal",
        description: "**Steal victory**\nAttempt to pilfer from another user.\n\n" +
            "• **Usage**: Specify the target and the amount you wish to swipe. Success is determined by your dexterity, item preperations, and luck. Upon sucess, you acquire that amount of doros, as well as XP towards dexterity. Failure has dire consequences."
    },

    {
        name: "scorecard",
        description: "**Heist Scorecard**\nTrack your reputation in the world of thievery.\n\n" +
            "• **Features**: View your successful heists, embarrassing failures, and overall record. Compare your stats with others.\n" +
            "• **Usage**: To see your scorecard, use the command followed by your username. To compare with another user, specify their name after yours. Get insights on each heist, learn from failures, and boast about your victories.\n" +
            "• **Tip**: Consistency in heists can increase your reputation. But remember, every action has its consequences!"
    },
    
    {
        name: "stocks",
        description: "**Dauntless Stock Exchange**\nVolatile world of stocks. View the market, buy, or sell shares.\n\n" +
            "• **Actions**: View Stocks, Buy Stocks, Sell Stocks\n" +
            "• **Usage**: Choose an action and, if buying or selling, specify the stock and its quantity. If you wish to view the current trend graph of a stock, use /wiki to search up the stock name"
    },
    
    {
        name: "trade",
        description: "**Dauntless Trade Hub**\nEngage in barter with fellow users. Initiate a trade for mutual benefit.\n\n" +
            "• **Usage**: Define the user you're trading with, specify the item and quantity you're offering, and indicate the desired item and quantity in return."
    },
    
    {
        name: "use",
        description: "**Inventory Utility - Use Items**\nUtilize your assets. Whether consuming for effects or reading a recipe, your items have various applications such as buff effects, ability to raise attributes or stats, view crafting ledgers, and other unique use cases.\n\n" +
            "• **Usage**: Indicate the item you wish to use."
    },
    
    {
        name: "work",
        description: "**Dauntless Daily Grind**\nInvest time for currency. Work in your chosen job to earn doros and experience in various attributes. Different professions yield different rewards and XP."
    },
    
    {
        name: "wiki",
        description: "**Dauntless Encyclopedia**\nSeek knowledge. Every command, item, and query can be found here. Tap into the realm's extensive database.\n\n" +
            "• **Usage**: Specify the item or command you're seeking information about."
    }
    
];


module.exports = {
    name: 'wiki',
    description: 'Displays the description of an item or a command. Everything is accessible in the wiki.',
    options: [
        {
            name: 'item',
            description: 'Name of the item to search',
            type: ApplicationCommandOptionType.String,
            required: true
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
            const itemName = interaction.options.getString('item');
    
            const models = [Equipment, Usables, Material, Stocks, RecipeBooks, Spell, Monster, Title];
            let item;
            let itemModel;
    
            for (const model of models) {
                item = await model.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }  });
                if(model === Equipment) itemModel = "Equipment"
                if(model === Usables) itemModel = "Usable"
                if(model === Material) itemModel = "Material"
                if(model === RecipeBooks) itemModel = "Recipe Book"
                if(model === Spell) itemModel = "Spell"
                if(model === Title) itemModel = "Title"
                if (item) break;
            }

            // Helper function to capitalize the first letter of a string
            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            
    
            if (!item) {
                let descName = ""
                let commandFound = commands.find(cmd => cmd.name.toLowerCase() === itemName.toLowerCase());
                
                if (!commandFound) {
                    commandFound = misc.find(m => m.keywords.includes(itemName.toLowerCase()));
                    descName = capitalizeFirstLetter(itemName)
                }
                else{
                    descName = capitalizeFirstLetter(commandFound.name)
                }
                if (commandFound) {
                    const embed = new EmbedBuilder()
                        .setColor('Purple') // Change this to your desired color
                        .setTitle(`Information about: ${descName}`)
                        .setDescription(commandFound.description);
                    interaction.editReply({ embeds: [embed] });
                    return;
                } else if(itemName.toLowerCase() === "guide"){
                    const embed = new EmbedBuilder()
                        .setColor('Purple') // Change this to your desired color
                        .setTitle(`Dauntless User Guide`)
                        .setDescription(guideStatement)
                        .setFooter({text: "Use /wiki [item] for more in-depth information about commands and items."})
                    interaction.editReply({ embeds: [embed] });
                    return;
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Error: Invalid Item')
                        .setDescription(`Item \`${itemName}\` not found in the wiki.`)
                    interaction.editReply({ embeds: [embed] });
                    return;
                }
            }

            const additionalInfo = [];
            if(item instanceof Equipment || item instanceof Spell){
                additionalInfo.push(`Item Rank: \`[${item.rank} Rank]\``);
            }
            if(item instanceof Equipment || item instanceof Material || item instanceof Usables || item instanceof RecipeBooks || item instanceof Spell || item instanceof Title){
                additionalInfo.push(`Item Type: \`${itemModel.toString()}\`\n`)
                if(item instanceof Spell){
                    additionalInfo.push(`Spell Type: \`${capitalizeFirstLetter(item.type)}\``)
                    
                    if(item.spellApplication.passive){
                        additionalInfo.push(`Passive spell. \`Effect lasts for ${item.spellApplication.turns} turns\``)
                    }
                    if(item.type === "attack"){
                        additionalInfo.push(`Damage Dealt: \`${item.spellApplication.combat}\``)
                    }
                    
                }
                
            }

            
    
            if (item instanceof Equipment || item instanceof Material || item instanceof Title) {
    
                if (item instanceof Equipment || item instanceof Title) {
                     
                    // Display the stats that the equipment boosts
                    const boostData = item.boost.toObject(); // Convert the Mongoose sub-document to a plain object

                    const boostedStats = [];
                    for (const [key, value] of Object.entries(boostData)) {
                        if (value > 0) {
                            const statString = `${capitalizeFirstLetter(key)}: \` + ${value}\``;
                            boostedStats.push(statString);
                        }
                        else if(key !='_id'){
                            const statString = `${capitalizeFirstLetter(key)}: \` ${value}\``;
                            boostedStats.push(statString);
                        }

                    }

                    if (boostedStats.length) {
                        additionalInfo.push(...boostedStats);
                    }

                    // Display the scaling type of the equipment, if it's defined
                    if (item.scaling && item instanceof Equipment) {
                        additionalInfo.push(`\nScaling Type: \`${capitalizeFirstLetter(item.scaling)}\``);
                    }
                    
                }

                if(item instanceof Equipment || item instanceof Material){
                    // If the item is a Material or Equipment, check which monsters drop it
                    const monsterDroppers = await Monster.find();
                    const monsters = [];
        
                    for (const monster of monsterDroppers) {
                        for (const dropId of monster.drops) {
                            if (dropId.toString() === item._id.toString()) {
                                monsters.push(monster);
                                break;
                            }
                        }
                    }
                    
        
                    if (monsters.length) {
                        const monsterNames = monsters.map(m => m.name).join(', ');
                        additionalInfo.push(`Dropped by: \`${monsterNames}\``);
                    }

                    // Check if the item exists in the market
                    if (item.market) {
                        additionalInfo.push('This item exists in the market.');
                    }
                }

                
            } else if (item instanceof Monster) {
                // Add monster-specific info
                const drops = [];
    
                for (const dropId of item.drops) {
                    const material = await Material.findById(dropId);
                    if (material) {
                        drops.push(material.name);
                    } else {
                        const equipment = await Equipment.findById(dropId);
                        if (equipment) {
                            drops.push(equipment.name);
                        }
                    }
                }
                
                additionalInfo.push(`Type: \`[${item.rarity} Rank] ${item.boss ? 'Boss Enemy.' : 'Regular Enemy.'}\``);
                additionalInfo.push(`Drops: \`${drops.join(', ')}\``);
                additionalInfo.push(`Level: \`${item.levelRequirement}\``);
                
            }

            if(item instanceof Usables && item.market){
                additionalInfo.push('This item exists in the market.');
            }
            
            if(item instanceof Usables && item.consumable){
                additionalInfo.push('This item is consumable.');
            }

            if(item instanceof RecipeBooks){
                additionalInfo.push('This item is /usable.');
            }

            const models2 = [Equipment, Usables, Material, Stocks, RecipeBooks, Spell];
    
            for (const model of models2) {
                const existingItem = await model.findOne({ name: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } , userId: interaction.user.id });
                if(existingItem){
                    additionalInfo.push(`You own \`x ${existingItem.quantity}\` of this item.`);
                }
            }
    
            // Check if the item is craftable based on the Recipe schema
            const recipe = await Recipe.findOne({ resultingItem: { $regex: new RegExp("^" + itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }  });
            if (recipe) {
                additionalInfo.push('This item is craftable.');
            }
    
            if (item.history && item.history.length) { // Check if the item has a 'history' property with data
                const chartURL = await generateLineGraphURL(item.history);
                const embed = new EmbedBuilder()
                    .setColor('Gold')
                    .setTitle(`Stock History for ${item.name}`)
                    .setDescription([item.description, ...additionalInfo].join('\n'))
                    .setImage(chartURL);
                interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('Purple')
                    .setTitle(item.name)
                    .setDescription([`${item.description}\n`, ...additionalInfo].join('\n'));
                interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.log(`Error in /wiki: ${error}`);
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(`Error: Wiki Entry could not be accessed`)
                .setDescription(`Wiki Entry could not be accessed, report to the developer`)
            interaction.editReply({ embeds: [embed] });
        }
    }
    
};
