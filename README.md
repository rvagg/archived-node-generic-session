# Generic Session [![Build Status](https://secure.travis-ci.org/rvagg/node-generic-session.png)](http://travis-ci.org/rvagg/node-generic-session)

A generic session manager with a simple, pluggable, storage-backend API. Usable with or without a Node.js web server framework.

Generic Session is largely based on [redsess](https://github.com/isaacs/redsess) by Isaac Schlueter, a session manager for Redis.

## Example

```js
// server.js
var http           = require('http')
  , genericSession = require('generic-session')
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
```

```js
// client.js
var request = require('request')
  , jar     = request.jar()
  , port    = 8080

  , req     = function(url, cb) {
      request({
          url: 'http://localhost:' + port + '/' + url
        , jar: jar
        , json: true
      }, cb)
    }

req('set/foo/bar', function () {
  console.log('Set foo = bar')
  req('get/foo', function (e, res, body) {
    console.log('Fetched foo =', body)
  })
})
```

Running the two processes, we'll get:

```sh
$ node server.js &
$ node client.js
Set foo = bar
Fetched foo = bar
```

This example is available in the *examples/* directory.

## API

### genericSession(request, response, store[, options])
Will create a new `GenericSession` for the given HTTP `request` and `response` objects against the compatible `store` object (see Store API below).

GenericSession uses [Cookies](https://github.com/jed/cookies) to keep track of the session by attaching a random session id cookie to the `response` and fetching it from the `request`. Cookies can be optionally signed using [Keygrip](https://github.com/jed/keygrip).

#### Options:

 * `keys` (optional): either an `Array` of strings constituting your signing secret keys to be passed to a new instance of *Keygrip*, or you can pass in an instance of **Keygrip directly. If you pass in a `keys` instance, Keygrip must be installed.
 * `cookies` (optional): provide an instance of Cookies or a compatible cookie manager to use to manage cookies.
 * `expire` (optional, default: 2 weeks): number of seconds to set for the session cookie expiry.
 * `cookieName` (optional, default: `'s'`): the name of the session cookie.
 * `idPrefix` (optional, default: `'session:'`): the prefix of the session ID, used when interacting with the session store (see Store API below). If set to `''` then the random session token will be used as the ID.

-------------------------

### genericSession.filter(store[, options])
<strong>Also available as: genericSession.middleware(store[, options]) if that floats your boat</strong>

Returns a standard framework filter / middleware, i.e. a function with the signature `function (request, response, next)`. The filter is a simple helper that will attach a GenericSession instance to both the `request` and `reponse` with the key `session`.

-------------------------

### genericSession.MemoryStore([ options ])

***Don't use this in production.*** *This is only meant for example & testing purposes.*

A simple MemoryStore that implements the Store API (see below). Ideally a session store would be persistent and also capable of operating across multiple servers.

MemoryStore is backed by [lru-cache](https://github.com/isaacs/node-lru-cache) which is an optional dependency so it needs to be installed if you want to use this.

MemoryStore takes an optional `options` object that can be used to override the default `cache` settings for `max` and `maxAge` (e.g. provide `{ cache: { maxAge: 1000 * 60 * 60 } }`). Note that MemoryStore will ignore the `expire` option from Generic Store and will obey the `maxAge` cache option. The default is 2-weeks to match the Generic Store defaults.

-------------------------

### session.get(key[, callback])
Get the object stored as `key` for the current session in the session store. Automatically updates the expires time for this session.

If the `callback` is not provided then it will simply perform an expiry time update. If you just provide a `callback` and no `key` then it operates as an alias for `getAll()`.

`get()` is always asynchronous, if you want the data, provide a callback.

-------------------------

### session.getAll(callback)
Get all objects stored for the current session in the session store. Automatically updates the expires time for this session.

If the `callback` is not provided then it will simply perform an expiry time update.

`getAll()` is always asynchronous, if you want the data, provide a callback.

-------------------------

### session.set(key[, value][, callback])
Sets `value` as `key` for the current session in the session store. Automatically updates the expires time for this session.

If `value` is omitted then `key` will be set to `null`. `callback` may be omitted and the operation will still be performed.

`set()` is always asynchronous.

-------------------------

### session.del(key[, callback])
Deletes the property `key` from the current session in the session store. Automatically updates the expires time for this session.

If `key` is omitted then it operates as an alias for `delAll()` (beware!). `callback` may be omitted and the operation will still be performed.

`del()` is always asynchronous.

-------------------------

### session.delAll([callback])
Deletes all data for the current session in the session store.

`callback` may be omitted and the operation will still be performed.

`delAll()` is always asynchronous.

-------------------------

### session.destroy([callback])
Deletes all data for the current session in the session store and will also remove the session cookie from the client.

`callback` may be omitted and the operation will still be performed.

`destroy()` is always asynchronous.

-------------------------

## Store API

GenericSession needs somewhere to store session data! It's bundled with a `MemoryStore` (see above) but you are advised to not use it in production. When creating a GenericSession object, you should provide a compatible store that conforms to the following API. Note, it's fairly easy to wrap your favourite store/db in this API. All operations are asynchronous and a `callback` will always provided (except for `extend()`), even if the client doesn't provide one:

### store.get(id, key, expire, callback)
Return the value of `key` for the session identified by `id`, also update the expires time to `expire` seconds from now.

-------------------------

### store.getAll(id, expire, callback)
Return the an object representing all values set for the session identified by `id`, also update the expires time to `expire` seconds from now.

-------------------------

### store.set(id, key, value, expire, callback)
Set `key` to be equal to `value` for the session identified by `id`, also update the expires time to `expire` seconds from now.

-------------------------

### store.del(id, key, expire, callback)
Delete the property `key` from the session identified by `id`, also update the expires time to `expire` seconds from now.

-------------------------

### store.delAll(id, callback)
Delete all values for the session identified by `id`.

-------------------------

### store.extend(id, expire)
Update the expiry time to `expire` seconds from now for the the session identified by `id`.

## Licence

Generic Session is Copyright (c) 2012 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licenced under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.

Generic Session builds on [redsess](https://github.com/isaacs/redsess) by Isaac Schlueter.