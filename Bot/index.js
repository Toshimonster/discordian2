const discord = require('discord.js')
const config = require('../config')


class Command {
    constructor(cmd, callback, permissionsRequired, invalidPermCallback, errorCallback, allowBot = false) {
        this.debug = require("debug")(`Cmd:${cmd}`)
        this.cmd = cmd;
        this.callback = callback;
        this.errorCallback = errorCallback;
        this.permissionRequired = permissionsRequired;
        this.invalidPermCallback = invalidPermCallback;
        this.allowBot = allowBot;
    }

    run(msg) {
        if (msg.bot && !this.allowBot) return;
        if (this.permissionRequired && msg.member) {
            if (!msg.member.permissions.has(this.permissionRequired)) {
                return this.invalidPermCallback(msg)
            }
        }
        //If bot satisfied and permissions satisfied
        this.debug(`Command executing`)
        try {
            this.callback(msg)
        } catch (error) {
            this.errorCallback(msg, error)
        }

    }
}

/**
 *Individual to each module
 *
 * @class BotController
 */
class BotController {
    /**
     *Creates an instance of BotController.
     * @param {discord.Client} client
     * @param {string} [name="Controller"]
     * @memberof BotController
     */
    constructor(client, name = "Controller") {
        this.debug = require("debug")(`Bot:${name}`)
        this.client = client
        this.commands = {}
        this.setCommandListener()
    }

    setCommandListener() {
        this.client.on("message", msg => {
            //If dosent start with prefix ignore
            if (!msg.content.startsWith(config.values.PREFIX)) return;

            /* '<PREFIX>meow is a nice sound; Yes it is'
             * args = ["is", "a", "nice", "sound;", "Yes", "it", "is"]
             * command = "meow"
             */
            const args = msg.content.slice(config.values.PREFIX.length).trim().split(/ +/g)
            const command = args.shift().toLowerCase();

            if (this.commands[command]) {
                msg.arguments = args
                msg.command = command

                this.applyMiddleware(msg)
                this.commands[command].run(msg)
            }
        })
    }

    applyMiddleware(msg) {
        msg.middleware = 'Discordian'
        msg.channel.tempSend = (content, options = {}, time = 5000) => {
            return new Promise((resolve, reject) => {
                msg.channel.send(content, options).then((newMsg) => {
                    Promise.all([
                            msg.delete({
                                timeout: time
                            }).catch(() => {}),
                            newMsg.delete({
                                timeout: time
                            }).catch(() => {}),
                        ])
                        .then(() => {
                            resolve(true);
                        })
                        .catch((e) => {
                            reject(e);
                        });
                });
            });
        };
        msg.tempReply = (content, time = 5000) => {
            return msg.channel.tempSend(
                `<@${msg.author.id}>, ${content}`, {},
                time
            );
        };
    }

    /**
     *Adds a command to be listened in any channel where the bot exists in, including dm's.
     *
     * @param {string} cmd
     * @param {function(discord.Message)} callback
     * @param {discord.PermissionResolvable} permissionRequired
     * @param {function(discord.Message)} [invalidPermCallback]
     * @memberof BotController
     */
    addCommand(cmd, callback, permissionsRequired = false, invalidPermCallback = this.invalidPerm, errorCallback = this.errorCallback, allowBot = false) {
        if (cmd !== cmd.toLowerCase()) throw Error(`Command ${cmd} has to be lowercase!`);
        this.commands[cmd] = new Command(cmd, callback, permissionsRequired, invalidPermCallback, errorCallback, allowBot)
    }

    invalidPerm(msg) {
        return new Promise((resolve, reject) => {
            msg.reply("Invalid permissions!")
                .then(reply => {
                    Promise.all([
                            msg.delete({
                                timeout: 5000}),
                            reply.delete({
                                timeout: 5000})
                        ])
                        .then(resolve)
                        .catch(reject)
                })
                .catch(reject)
        })
    }

    errorCallback(msg, error) {
        this.debug(error)
        return msg.reply(`The command has failed, giving an error of \n\`${error.message}\`\nPlease contact <@${config.values.CREATOR_ID}>`)
    }
}


class BotPool {

    /**
     *Creates an instance of BotPool.
     * @param {string} token
     * @param {object} [clientOptions={}]
     * @memberof BotPool
     */
    constructor(token, clientOptions = {}) {
        this.debug = require("debug")("Bot")
        this.controllers = {}
        this._client = new discord.Client(clientOptions)
        this._token = token

        this._client.on("ready", () => {
            this.debug(`Client logged in as '${this._client.user.tag}'`)
        })
    }

    /**
     *Attempts to login to the bot
     * @returns {promise<string>}
     * @memberof BotPool
     */
    login() {
        return this._client.login(this._token)
    }

    /**
     *Adds a bot controller to be found in BotPool.controllers
     * @param {string} name
     * @returns {BotController}
     * @memberof BotPool
     */
    addController(name) {
        return this.controllers[name] = new BotController(this._client, name)
    }
}

module.exports = BotPool