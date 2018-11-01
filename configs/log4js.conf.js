const utils = require('./utils')

let log4jsConfig = {
  appenders: {
    console: {
      type: 'console'
    },
    file: {
      type: 'file',
      filename: 'logs/app.log',
      maxLogSize: 1024 * 1024 * 100,
      backups: 10,
      compress: false,
      encoding : 'utf-8'
    }
  },
  categories: {
    default: {
      appenders: ['console', 'file'],
      level: 'warn'
    },
    http: {
      appenders: ['console'],
      level: 'debug'
    }
  }
}

utils.mergeConfig(log4jsConfig, __dirname + '/log4js')

module.exports = log4jsConfig
