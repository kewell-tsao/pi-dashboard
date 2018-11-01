'use strict'
const express = require('express')
const favicon = require('serve-favicon')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const http = require('http')
const path = require('path')
const log4js = require('log4js')
const device = require('./device')
const ejs = require('ejs')
const app = express()
const appConfig = require('./configs/app.config')
log4js.configure(require('./configs/log4js.conf'))
const appLogger = log4js.getLogger('app')
app.locals.config = appConfig
app.locals.logger = appLogger

app.engine('.html', ejs.renderFile)
app.set('views', path.join(__dirname, './views'))
app.set('view engine', 'ejs')

app.use(favicon(path.join(__dirname, 'assets/images/favicon.png')))
app.use('/robots.txt', require('./configs/robots'))
app.use(log4js.connectLogger(log4js.getLogger('http'), {level: 'auto'}))
app.use('/assets', express.static('assets'))

app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', function (req, res, next) {
  device(req).then(function (deviceInfo) {
    if (req.query['ajax']) {
      res.json(deviceInfo)
    } else {
      res.render('index', {
        device: deviceInfo
      })
    }
  }).catch(function (err) {
    next(err)
  })
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  if (res.finished) {
    return
  }
  if (req.xhr) {
    res.status(err.status || 500).end()
  } else {
    res.status(err.status || 500)
    res.render('error', {error: err})
  }

  if (err) {
    appLogger.error(JSON.stringify({
      name: err.name,
      message: err.message,
      stack: err.stack
    }))
  }
})

const port = normalizePort(process.env.PORT || '8091')
app.set('port', port)

const server = http.createServer(app)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function normalizePort (val) {
  let port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  let bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      appLogger.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      appLogger.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

function onListening () {
  let addr = server.address()
  if (typeof addr === 'string') {
    console.log('Listening on ' + addr)
  } else {
    console.log('Listening on http://localhost:' + addr.port)
  }
}
