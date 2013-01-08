const extend = require('util')._extend

var MemoryStore = {
        get: function (id, key, expire, callback) {
          var value = this._forId(id, expire)[key]
          process.nextTick(callback.bind(null, null, value))
        }

      , getAll: function (id, expire, callback) {
          var values = this._forId(id, expire)
            , ret    = extend({}, values)

          process.nextTick(callback.bind(null, null, ret))
        }

      , set: function (id, key, value, expire, callback) {
          this._forId(id, expire)[key] = value
          process.nextTick(callback)
        }

      , extend: function (id, expire) {
          this._forId(id, expire)
        }

      , del: function (id, key, expire, callback) {
          delete this._forId(id, expire)[key]
          process.nextTick(callback)
        }

      , delAll: function (id, callback) {
          delete this._expires[id]
          delete this._stores[id]
          process.nextTick(callback)
        }

      , _forId: function (id, expire) {
          if (expire)
            this._expires[id] = expire
          return this._stores[id] || (this._stores[id] = Object.create(null))
        }
    }

  , create = function () {
      var store = Object.create(MemoryStore, {
          _expires : { value : Object.create(null) }
        , _stores  : { value : Object.create(null) }
      })

      return store
    }

module.exports = create