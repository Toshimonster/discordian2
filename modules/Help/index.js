let discord = require("discord.js")
let config = require("../../config")

module.exports.exec = (Mod) => {
  //Controller
  //Controller.Sql => sql controller
  //Controller.Bot => bot controller

  Mod.Bot.addCommand('help', (msg) => {
    createHelpEmbed(msg)
      .catch(e => Mod.debug(e))
      .then(embed => {
        if (msg.channel.type !== "dm") {
          msg.tempReply("\nSent you a DM with details!")
        }
        msg.author.send(embed)
      })
  })

  function createHelpEmbed(msg) {
    return new Promise((resolve, reject) => {
      let embed = new discord.MessageEmbed().setTitle("❓ Help ❓")
      let promise = null
  
      if (msg.arguments.length === 0) {
        //Just show module names
        promise = defaultHelpEmbed(embed)
      } else {
        promise = commandHelpEmbed(embed, msg)
      }
  
      promise
        .then(resolve)
        .catch(reject)
    })
  }
  
  function defaultHelpEmbed(embed) {
    return new Promise((resolve, reject) => {
      Mod.Sql.statements.allModules.query()
        .then((res) => {
          //Get unique array items
          res.rows.forEach(module => {
            embed.addField(module.modulename, module.description)
          });
  
          embed.setFooter(
            "Run the help command with a module name to see its commands"
          );
  
          resolve(embed)
        })
        .catch(reject)
    })
  }
  
  function commandHelpEmbed(embed, msg) {
    return new Promise((resolve, reject) => {
      Mod.Sql.statements.allCommands.query({
          modulename: msg.arguments.join(" ")
        })
        .catch(reject)
        .then((res) => {
          //Get commands
          embed.setTitle(`${embed.title} | ⚙ ${msg.arguments[0]} ⚙`);
          if (res.rows.length === 0) {
            embed.addField("No commands!", "🤔");
          } else {
            res.rows.forEach((command) => {
              embed.addField(
                command.commandname,
                `${command.description}\n\`${
                  process.env.PREFIX + command.syntax
                }\``
              );
            });
          }
          resolve(embed)
        })
    })
  }
}