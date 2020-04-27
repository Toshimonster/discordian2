let config = require("../../config")
const discord = require("discord.js")
const moment = require("moment")

module.exports.exec = (Mod) => {

  Mod.Bot.addCommand('seteventboard', (msg) => {
    if (
      msg.arguments[0] &&
      msg.guild.channels.cache.has(msg.arguments[0]) &&
      msg.guild.channels.resolve(msg.arguments[0]).type === "text"
    ) {
      //Delete old data
      let sqlPromises = [
        Mod.Sql.statements.removeGuildSignups.query({
          guildid: msg.guild.id
        }),
        Mod.Sql.statements.removeGuildEvents.query({
          guildid: msg.guild.id
        }),
        Mod.Sql.statements.removeGuildBoard.query({
          guildid: msg.guild.id
        }),
        //Create the table
        Mod.Sql.statements.createEventBoard.query({
          guildid: msg.guild.id,
          channelid: msg.arguments[0]
        })
      ];
      Promise.all(sqlPromises)
        .then(() => {
          msg.channel.tempSend("EventBoard set")
          Mod.debug(`New eventboard set for ${msg.guild.id}`)
        })
    } else {
      msg.channel.tempSend("Invalid argument")
    }
  }, 'MANAGE_CHANNELS')


  Mod.Bot.addCommand('removeeventboard', (msg) => {
    //Delete old data
    let sqlPromises = [
      Mod.Sql.statements.removeGuildSignups.query({
        guildid: msg.guild.id
      }),
      Mod.Sql.statements.removeGuildEvents.query({
        guildid: msg.guild.id
      }),
      Mod.Sql.statements.removeGuildBoard.query({
        guildid: msg.guild.id
      })
    ];
    Promise.all(sqlPromises)
      .then(() => {
        msg.channel.tempSend("EventBoard removed")
        Mod.debug(`Removed eventboard set for ${msg.guild.id}`)
      })
  }, 'MANAGE_CHANNELS')


  Mod.Bot.addCommand('postevent', (msg) => {
    Mod.Sql.statements.getEventBoard.query({
        guildid: msg.guild.id
      })
      .then(res => {
        let data = res.rows[0];
        if (!data) {
          msg.channel.tempSend("There is no eventboard in this guild!");
          return;
        }
        let channelId = data.channelid

        let args = msg.arguments.join(" ").split("|");
        let name = args[0] || "No Name Set";
        let description = args[1] || "No Description Set";
        let timeArgs = args[2]
        let time = moment(timeArgs, "DD-MM-YYYY HH:mm A").toDate()
        let maxPlayers = Number(args[3] || 5);

        if (isNaN(time)) {
          msg.channel.tempSend(
            "Invalid Time! Ensure format of `DD-MM-YYYY HH:mm AM/PM`!"
          );
        } else if (isNaN(maxPlayers) || !Number.isInteger(maxPlayers) || Number(maxPlayers) <= 0) {
          msg.channel.tempSend(
            "Invalid Max Players! Remember to have it as a positive integer!"
          );
        } else {
          msg.tempReply("Event Made!")
          msg.guild.channels.resolve(channelId)
            .send("Creating Event... <:thonk:700285084900524112>")
            .then(msg => {
              msg.react("➕");
              Mod.Sql.statements.addEvent.query({
                  messageid: msg.id,
                  channelid: channelId,
                  name: name,
                  description: description,
                  time: time,
                  maxplayers: maxPlayers,
                })
                .then(() => {
                  updateEvent(msg.id)
                })
            })

        }
      })
  })

  Mod.Bot.client.on("messageReactionAdd", (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name === "➕") {
      Mod.Sql.statements.getEvent.query({
          messageid: reaction.message.id
        })
        .then(res => {
          res.rows.forEach(() => {
            //If row exists
            Mod.Sql.statements.addSignup.query({
                userid: user.id,
                eventid: reaction.message.id
              })
              .then(() => {
                updateEvent(reaction.message.id)
                  .then(() => {
                    Mod.debug("Added event user")
                  })
              })
          })
        })
    }
  })

  Mod.Bot.client.on("messageReactionRemove", (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name === "➕") {
      Mod.Sql.statements.getEvent.query({
          messageid: reaction.message.id
        })
        .then(res => {
          res.rows.forEach(() => {
            //If row exists
            Mod.Sql.statements.removeSignup.query({
                userid: user.id,
                eventid: reaction.message.id
              })
              .then(() => {
                updateEvent(reaction.message.id)
                  .then(() => {
                    Mod.debug("Removed event user")
                  })
              })
          })
        })
    }
  })

  Mod.Bot.client.on("ready", () => {
    //Find all events and update them
    Mod.Sql.statements.getEvents.query()
      .then(res => {
        res.rows.forEach(event => {
          try {
            Mod.Bot.client.channels.fetch(event.channelid)
              .catch(e => {
                Mod.debug("Could not find channel, assuming it has been deleted")
              })
              .then(channel => {
                channel.messages.fetch(event.messageid)
                  .catch(e => {
                    Mod.debug("Could not find message, assuming it has been deleted")
                  })
                  .then(msg => {
                    if (!msg) {
                      Mod.debug("Assuming message has been deleted as undefined")
                      return;
                    }
                    msg.reactions.resolve("➕").users.fetch()
                      .then(users => {
                        //Add Signups
                        users.forEach(user => {
                          if (user.bot) return;
                          Mod.Sql.statements.addSignup.query({
                              userid: user.id,
                              eventid: event.messageid
                            })
                            .then(() => {
                              Mod.debug(`Adding old reactor ${user.id} to event ${event.messageid} if does not exist`)
                            })
                        })
                        //Remove signups
                        Mod.Sql.statements.getSignups.query({
                            eventid: event.messageid
                          })
                          .then(res => {
                            let sqlPromises = []
                            res.rows.forEach(signup => {
                              if (!users.has(signup.userid)) {
                                sqlPromises.push(
                                  Mod.Sql.statements.removeSignup.query({
                                    userid: signup.userid,
                                    eventid: event.messageid
                                  })
                                )
                              }
                            });
                            Promise.all(sqlPromises)
                              .then(() => {
                                //Finally update the event
                                updateEvent(event.messageid)
                              })
                          })
                      })
                  })
              })
          } catch (error) {
            Mod.debug(error)
          }
        })
      })
  })

  Mod.Bot.client.setInterval(pollEvents, config.values.EVENT_POLLING_RATE || 5000) //ms - 5 sec






  function pollEvents () {
    Mod.debug("Poll executing")

    let events = {};
    Mod.Sql.statements.getExpiredEvents.query()
      .then(res => {
        let events = {}
        //Populate events
        res.rows.forEach(event => {
          if (!events[event.messageid]) //If dosent already exist, set field for event, as expired events gets all signups too.
            events[event.messageid] = {
              name: event.name,
              channelId: event.eventboardid,
              joined: [],
              alts: [],
            };
          
          if (event.userid) {
            //If exists
            if (event.alternative) {
              events[event.messageid].alts.push(`<@${event.userid}>`)
            } else {
              events[event.messageid].joined.push(`<@${event.userid}>`)
            }
          }
        });
        //Events now populated
        Object.keys(events).forEach(eventKey => {
          Mod.Bot.client.channels.fetch(
            events[eventKey].channelId
          )
            .catch(e => {Mod.debug("Assumed channel has been deleted")})
            .then(channel => {
              channel.messages.fetch(
                eventKey
              )
                .catch(e => {Mod.debug("Assumed message has been deleted")})
                .then(msg => {
                  if (!msg) {
                    Mod.debug("Assumed message has been deleted as undefined")
                    return;
                  }
                  msg.delete()

                  msg.channel.send(
                    `Calling: ${
                      events[eventKey].joined.join(", ") || "None"
                    }\nFor ${
                      events[eventKey].name
                    }\nWith Alternatives: ${
                      events[eventKey].alts.join(", ") || "None"
                    }`
                  )
                    .then(msg => {
                      msg.delete({
                        timeout: 1000 * 5 * 60 //5 min
                      })
                    })
                })
            })
        })
        //Delete expired
        Mod.Sql.statements.removeExpiredSignups.query();
        Mod.Sql.statements.removeExpiredEvents.query();
      })
  }

  function updateEvent(eventId) {
    Mod.debug(`Updating event ${eventId}`)
    return new Promise((resolve, reject) => {
      Mod.Sql.statements.getEvent.query({
          messageid: eventId
        })
        .catch(reject)
        .then(res => {
          if (!res.rows[0]) reject("eventId does not exist");
          constructEventEmbed(res.rows[0])
            .catch(reject)
            .then(embed => {
              Mod.Bot.client.channels.fetch(res.rows[0].channelid)
                .then(channel => { 
                  channel.messages.fetch(eventId)
                    .catch(reject)
                    .then(msg => {
                      msg.edit('', embed)
                        .catch(reject)
                        .then(resolve)
                    })
                })
            })
        })
    })
  }

  function constructEventEmbed(eventData) {
    return new Promise((resolve, reject) => {

      getSignups(eventData)
        .catch(reject)
        .then(([users, alts]) => {
          let time = moment(eventData.time)

          let embed = new discord.MessageEmbed()
            .setTitle(eventData.name)
            .setDescription(eventData.description)
            .setTimestamp(eventData.time)
            .addFields([{
                name: "Users Joined:",
                value: users.join(", ") || "None",
                inline: true
              },
              {
                name: "Alternatives:",
                value: alts.join(", ") || "None",
                inline: true
              },
              {
                name: `${users.length}/${eventData.maxplayers}`,
                value: time.format("Do MMM YYYY h:mm a"),
                inline: false
              }
            ])

          resolve(embed)
        })
    })
  }

  function getSignups(eventData) {
    return new Promise((resolve, reject) => {
      let users = []
      let alts = []

      Mod.Sql.statements.getSignups.query({
          eventid: eventData.messageid
        })
        .catch(reject)
        .then(res => {
          res.rows.forEach((signup) => {
            if (signup.alternative) {
              alts.push(
                Mod.Bot.client.users.fetch(signup.userid)
              )
            } else {
              users.push(
                Mod.Bot.client.users.fetch(signup.userid)
              )
            }
          })
          Promise.all(users)
            .catch(reject)
            .then(users => {
              users.forEach((user, index) => {
                users[index] = user.username
              })

              Promise.all(alts)
                .catch(reject)
                .then(alts => {
                  alts.forEach((alt, index) => {
                    alts[index] = alt.username
                  })

                  resolve([users, alts])
                })
            })
        })
    })

  }
}