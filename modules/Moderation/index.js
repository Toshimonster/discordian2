let config = require("../../config")

module.exports.exec = (Mod) => {

  Mod.Bot.addCommand('purge', (msg) => {
    if (msg.channel.type == "text") {
      if (Number(msg.arguments[0]) > 100 || Number(msg.arguments[0]) < 0)
        msg.arguments[0] = "100";
      msg.channel
        .bulkDelete(Number(msg.arguments[0]) || 100)
          .then((msgs) => {
            msg.channel.tempSend(`Purged ${msgs.size} messages!`);
          })
          .catch((e) => {
            msg.channel.tempSend(
              `Messages exist that are more than 2 weeks old!`
            );
          });
    } else {
      msg.channel.tempSend("This command cant be run in a dm")
    }
  }, "MANAGE_MESSAGES")
}