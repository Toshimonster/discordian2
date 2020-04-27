let config = require("../../config")
const got = require("got")
const url = require("url")
const discord = require("discord.js")

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

  Mod.Bot.addCommand('makeembed', (msg) => {
    /* msg now has
      .tempSend
      .tempReply
    */
    let id = appIdFromLink(msg.arguments[0])
    if (id) {
      embedFromId(id)
        .then( embed => {
          msg.channel.send(embed)
        })
    }


    //Stuff
  })

  function embedFromId (appId, numInterested=0) {
    return new Promise((resolve, reject) => {
      steamApi(appId)
        .catch(reject)
        .then((data) => {
          if (data[appId] && data[appId].success == true) {
            data = data[appId].data
            let embed = new discord.MessageEmbed()
              .setTitle(data.name)
              .setURL(data.website)
              .setDescription(data.short_description)
              .setTimestamp()
            if (data.metacritic) {
              embed.addField(
                "Metacritic",
                `[${data.metacritic.score}/100](${data.metacritic.url})`,
                true
              )
            }
            embed.addFields([{
              name: "Price",
              value: (data.is_free) ? 
                "Free":((data.price_overview.discount_percent) ? 
                  `~~${data.price_overview.initial_formatted}~~ **${data.price_overview.final_formatted}** *(${data.price_overview.discount_percent}% off)*`:data.price_overview.final_formatted
                ),
              inline: true
            },
            {
              name: "Supports",
              value: `${(data.platforms.windows) ? "Windows":"~~Windows~~"}, ${(data.platforms.mac) ? "Mac":"~~Mac~~"}, ${(data.platforms.linux) ? "Linux":"~~Linux~~"}`,
              inline: true
            },
            {
              name: "Age",
              value: (data.required_age) ? `${data.required_age}+`:"All Ages"
            }])
            embed.setImage(data.header_image)
              .setFooter(`${numInterested} People Interested | Last Updated: `)
            
            resolve(embed)  

          } else {
            console.log(data)
            reject(Error("Steam does not recognise the request"))
          }
        })
    })
  }

  function steamApi (appId) {
    return new Promise((resolve, reject) => {
      got(`https://store.steampowered.com/api/appdetails?appids=${appId}`)
        .catch(reject)
        .then(data => {
          try {
            resolve(JSON.parse(data.body))
          } catch (error) {
            reject(error)
          }
        })
    })
  }

  function appIdFromLink (link) {
    try {
      return String(Number(url.parse(link).path.split("/")[2]) || '')
    } catch (error) {
      return ''
    }
  }
}