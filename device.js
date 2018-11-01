const _ = require('lodash')
const fs = require('fs')
const os = require('os')
const dns = require('dns')
const exec = require('child_process').exec
const Promise = require('bluebird')

function getDeviceInfo (req) {
  let now = Date.now()
  let nowSec = Math.floor(now / 1000)
  let nowMicroSec = (Date.now() % 1000) / 1000
  let device = {
    time: nowSec,
    page: {
      time: {
        start: [
          nowMicroSec,
          nowSec
        ]
      }
    },
    version: '1.0.0',
    model: get_device_model(),
    user: get_current_user(),
    hostname: os.hostname,
    hostip: '',
    yourip: get_request_ip(req),
    uname: '',
    uptime: os.uptime(),
    os: get_os(),
    cpu: {},
    mem: {},
    load_avg: [0, 0, 0, '0/0'],
    disk: {},
    net: {}
  }

  let tasks = []
  tasks.push(get_hostip(req.hostname).then(function (hostip) {
    device.hostip = hostip
  }))
  tasks.push(get_uname().then(function (uname) {
    device.uname = uname
  }))
  tasks.push(get_cpu().then(function (cpu) {
    device.cpu = cpu
  }))
  tasks.push(get_mem().then(function (mem) {
    device.mem = mem
  }))
  tasks.push(get_load_avg().then(function (load_avg) {
    device.load_avg = load_avg
  }))
  tasks.push(get_disk().then(function (disk) {
    device.disk = disk
  }))
  tasks.push(get_net().then(function (net) {
    device.net = net
  }))

  return Promise.all(tasks)
    .then(function () {
      return Promise.resolve(device)
    })
}

function get_device_model () {
  return {
    name: 'Raspberry Pi',
    id: 'raspberry-pi'
  }
}

function get_current_user () {
  let user = os.userInfo()
  return user ? user.username : ''
}

function get_hostname (req) {
  return req.hostname
}

function get_hostip (hostname) {
  return new Promise(function (resolve, reject) {
    let isIP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])((\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}|(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){5})$/
    if (isIP.test(hostname)) {
      return resolve(hostname)
    }
    dns.lookup(hostname, function (err, address, family) {
      if (err) {
        resolve('')
      } else {
        resolve(address)
      }
    })
  })
}

function get_request_ip (req) {
  return req.get('X-Real-IP') ||
    req.get('X-Forwarded-For') ||
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
}

function get_uname () {
  return new Promise(function (resolve, reject) {
    let platform = os.platform()
    if (platform !== 'linux') {
      return resolve(platform)
    }
    exec('uname -a', function (error, stdout, stderr) {
      if (error) {
        resolve(platform)
      } else {
        resolve(_.replace(stdout, '\n', ''))
      }
    })
  })
}

function get_os () {
  return [
    os.type(),
    os.release()
  ]
}

function get_cpu () {
  let cpus = os.cpus()
  let cpu = {
    freq: cpus[0].speed,
    count: cpus.length,
    model: cpus.length > 1 ? (cpus[0].model + ' x' + cpus.length) : cpus[0].model,
    stat: {
      user: cpus[0].times.user,
      nice: cpus[0].times.nice,
      sys: cpus[0].times.sys,
      idle: cpus[0].times.idle,
      iowait: 0,
      irq: cpus[0].times.irq,
      softirq: 0
    },
    temp: 0
  }
  return Promise.all([
    new Promise(function (resolve, reject) {
      fs.readFile('/proc/stat', 'utf8', function (err, data) {
        if (!err) {
          const regex = /^[a-zA-Z0-9]+\s+(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s/s
          let matches = regex.exec(data)
          if (matches) {
            cpu.stat.user = matches[1]
            cpu.stat.nice = matches[2]
            cpu.stat.sys = matches[3]
            cpu.stat.idle = matches[4]
            cpu.stat.iowait = matches[5]
            cpu.stat.irq = matches[6]
            cpu.stat.softirq = matches[7]
          }
        }
        resolve(cpu)
      })
    }),
    new Promise(function (resolve, reject) {
      fs.readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8', function (err, data) {
        if (!err) {
          cpu.temp = parseInt(data)
        }
        resolve(cpu)
      })
    })
  ]).then(function () {
    return Promise.resolve(cpu)
  })
}

