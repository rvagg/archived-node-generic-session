/*
 * A Generic Session Store that uses lru-cache as a back-end.
 * You should probably *not* use this in production, it's not particularly efficient
 * and your sessions will start to disappear before their max-age if you start to
 * fill up your allocated memory.
 */

const DEFAULT_CACHE_OPTIONS = {
        max    : 1024 * 1024 * 64                 // a truck-load
      , length : function (s) { return s.length }
      , maxAge : 1000 * 60 * 60 * 24 * 7 * 2      // 2 weeks
    }

const extend = require('util')._extend

var LRU
try {
  LRU = require('lru-cache')
} catch (e) {}

var MemoryStore = {
        get: function (id, key, expire, callback) {
          this.getAll(id, expire, function (err, value) {
            process.nextTick(callback.bind(null, null, value ? value[key] : null))
          })
        }

      , getAll: function (id, expire, callback) {
          var obj = this._cache.get(id) || '{}'
          this._cache.set(id, obj) // always update age
          process.nextTick(callback.bind(null, null, JSON.parse(obj)))
        }

      , set: function (id, key, value, expire, callback) {
          var obj = JSON.parse(this._cache.get(id) || '{}')
          obj[key] = value
          this._cache.set(id, JSON.stringify(obj))
          process.nextTick(callback)
        }

      , extend: function (id) {
          var obj = this._cache.get(id)
          if (obj)
            this._cache.set(id, obj)
        }

      , del: function (id, key, expire, callback) {
          var obj = this._cache.get(id)
          if (obj)
            obj = JSON.parse(obj)
          else
            obj = {}
          delete obj[key]
          this._cache.set(id, JSON.stringify(obj))
          process.nextTick(callback)
        }

      , delAll: function (id, callback) {
          this._cache.del(id)
          process.nextTick(callback)
        }
    }

  , create = function (options) {
      if (!LRU)
        throw new Error('lru-cache needs to be available in order to use MemoryStore')

      var cacheOptions = extend(
              extend({}, DEFAULT_CACHE_OPTIONS)
            , options && options.cache ? options.cache : {}
          )
        , cache        = LRU(cacheOptions)

      return Object.create(MemoryStore, { _cache   : { value : cache } })
    }

module.exports = create