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

  Mod.Bot.addCommand('profile', (msg) => {
    let user = (msg.mentions.users.firstKey()) ? msg.mentions.users.firstKey():(
      (msg.arguments[0]) ? msg.arguments[0]:msg.author.id)
    Mod.Sql.statements.getProfile.query({
      userid: user
    })
      .then(res => {
        if (!res.rows[0]) {
          msg.channel.send(`No profile for <@${user}>`)
          return;
        }
        msg.channel.send(res.rows[0])
      })
  })
}