/*exists(module) : bool
values.prefix : str*/
require("dotenv").config()
let Path = require("path")
let fs = require("fs")

class Config {
    /**
     *Creates an instance of Config.
     * @param {string} configDir
     * @memberof Config
     */
    constructor (configDir) {
        this._configDir = configDir
        this.values = process.env
        this.enabled = []

        this.parseEnabled()
    }

    /**
     *
     *
     * @param {string} [fileName="enabled.json"]
     * @returns {array}
     * @memberof Config
     */
    parseEnabled (fileName = "enabled.json") {
        return this.enabled = JSON.parse(
            fs.readFileSync(
                Path.join(this._configDir, fileName)
            )
        )
    }

    /**
     *Returns whether the module is enabled in the config
     * @param {string} module
     * @returns {boolean}
     * @memberof Config
     */
    isEnabled (module) {
        return this.enabled.includes(module)
    }
}

module.exports = new Config(process.env.CONFIG_DIR || "./config")