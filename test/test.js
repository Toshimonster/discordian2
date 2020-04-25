let Controller = require("../Controller")

describe("Controller", function() {
    describe("#constructor()", function() {
        it("Should construct without error", function(done) {
            let controller = new Controller();
            done()
        })
    })
    describe("#sqlPool", function() {
        it("Should be able to be connected", function(done) {
            let controller = new Controller();
            controller.sqlPool.test()
                .then(done)
                .catch(done)
        })
    })
})