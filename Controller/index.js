const fs = require("fs")
const path = require("path")
const config = require("../config")
const sqlPool = require("../Sql")
const botPool = require("../Bot")

class Controller {
    constructor() {
        this.debug = require("debug")("Controller")
        this.sqlPool = new sqlPool(
            config.values.DATABASE_URL, !config.values.USE_HTTP
        )
        this.botPool = new botPool(
            config.values.TOKEN
        )
        this.modules = []
    }

    initializeModule (moduleDirectory, moduleName) {
        return new Promise((resolve, reject) => {
            console.log()
            if (config.isEnabled(moduleName)) {
                this.debug(`Initializing ${moduleName}`)
    
                let modulePath = path.join(moduleDirectory, moduleName)
    
                //Controller init
                let botController = this.botPool.addController(moduleName)
                let sqlController = this.sqlPool.addController(moduleName)
                sqlController.initializeDir(path.join(modulePath, "SQL"))
                    .then(() => {
                        try {
                            this.modules[moduleName] = require(`../${modulePath.replace("\\", "/")}`)
                        } catch (error) {
                            reject(error)
                        }
                        let controllers = {
                            Sql: sqlController,
                            Bot: botController,
                            debug: require("debug")(`module:${moduleName}`)
                        }
                        this.debug(`Executing ${moduleName}`)
                        this.modules[moduleName].exec(controllers)
                        resolve(true)
                    })
                    .catch(reject)
            }
        })
    }

    initializeModules (moduleDirectory) {
        return new Promise((resolve, reject) => {
            this.debug(`Initializing modules in ${moduleDirectory}`)
            let promises = []

            if (!fs.existsSync(moduleDirectory)) reject(Error(`Directory ${moduleDirectory} does not exist`));

            let modules = fs.readdirSync(moduleDirectory)
            modules.forEach(module => {
                promises.push(this.initializeModule(moduleDirectory, module))
            })

            Promise.all(promises)
                .then(resolve)
                .catch(reject)
        })
    }

    startBot () {
        return this.botPool.login()
    }
}

module.exports = Controller