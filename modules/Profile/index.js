let config = require("../../config")

const Discord = require("discord.js")
const emojis = {
    battlenet: "<:BattleNet:711611992422613095>",
    bethesda: "<:Bethesda:711612217442697276>",
    epic: "<:Epic:711611992238194720>",
    origin: "<:Origin:711611992057708585>",
    steam: "<:Steam:711611993101959239>",
    nintendoswitch: "<:Switch:711611992540184576>",
    uplay: "<:Uplay:711612877982924861>",
    riot: "<:Riot:711618491836268948>",
}


/**
 *
 *
 * @param {*} Mod
 */
module.exports.exec = (Mod) => {
    /*
    Controller

    Controller.Sql => sql controller
     -> Controller.Sql.statements.example = Promise(<result>)
       -> result.rows = {object}      table capitalization is lost

    Controller.Bot => bot controller
     -> Controller.Bot.client = Discord.client
    Controller.debug => debug command
    */
    let xpArr = []

    // XP
    //Msg Xp

    Mod.Bot.client.setInterval(() => {
        //Every min
        xpArr.forEach((user) => {
            Mod.Sql.statements.addXp.query({
                xp: 1,
                userid: user
            })
        })

        xpArr = []
    }, 60000)

    Mod.Bot.client.on("message", (msg) => {
        if (!msg.author.bot && xpArr.indexOf(msg.author.id) === -1) {
            xpArr.push(msg.author.id)
        }
    })

    //msg Xp end

    //voice xp

    Mod.Bot.client.setInterval(() => {
        //10 min
        Mod.Bot.client.channels.cache.each((channel) => {
            if (channel.type === "voice") {
                channel.fetch()
                    .then(channel => {
                        if (channel.members.length > 1) {
                            channel.members.each((member) => {
                                Mod.Sql.statements.addXp.query({
                                    xp: (channel.members.length - 1),
                                    userid: member.user.id
                                })
                            })
                        }
                    })
            }
        })
    }, 10 * 60000)

    Mod.Bot.addCommand('profile', (msg) => {
        let user = (msg.mentions.users.firstKey()) ? msg.mentions.users.firstKey() : (
            (msg.arguments[0]) ? msg.arguments[0] : msg.author.id
        )
        if (!msg.guild) {
            msg.channel.send("You must run this command in a guild!")
        }
        let member = msg.guild.members.resolve(user)
        if (!member) {
            msg.channel.send("Cant resolve member!")
            return;
        }
        Mod.Sql.statements.getProfile.query({
            userid: user
        })
            .then(res => {
                if (!res.rows[0]) {
                    msg.channel.send(`No profile for <@${user}>\nTo create your own profile, run the command \`newProfile\`!`)
                    return;
                }
                msg.channel.send(
                    generateEmbed(member, res.rows[0])
                )
            })
    })

    Mod.Bot.addCommand('newprofile', (msg) => {
        Mod.Sql.statements.createProfile.query({
            userid: msg.author.id
        })
            .then(() => {
                msg.tempReply("Done! You should probably use the `setprofile` command now!")
            })
    })

    Mod.Bot.addCommand("setprofile", (msg) => {
        Mod.Sql.statements.getProfile.query({
            userid: msg.author.id
        })
            .then((rowData) => {
                if (!rowData.rows[0]) {
                    this.tempReply("You dont have a profile!")
                    return;
                }
                let values = {
                    nintendoswitch: null,
                    battlenet: null,
                    origin: null,
                    steam: null,
                    uplay: null,
                    riot: null,
                    bethesda: null,
                    epic: null,
                    description: null,
                    tagline: null,

                    huntername: null,
                    paliconame: null,
                    mainweapon: null,
                    mr: null,
                    hr: null
                }
                let temparg = msg.arguments[0] || ""
                let guidedlands = null
                if (values[temparg.toLowerCase()] !== undefined) {
                    values[temparg.toLowerCase()] = msg.arguments.slice(1).join(" ")
                } else if (temparg.toLowerCase() === "addmaxedland") {
                    guidedlands = addGuidedLand(rowData.rows[0].maxedguidedlands, msg.arguments[1])
                } else if (temparg.toLowerCase() === "removemaxedland") {
                    guidedlands = removeGuidedLand(rowData.rows[0].maxedguidedlands, msg.arguments[1])
                } else {
                    msg.tempReply(`Unknown topic ${msg.arguments[0] || ""} - Try any of \n\t${Object.keys(values).join("\n\t")}\n or \n\taddMaxedLand\n\tremoveMaxedLand\n\t\tWith value of a land\n\t\t\tForest\n\t\t\tWildspire\n\t\t\tCoral\n\t\t\tRotted\n\t\t\tVolcanic\n\t\t\tTundra`, 30000)
                    return;
                }

                let toquery = {
                    xp: null,
                    maxedguidedlands: guidedlands,
                    userid: msg.author.id,
                    ...values
                }

                Mod.Sql.statements.setProfile.query(toquery)
                    .then(() => {
                        msg.tempReply("Done!")
                    })
                    .catch((err) => {
                        msg.tempReply(`Failed!\n${err.message}\n\n*Chances are, you have written an invalid parameter!*`)
                    })
            })

    })

    Mod.Bot.addCommand("getaccounts", (msg) => {
        let connections = [
            'battlenet',
            'bethesda',
            'epic',
            'origin',
            'steam',
            'nintendoswitch',
            'uplay',
            'riot',
        ]
        if (msg.arguments[0] && connections.indexOf(msg.arguments[0].toLowerCase()) !== -1) {
            Mod.Sql.statements.getProfiles.query()
                .then(rowData => {
                    let people = []
                    rowData.rows.forEach(row => {
                        if (row[msg.arguments[0].toLowerCase()] !== null) {
                            people.push(row)
                        }
                    })
                    if (people.length === 0) {
                        msg.tempReply(`No people found for connection '${msg.arguments[0]}'`)
                    } else {
                        let descriptions = []
                        people.forEach(person => {
                            let member = msg.guild.members.resolve(person.userid)
                            descriptions.push(`${((member) ? member.displayName : "Old User").padEnd(15, " ")} ${person[msg.arguments[0]]}`)
                        })
                        let embed = new Discord.MessageEmbed()
                            .setTitle(`Users with connection ${msg.arguments[0]}`)
                            .setThumbnail(Mod.Bot.client.emojis.resolve(emojis[msg.arguments[0]].split(":")[2].slice(0, -1)).url)
                            .setDescription(`\`\`\`\n${descriptions.join("\n")}\`\`\``)
                        msg.channel.send(embed)
                    }
                })
        } else {
            msg.tempReply(`Unknown connection type '${msg.arguments[0]}' - try one of the following\n\t${connections.join("\n\t")}`)
        }
    })
}

