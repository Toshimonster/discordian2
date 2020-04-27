const postgres = require('pg')
const path = require('path')
const fs = require('fs')


/**
 *
 *
 * @class Statement
 */
class Statement {
    /**
     *Creates an instance of Statement.
     * @param {pg.Pool} pool
     * @param {string} query
     * @param {string} name
     * @param {boolean} [perpare=false]
     * @memberof Statement
     */
    constructor (pool, query, name, prepare=false) {
        this._debug = require('debug')(`sql:${name}`)
        this._perpared = prepare
        this._pool = pool
        this._query = query
        this._name = name
        this._keyFinder = /(\$[^ ,();\n\r]+)/g //Finds everything that starts with a $ ending with any sql specific text
        this._keys = null //Array specifying the index for the key
        this._functionalQuery = null

        this.updateKeys();
        this.updateFunctionalQuery();
    }

    /**
     *Updates the functional query for the statements
     * @returns {string}
     * @memberof Statement
     */
    updateFunctionalQuery() {
        if (!this._keys) throw Error("updateFunctionalQuery requires updateKeys to be ran before!")
        
        let tempQuery = this._query
        this._keys.forEach((key, index) => {
            tempQuery = tempQuery.replace(`$${key}`, `$${index + 1}`)
        })
        return this._functionalQuery = tempQuery
    }

    /**
     *Updates the required keys for the statement
     * @returns {array}
     * @memberof Statement
     */
    updateKeys() {
        let matched = this._query.match(this._keyFinder) || []
        //Remove initial $ in all matched
        matched.forEach((element, index, array) => {
            array[index] = element.slice(1)
        });
        return this._keys = matched
    }

    /**
     *Gets a config request for the query given a object of parameters
     * @param {object} parameters
     * @returns {object}
     * @memberof Statement
     */
    getQueryConfig(parameters) {
        if (!this._functionalQuery) throw Error("getQueryConfig requires getFunctionalQuery to be ran before!");
        let config = {
            text: this._functionalQuery,
            values: []
        }

        this._keys.forEach(key => {
            if (!parameters[key]) throw Error(`Expected key ${JSON.stringify(key)} in parameters`);
            config.values.push(parameters[key])
        })

        if (this._perpared) config.name = this._name;
        return config
    }

    /**
     *Runs the query based on a object of parameters
     * @param {object} parameters
     * @returns {promise<pg.Result>}
     * @memberof Statement
     */
    query(parameters) {
        let config = this.getQueryConfig(parameters)
        if (this._debug.enabled) {
            this._debug(`Running Query ↴\n${
                JSON.stringify(config, null, '\t')
            }`)
        }
        return this._pool.query(
            config
        )
    }

    /**
     *Runs the query based on a array of values
     *
     * @param {array} values
     * @returns {promise<pg.Result>}
     * @memberof Statement
     */
    exec(values) {
        let config = {
            text: this._query,
            values: values
        }
        if (this._perpared) config.name = this._name;
        if (this._debug.enabled) {
            this._debug(`Executing Query ↴\n${
                JSON.stringify(config, null, '\t')
            }`)
        }
        return this._pool.query(
            config
        )
    }

}

/**
 *Individual to each module
 *
 * @class SqlController
 */
class SqlController {
    /**
     *Creates an instance of SqlController.
     * @param {pg.Pool} pool
     * @param {string} [name="Controller"]
     * @memberof SqlController
     */
    constructor (pool, name="Controller") {
        this.debug = require("debug")(`Sql:${name}`)
        this.statements = {}
        this._pool = pool
    }

    /**
     *Adds a statement to be found in SqlController.statements
     * @param {string} query
     * @param {string} name
     * @param {boolean} [prepare=false]
     * @returns {Statement}
     * @memberof SqlController
     */
    addStatement (query, name, prepare=false) {
        this.debug(`Adding statement ${name}`)
        if(this.statements[name]) {
            this.debug(`Replacing already existing statement, ${name}`)
        }
        return this.statements[name] = new Statement(this._pool, query, name, prepare)
    }

    /**
     *Adds a statement from a file to be found in SqlController.statements
     * @param {string} filePath
     * @param {boolean} [perpare=false]
     * @param {boolean} [force=false]
     * @returns {Statement}
     * @memberof SqlController
     */
    addFileStatement (filePath, prepare=false, force=false) {
        let file = path.parse(filePath)
        if (file.ext.toLowerCase() !== ".sql" && !force) throw Error(`File ${file.base} is not a sql file`);
        let query = fs.readFileSync(filePath, 'utf-8')
        return this.addStatement(query, file.name, prepare)
    }

    /**
     *Executes a sql file
     * @param {string} filePath
     * @param {array} [values=[]]
     * @param {string} [nameForPrepare=undefined]
     * @returns {promise<pg.Result>}
     * @memberof SqlController
     */
    executeFile (filePath, values=[], nameForPrepare=undefined) {
        this.debug(`Executing ${filePath}`)
        let query = fs.readFileSync(filePath, 'utf-8')
        return this._pool.query({
            text: query,
            values: values,
            name: nameForPrepare
        })
    }

    /**
     *Runs a sql string
     * @param {string} sql
     * @returns {promise<pg.Result}
     * @memberof SqlController
     */
    executeQuery (sql) {
        return this._pool.query(sql)
    }

    /**
     *Initializes a ./Sql/ dir in a module, and executes if exists its init.sql,and loads if exists statements in the statements directory
     * @param {string} dirPath
     * @returns {promise<pg.Result || true>}
     * @memberof SqlController
     */
    initializeDir (dirPath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(dirPath)) reject(`Path ${dirPath} does not exist`);

            let initFile = path.join(dirPath, "init.sql");
            let statementDir = path.join(dirPath, "statements");

            if (fs.existsSync(statementDir)) {
                let statementFiles = fs.readdirSync(statementDir)
                statementFiles.forEach(statementFile => {
                    let statementPath = path.join(statementDir, statementFile)
                    this.addFileStatement(statementPath)
                })
            }

            if (fs.existsSync(initFile)) {
                this.executeFile(initFile)
                    .then(resolve)
                    .catch(reject)
            } else {
                resolve(true)
            }
        })
    }
}

/**
 *
 *
 * @class SqlPool
 */
class SqlPool {
    /**
     *Creates an instance of SqlPool.
     * @param {string} connectionString
     * @param {boolean} [ssl=false]
     * @memberof SqlPool
     */
    constructor (connectionString, ssl=false) {
        this.controllers = {}
        this._pool = new postgres.Pool({
            connectionString: connectionString,
            ssl: ssl
        })
    }

    /**
     *Adds a sql controller to be found in SqlPool.controllers
     * @param {string} name
     * @returns {SqlController}
     * @memberof SqlPool
     */
    addController (name) {
        return this.controllers[name] = new SqlController(this._pool, name)
    }

    /**
     *Tests the connection to the pool by querying NOW()
     * @returns {promise}
     * @memberof SqlController
     */
    test () {
        return this._pool.query("SELECT NOW()")
    }
}

module.exports = SqlPool