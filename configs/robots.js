module.exports = function (req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.set('Content-Type', 'text/plain')
    res.send('# robots.txt\nUser-agent: *\nDisallow: /\n')
  } else {
    next()
  }
}
