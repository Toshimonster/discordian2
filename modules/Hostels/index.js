let config = require("../../config")

module.exports.exec = (Mod) => {

  Mod.Bot.addCommand('makehostel', (msg) => {
    if (!msg.guild) {
      msg.channel.tempSend(
        "This command must be ran in a guild"
      );
    } else if (
      msg.guild.channels.cache.has(msg.arguments[0]) &&
      msg.guild.channels.resolve(msg.arguments[0]).type === "voice"
    ) {
      Mod.Sql.statements.createHostel
        .query({
          channelid: msg.arguments[0],
          "guildid": msg.guild.id,
          roomname:
            msg.arguments.slice(2).join(" ") || "{displayName}'s room"
        })
      Mod.debug("Hostel Made!")
      msg.channel.send("Hostel Made!")
    } else {
      msg.channel.tempSend("Invalid argument")
    }
  }, "MANAGE_CHANNELS")


  Mod.Bot.addCommand('removehostel', (msg) => {
    if (!msg.guild) {
      msg.channel.tempSend(
        "This command must be ran in a guild"
      );
    } else {
      Mod.Sql.statements.removeHostels
        .query({
          guildid: msg.guild.id
        })
      msg.channel.tempSend("Done")
    }
  }, "MANAGE_CHANNELS")


  Mod.Bot.client.on("voiceStateUpdate", (oState, nState) => {
    if (nState.channel) {
      //Joined Channel
      Mod.Sql.statements.getHostel
        .query({
          channelid: nState.channel.id,
          guildid: nState.guild.id
        })
        .then(sqlData => {
          if (sqlData.rows[0]) {
            createHostel(nState, sqlData.rows[0])
          }
        })
    }
    if (oState.channel) {
      //Left channel
      if (oState.channel.members.size === 0) {
        Mod.Sql.statements.getActiveRooms
          .query({
            channelid: oState.channel.id
          })
          .then(res => {
            res.rows.forEach(vc => {
              //This acts as if row exists
              oState.channel.delete()
              Mod.Sql.statements.removeActiveRoom.query({
                channelid: oState.channel.id
              })
            })
          })
      }
    }
  })

  function createHostel(state, sqlData) {
    //Find all cases of {text} and replace with state.member[text]
    sqlData.roomname.match(/{(.*?)}/g).forEach(param => {
      sqlData.roomname = sqlData.roomname.replace(param, state.member[param.slice(1, -1)])
    })

    state.guild.channels
      .create(sqlData.roomname, {
        type: "voice",
        position: state.channel.position + 1,
        parent: state.channel.parent,
        permissionOverwrites: [
          {
            id: state.member.id,
            allow: "MANAGE_CHANNELS"
          }
        ]
      })
      .then(channel => {
        state.setChannel(channel)
        Mod.Sql.statements.createActiveRoom.query({
          channelid: channel.id,
          guildid: channel.guild.id
        })
        Mod.debug(`Added ${channel.name}`)
      })
  }
}