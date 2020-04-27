let util = require("util")
let config = require("../../config")

module.exports.exec = (Mod) => {
  //Controller
  //Controller.Sql => sql controller
  //Controller.Bot => bot controller

  Mod.Bot.addCommand('ping', (msg) => {
    let time = Date.now()
    msg.reply("Pong!")
      .then((msg) => {
        msg.edit(`${msg.content}  \`Took ${Date.now() - time}ms\``)
      })
  })

  Mod.Bot.addCommand('eval', (msg) => {
    if (msg.author.id == config.values.CREATOR_ID) {
      //Is me
      try {
        let evalu = eval(msg.arguments.join(" "));
        if (typeof evalu !== "string") {
          msg.channel.send(clean(util.inspect(evalu)), {
            code: "js"
          });
          if (evalu instanceof Promise) {
            evalu
              .catch((err) => {
                msg.channel.send(`**Catch**:\n\`\`\`js\n${clean(util.inspect(err))}\`\`\``)
              })
              .then((res) => {
                msg.channel.send(`**Then**:\n\`\`\`js\n${clean(util.inspect(res))}\`\`\``)
              })
          }
        } else {
          msg.channel.send(evalu)
        }
      } catch (error) {
        msg.channel.send(`**ERROR**:\n\`\`\`js\n${clean(error)}\`\`\``)
      }
    }
  })

  Mod.Bot.addCommand('sql', (msg) => {
    if (msg.author.id == config.values.CREATOR_ID) {
        //Is me
        try {
          Mod.Sql.executeQuery(msg.arguments.join(" "))
            .then(evalu => {
              if (typeof evalu !== "string") {
                msg.channel.send(clean(util.inspect(evalu.rows)), {code: "js"});
              } else {
                msg.channel.send(evalu.rows)
              }
            })
            .catch(err => {
              msg.channel.send(`**ERROR**:\n\`\`\`js\n${clean(err)}\`\`\``)
            })
        } catch (error) {
          msg.channel.send(`**ERROR**:\n\`\`\`js\n${clean(error)}\`\`\``)
        }
      
    }
  })

  /**
   *Cleans text from a eval so it is safe to send
   * @param {string} text
   * @returns {string}
   */
  function clean(text) {
    if (typeof (text) !== 'string') {
      text = util.inspect(text, {
        depth: 0
      });
    }
    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203))
      .replace(Mod.Bot.client.token, "<TOKEN>")
      .replace(process.env.DATABASE_URL, "<PG_URL>")

    if (text.length > 1800) {
      text = text.slice(0, 1800) + "\n\n ... "
    }

    return text
  }
}