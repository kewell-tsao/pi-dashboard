const _ = require('lodash')
const fs = require('fs')
const path = require('path')

function isProduction () {
  let env = _.trim(process.env['NODE_ENV'] || 'development').toLowerCase()
  switch (env) {
    case 'prod':
    case 'production':
      return true
    case 'dev':
    case 'development':
    default:
      return false
  }
}

function mergeConfig (config, configName) {
  let configFiles = [configName + '.secret.js']
  if (isProduction()) {
    configFiles.push(configName + '.prod.config.js')
    configFiles.push(configName + '.prod.secret.js')
  } else {
    configFiles.push(configName + '.dev.config.js')
    configFiles.push(configName + '.dev.secret.js')
  }
  _.forEach(configFiles, function (configFile) {
    if (fs.existsSync(configFile)) {
      let configObj = require(configFile)
      if (_.isFunction(configObj)) {
        config = configObj(config)
      } else if (_.isObject(configObj)) {
        config = _.merge(config, configObj)
      }
    }
  })
}

function projectRoot (p) {
  return path.join(__dirname + '/../', p)
}

module.exports = {
  isProduction,
  mergeConfig,
  projectRoot
}
