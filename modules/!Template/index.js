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

  Mod.Bot.addCommand('yourCommandHere', (msg) => {
    /* msg now has
      .tempSend
      .tempReply
    */

    //Stuff
  })
}