function get_mem () {
  let mem = {
    total: os.totalmem(),
    free: os.freemem(),
    buffers: 0,
    cached: 0,
    cached_percent: 0,
    used: 0,
    percent: 0,
    real: {
      used: 0,
      free: 0,
      percent: 0
    },
    swap: {
      total: 0,
      used: 0,
      free: 0,
      percent: 0
    }
  }
  return new Promise(function (resolve, reject) {
    fs.readFile('/proc/meminfo', 'utf8', function (err, data) {
      if (!err) {
        let reg1 = /MemTotal\s{0,}\:+\s{0,}([\d\.]+).+?MemFree\s{0,}\:+\s{0,}([\d\.]+).+?Cached\s{0,}\:+\s{0,}([\d\.]+).+?SwapTotal\s{0,}\:+\s{0,}([\d\.]+).+?SwapFree\s{0,}\:+\s{0,}([\d\.]+)/s
        let reg2 = /Buffers\s{0,}\:+\s{0,}([\d\.]+)/s
        let buf = reg1.exec(data)
        let buffers = reg2.exec(data)
        mem['total'] = _.round(buf[1] / 1024, 2)
        mem['free'] = _.round(buf[2] / 1024, 2)
        mem['buffers'] = _.round(buffers[1] / 1024, 2)
        mem['cached'] = _.round(buf[3] / 1024, 2)
        mem['cached_percent'] = (mem['cached'] != 0) ? _.round(mem['cached'] / mem['total'] * 100, 2) : 0
        mem['used'] = mem['total'] - mem['free']
        mem['percent'] = (mem['total'] != 0) ? _.round(mem['used'] / mem['total'] * 100, 2) : 0
        mem['real']['used'] = mem['total'] - mem['free'] - mem['cached'] - mem['buffers']
        mem['real']['free'] = _.round(mem['total'] - mem['real']['used'], 2)
        mem['real']['percent'] = (mem['total'] != 0) ? _.round(mem['real']['used'] / mem['total'] * 100, 2) : 0
        mem['swap']['total'] = _.round(buf[4] / 1024, 2)
        mem['swap']['free'] = _.round(buf[5] / 1024, 2)
        mem['swap']['used'] = _.round(mem['swap']['total'] - mem['swap']['free'], 2)
        mem['swap']['percent'] = (mem['swap']['total'] != 0) ? _.round(mem['swap']['used'] / mem['swap']['total'] * 100, 2) : 0
      }
      resolve(mem)
    })
  })
}

function get_load_avg () {
  let load_avg = _.concat(os.loadavg(), '0/0')
  return new Promise(function (resolve, reject) {
    fs.readFile('/proc/loadavg', 'utf8', function (err, data) {
      if (!err) {
        load_avg = _.chunk(data.split(' '), 4)[0]
      }
      resolve(load_avg)
    })
  })
}

function get_disk () {
  let disk = {
    total: 0,
    free: 0,
    used: 0,
    percent: 0,
  }
  return new Promise(function (resolve, reject) {
    let platform = os.platform()
    if (platform !== 'linux') {
      return resolve(disk)
    }

    exec('df --local --total --block-size=K', function (error, stdout, stderr) {
      if (!error) {
        const regex = /^total\s+(\d+)K\s+(\d+)K\s+(\d+)K\s+(\d+)%/m
        let matches = regex.exec(stdout)
        if (matches) {
          disk.total = _.round(parseInt(matches[1]) / (1024 * 1024), 3)
          disk.used = _.round(parseInt(matches[2]) / (1024 * 1024), 3)
          disk.free = _.round(parseInt(matches[3]) / (1024 * 1024), 3)
          disk.percent = parseInt(matches[3]) / 100
        }
      }
      resolve(disk)
    })
  })
}

function get_net () {
  let net = {
    count: 0,
    interfaces: []
  }
  return new Promise(function (resolve, reject) {
    fs.readFile('/proc/net/dev', 'utf8', function (err, data) {
      if (!err) {
        let lines = _.split(data, '\n')
        let reg = /([^\s]+):[\s]{0,}(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/
        for (let i = 2; i < lines.length; i++) {
          let matches = reg.exec(lines[i])
          if (matches) {
            net.interfaces.push({
              name: matches[1],
              total_in: matches[2],
              total_out: matches[10]
            })
          }
        }
        net.count = net.interfaces.length
      }
      resolve(net)
    })
  })
}

module.exports = getDeviceInfo
