let config = require("../../config")

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

  Mod.Bot.addCommand('addnewrole', (msg) => {
    if (msg.guild.roles.cache.has(msg.arguments[0])) {
      Mod.Sql.statements.addRole
        .query({
          guildid: msg.guild.id,
          roleid: msg.arguments[0],
        })
        .then(() => {
          msg.tempReply("Done!");
        });
    } else {
      msg.channel.tempSend("Invalid argument!");
    }
  }, "ADMINISTRATOR")

  Mod.Bot.addCommand('removenewroles', (msg) => {
    Mod.Sql.statements.removeRoles
      .query({
        guildid: msg.guild.id,
      })
      .then(() => {
        msg.tempReply("Done!");
      });
  }, "ADMINISTRATOR")


  Mod.Bot.client.on("guildMemberAdd", (member) => {
    if (!member.bot) {
      Mod.Sql.statements.getRoles
        .query({
          guildid: member.guild.id
        })
        .then(res => {
          let roles = []
          res.rows.forEach(roleData => {
            roles.push(roleData.roleid)
          });
          Mod.debug(`Adding ${roles.join(", ") || "No"} Role(s) from guild ${member.guild.id}`)
          if (roles.length !== 0) {
            member.roles.add(roles)
          }
        })
    }
  })
}