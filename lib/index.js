const DEFAULT_OPTIONS = {
          expire     : 60 * 60 * 24 * 7 * 2 // 2 weeks
        , cookieName : 's'
        , idPrefix   : 'session:'
      }

const Cookies = require('cookies')
    , Keygrip = (function () {
        try {
          return require('keygrip')
        } catch (e) {}
      }())
    , extend  = require('util')._extend
    , noop    = function () {}

var Session = {
        init: function (req, res, store, options) {
          var cookieOptions

          this.request  = req
          this.response = res
          this.store    = store
          this.options  = options

          if (this.options.keys) {
            if (!Keygrip)
              throw new Error('keys provided by Keygrip not available')
            else if (Array.isArray(this.options.keys))
              this.keys = new Keygrip(this.options.keys)
            else if (this.options.keys instanceof Keygrip)
              this.keys = this.options.keys
            else
              throw new Error('invalid keys provided')
          }

          this.cookies = this.options.cookies || new Cookies(req, res, this.keys)
          this.expire  = new Date(Date.now() + (this.options.expire * 1000))

          cookieOptions = { expires : this.expire, signed: !!this.keys }

          this.token = this.cookies.get(this.options.cookieName, cookieOptions)

          if (!this.token)
            this.token = require('crypto').randomBytes(30).toString('base64')

          this.cookies.set(this.options.cookieName, this.token, cookieOptions)

          if (!this.token)
            throw new Error('could not load session token')

          this.id = this.options.idPrefix + this.token

          return this
        }

      , del: function (key, callback) {
          if (typeof key == 'function')
            return this.delAll(key)
          if (!key && !callback)
            return this.delAll()

          this.store.del(this.id, key, this.options.expire, callback || noop)
        }

      , delAll: function (callback) {
          this.store.delAll(this.id, callback || noop)
        }

      , destroy: function (callback) {
          this.store.delAll(this.id, function (err) {
            this.cookies.set(this.options.cookieName, '', {
                expires : new Date(0)
              , signed  : !!this.keys
            })

            callback && callback(err)
          }.bind(this))
        }

      , set: function (key, value, callback) {
          if (typeof value == 'function')
            callback = value, value = null

          this.store.set(this.id, key, value, this.options.expire, callback || noop)
        }

      , get: function (key, callback) {
          if (typeof key == 'function' || !key)
            return this.getAll(key || callback)

          if (!callback)
            return this.store.extend(this.id, this.options.expire)

          this.store.get(this.id, key, this.options.expire, callback)
        }

      , getAll: function (callback) {
          if (!callback)
            return this.store.extend(this.id, this.options.expire)

          this.store.getAll(this.id, this.options.expire, callback)
        }
    }

  , mkoptions = function (options) {
      return extend(extend({}, DEFAULT_OPTIONS), options || {})
    }

  , create = function (req, res, store, options) {
      return Object.create(Session).init(req, res, store, mkoptions(options))
    }

  , filter = function (store, options) {
      options = mkoptions(options)
      return function (req, res, next) {
        req.session = res.session = create(req, res, store, options)
        next()
      }
    }

module.exports             = create
module.exports.filter      = filter
module.exports.middleware  = filter
module.exports.MemoryStore = require('./memory-store')