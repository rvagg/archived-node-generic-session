var http           = require('http')
  , genericSession = require('../')
  , store          = genericSession.MemoryStore()
  , port           = 8080

http.createServer(function (req, res) {
  var session = genericSession(req, res, store)
    , m

  res.writeHead(200)

  if (m = req.url.match(/^\/get\/(.+)/)) {
    return session.get(m[1], function (err, data) {
      res.end(JSON.stringify(data))
    })
  } else if (m = req.url.match(/^\/set\/([^\/]+)\/(.+)/)) {
    return session.set(m[1], m[2], function () {
      res.end(JSON.stringify(m[2]))
    })
  }
  res.end('ERROR')
}).listen(port)
