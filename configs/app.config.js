const utils = require('./utils')
let appConfig = {
}
utils.mergeConfig(appConfig, __dirname + '/app')

module.exports = appConfig