function getGuidedLands(num) {
    /*
           1 x Forest +
           2 x Wildspire +
           4 x Coral +
           8 x Rotted +
           16 x Volcanic +
           32 x Tundra
    */
    let binary = num.toString(2)
    let lands = [
        "Forest",
        "Wildspire",
        "Coral",
        "Rotted",
        "Volcanic",
        "Tundra"
    ]
    let confirmed = []
    lands.forEach((val, index) => {
        if (Number(binary[binary.length - index - 1])) confirmed.push(val);
    })
    return confirmed
}

function addGuidedLand (num, rland) {
    let land = rland[0].toUpperCase() + rland.slice(1).toLowerCase()
    if (getGuidedLands(num).indexOf(land) !== -1) return num;
    let lands = [
        "Forest",
        "Wildspire",
        "Coral",
        "Rotted",
        "Volcanic",
        "Tundra"
    ]
    let index = lands.indexOf(land)
    if (index !== -1) {
        return num + (2 ** index)
    }
    return num
}

function removeGuidedLand (num, rland) {
    let land = rland[0].toUpperCase() + rland.slice(1).toLowerCase()
    if (getGuidedLands(num).indexOf(land) === -1) return num;
    let lands = [
        "Forest",
        "Wildspire",
        "Coral",
        "Rotted",
        "Volcanic",
        "Tundra"
    ]
    let index = lands.indexOf(land)
    if (index !== -1) {
        return num - (2 ** index)
    }
    return num
}

function generateEmbed(member, rowData) {
    let xpDat = getLevel(rowData.xp)
    let description = (rowData.description) ? `\n\n'*${rowData.description}*'` : ""
    let accounts = ""
    if (rowData.steam) accounts += `${emojis.steam}\t[${rowData.steam}](https://steamcommunity.com/id/${rowData.steam})`;
    [
        "nintendoswitch",
        "battlenet",
        "origin",
        "uplay",
        "epic",
        "bethesda",
        "riot"
    ].forEach((val) => {
        if (rowData[val]) accounts += `\n${emojis[val]}\t${rowData[val]}`;
    })
    let embed = new Discord.MessageEmbed()
        .setTitle((member)? member.displayName:"User has left")
        .setDescription(`**Exp: **${xpDat.currentXp}/${xpDat.xpToLevel}\n**LvL: **${xpDat.level}${description}`)
        .setThumbnail((member)? member.user.displayAvatarURL():null)
    if (rowData.tagline) embed.setFooter(rowData.tagline);
    if (accounts) embed.addField("Accounts", accounts);
    if (rowData.huntername) {
        //MH:W
        let mhw = `The Great team of ${rowData.huntername}`
        if (rowData.paliconame) mhw += ` and ${rowData.paliconame}`;
        if (rowData.mainweapon) mhw += `, wielding the mighty ${rowData.mainweapon},`;
        mhw += ` are creating their legacy to destroy beasts!`

        if (rowData.hr) {
            mhw += `\n**HR: **${rowData.hr}`
            if (rowData.mr) {
                mhw += `\t\t\t**MR: **${rowData.mr}`
            }
        }
        let lands = getGuidedLands(rowData.maxedguidedlands)
        if (lands.length) {
            mhw += `\n**Maxed Guided Lands: **${lands.join(", ")}`
        }
        embed.addField("MH:W", mhw)
    }
    return embed
}

function getLevel(xp) {
    //returns [level, current xp, xp to level up]
    // total xp = 5(level)^2+5
    // level = ((xp/5)-1)^(0.5)
    let level = Math.floor(Math.sqrt((xp-5)/5)) + 1 || 1
    let xpToLevel = (level === 1) ? (10) : (5*((level)**2)) - (5*((level-1)**2) )
    let currentXp = (level === 1) ? (xp) : (xp - (5*((level-1)**2) + 5))
    return {
        level: level,
        currentXp: currentXp,
        xpToLevel: xpToLevel
    }
}