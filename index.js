let Controller = require("./Controller")

let Ctl = new Controller()

Ctl.initializeModules("./modules/")
    .then(() => {
        Ctl.debug("Init done")
        Ctl.startBot() 
            .then(() => {
                Ctl.debug("Bot Started")
            })
    })