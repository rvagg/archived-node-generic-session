const tap            = require('tap')
    , genericSession = require('../')

// stubs
const req   = { headers: {}, connection: { encrypted: false } }
    , res   = { getHeader: function () {}, set: true, setHeader: function () {} }

tap.test('.middleware as alias for .filter', function (t) {
  t.plan(1)
  t.same(genericSession.middleware, genericSession.filter)
})

tap.test('basic operations', function (t) {
  t.plan(8)

  var store   = genericSession.MemoryStore()
    , session = genericSession(req, res, store)

  session.get('foo', function (err, value) {
    t.notOk(err, 'err should be null')
    t.same(value, undefined, 'value should be undefined')

    session.set('foo', 'bar', function (err) {
      t.notOk(err, 'err should be null')

      session.get('foo', function (err, value) {
        t.notOk(err, 'err should be null')
        t.same(value, 'bar', 'foo=bar')

        session.del('foo', function (err) {
          t.notOk(err, 'err should be null')

          session.get('foo', function (err, value) {
            t.notOk(err, 'err should be null')
            t.same(value, undefined, 'value should be undefined')
          })
        })
      })
    })
  })
})

tap.test('set many, getAll(), delAll()', function (t) {
  t.plan(20 * 4)

  var store   = genericSession.MemoryStore()
    , session = genericSession(req, res, store)

  for (var i = 0; i < 20; i++)
    session.set('foo' + i, i)

  // nextTick should suffice for MemoryStore
  process.nextTick(function () {
    for (var i = 0; i < 20; i++) {
      session.get('foo' + i, function (err, value) {
        t.notOk(err, 'err should be null')
        t.equal(value, Number(this), 'value should be as expected')
      }.bind(i))
    }

    process.nextTick(function () {
      for (var i = 0; i < 10; i++)
        session.del('foo' + i)

      process.nextTick(function () {
        for (var i = 0; i < 20; i++) {
          session.get('foo' + i, function (err, value) {
            var i = Number(this)
            t.notOk(err, 'err should be null')
            if (i < 10)
              t.same(value, undefined, 'value should be undefined, i.e. deleted')
            else
              t.equal(value, i, 'value should be as expected')
          }.bind(i))
        }
      })
    })
  })
})