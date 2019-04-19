/* eslint-env mocha */

const assert = require('assert')
const { fork } = require('child_process')
const path = require('path')
const util = require('util')
const Logger = require('../../logger')

describe('Logger Tests', function () {
  /**
   * Thanks to https://github.com/rooseveltframework/roosevelt-logger/issues/34
   * It's necessary to spoof the platform across all tests to prevent them from being polluted by windows
   */
  before(function () {
    Object.defineProperty(process, 'platform', {
      value: 'linux'
    })
  })

  // parameters to pass to the logger
  let configs = {
    methods: {
      'info': 'badparam',
      'warn': true,
      'verbose': {
        'type': 'info',
        'enable': true,
        'prefix': false,
        'color': false
      },
      'error': {
        'type': undefined,
        'enable': undefined,
        'prefix': undefined,
        'color': undefined
      },
      'custom1': true,
      'custom2': {
        'type': 'info',
        'prefix': true,
        'color': false
      },
      'custom3': {
        'enable': true
      },
      'custom4': {
        'enable': true,
        'type': 'error'
      },
      'custom5': {
        'enable': false
      },
      'custom6': {
        'type': 'warn'
      },
      'custom7': {
        'type': 'info',
        'prefix': '🍕',
        'enable': true,
        'color': false
      },
      'custom8': false,
      'custom9': 'badvalue'
    },
    params: {
      'enablePrefix': 'default',
      'disable': null
    }
  }

  // hook for stdout and stderr streams
  let hookStream = function (_stream, fn) {
    // reference default write method
    let oldWrite = _stream.write
    // _stream now write with our shiny function
    _stream.write = fn

    return function () {
      // reset to the default write method
      _stream.write = oldWrite
    }
  }

  it('should initialize a logger and test many different logs', function (done) {
    // instantiate the logger for this test
    const logger = new Logger(configs)

    // variable to store the logs
    let logs = []
    let errors = []

    // hook up standard output/errors
    let unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    let unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // standard a log
    logger.log('First Test')
    logger.log('🍕', 'Pizza Emoji')
    logger.verbose('Verbose log')
    logger.custom1('Should be of type info')
    logger.custom2('Single object key type param')
    logger.custom3('Single object key enabled param')
    logger.log({ 'this': 'is an object' })
    logger.log('🍕', { 'this': 'is an object' })
    logger.custom7({ 'this': 'is an object' })

    // error logs
    logger.error('This should have an emoji prefix')
    logger.warn('This should also have an emoji prefix')
    logger.error('❤️', 'This should not add a prefix because one is already there')

    // disabled logs
    logger.custom5('Should not have an output 1')
    logger.custom6('Should not have an output 2')

    // unhook stdout
    unhookStdout()
    unhookStderr()

    // standard log assertions
    assert.strictEqual(logs[0].includes('First Test'), true, 'The logger failed to output "First Test"')
    assert.strictEqual(logs[1].includes('🍕  Pizza Emoji'), true, 'The logger failed to output a prefixed pizza emoji')
    assert.strictEqual(logs[2].includes('Verbose log'), true, 'The logger did not output a verbose log')
    assert.strictEqual(logs[3].includes('Should be of type info'), true, 'The logger did not output a custom log')
    assert.strictEqual(logs[4].includes('Single object key type param'), true, 'The logger did not output a custom log')
    assert.strictEqual(logs[5].includes('Single object key enabled param'), true, 'The logger did not output a custom log')
    assert.strictEqual(logs[6].includes(util.inspect({ 'this': 'is an object' }, false, null, false)), true, 'The logger did not output an object')
    assert.strictEqual(logs[7].includes('🍕  ' + util.inspect({ 'this': 'is an object' }, false, null, false)), true, 'The logger did not output an object with pizza prefix')
    assert.strictEqual(logs[8].includes('🍕  ' + util.inspect({ 'this': 'is an object' }, false, null, false)), true, 'The custom logger did not output an object with pizza prefix by default')

    // error log assertions
    assert.strictEqual(errors[0].includes('❌  This should have an emoji prefix'), true, 'The logger did not automatically add an emoji to the error log')
    assert.strictEqual(errors[1].includes('⚠️   This should also have an emoji prefix'), true, 'The logger did not automatically add an emoji to the error log')
    assert.strictEqual(errors[2].includes('❤️  This should not add a prefix because one is already there'), true, 'The logger added an emoji prefix')

    // disabled log assertions
    if (typeof logs[9] !== 'undefined') {
      assert.fail('logger.custom5 output a log even though the log type is disabled')
    }
    if (typeof logs[10] !== 'undefined') {
      assert.fail('logger.custom6 output a log even though the log type is disabled')
    }

    // exit test
    done()
  })

  it('should use the defaults if no logging params are passed in', function (done) {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    let logs = []
    let errors = []

    // hook up standard output/errors
    let unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    let unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // standard a log
    logger.log('First Test')
    logger.verbose('Verbose Log')

    // error logs
    logger.error('Error Log')
    logger.warn('Warning Log')

    // unhook stdout
    unhookStdout()
    unhookStderr()

    // standard log assertions
    assert.strictEqual(logs[0].includes('First Test'), true, 'The logger failed to output a log')
    assert.strictEqual(logs.length === 1, true, 'The logger output a verbose log')

    // error log assertions
    assert.strictEqual(errors[0].includes('❌  Error Log'), true, 'The logger did not output an error log')
    assert.strictEqual(errors[1].includes('⚠️   Warning Log'), true, 'The logger did not output a warning log')

    // exit test
    done()
  })

  it('should handle empty logs and other data types', function (done) {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    let logs = []
    // hook up standard output
    let unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })

    // testing logs
    logger.log()
    logger.log('')
    logger.log(123)
    logger.log({ 'key': 'value' })
    logger.log(['array'])

    // unhook stdout
    unhookStdout()

    // log assertions
    assert.strictEqual(logs[0].includes(''), true, 'The logger failed to output an empty log')
    assert.strictEqual(logs[1].includes(''), true, 'The logger failed to output an emty string')
    assert.strictEqual(logs[2].includes('123'), true, 'The logger did not output a number')
    // use inspect for objects
    assert.strictEqual(logs[3].includes('{ key: \'value\' }'), true, 'The logger did not output an object')
    assert.strictEqual(logs[4].includes(util.inspect([ 'array' ], false, null, false)), true, 'The logger did not output an array')

    // exit test
    done()
  })

  it('Should remove prefixes when enablePrefix is set to false', function (done) {
    // instantiate the logger for this test
    configs.enablePrefix = false
    const logger = new Logger(configs)

    // variable to store the logs
    let logs = []
    let errors = []

    // hook up standard output/errors
    let unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    let unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // standard logs
    logger.log('🍕 Test Log')
    logger.verbose('❤️', 'Test Verbose')

    // custom logs
    logger.custom1('🍕 Custom1')
    logger.custom2('❤️', 'Custom2')

    // error logs
    logger.error('Error Log')
    logger.warn('Warning Log')
    logger.error('🍕 Error Log')
    logger.warn('❤️', 'Warning Log')

    // unhook stdout
    unhookStdout()
    unhookStderr()

    // standard log assertions
    assert.strictEqual(logs[0].includes('Test Log'), true, 'The logger did not remove the emoji in logger.log()')
    assert.strictEqual(logs[1].includes('Test Verbose'), true, 'The logger did not remove the emoji in logger.verbose()')
    assert.strictEqual(logs[2].includes('Custom1'), true, 'The logger did not remove the emoji in logger.custom1()')
    assert.strictEqual(logs[3].includes('Custom2'), true, 'The logger did not remove the emoji in logger.custom2()')

    // error log assertions
    assert.strictEqual(errors[0].includes('Error Log'), true, 'The logger did not remove the emoji in logger.error()')
    assert.strictEqual(errors[1].includes('Warning Log'), true, 'The logger did not remove the emoji in logger.warn()')
    assert.strictEqual(errors[2].includes('Error Log'), true, 'The logger did not remove the emoji in logger.error()')
    assert.strictEqual(errors[3].includes('Warning Log'), true, 'The logger did not remove the emoji in logger.warn()')

    // exit test
    done()
  })

  it('Should disable logs in production mode if disable is set to [\'production\']', function (done) {
    const forkedLogger = fork(path.join(__dirname, '../util/fork.js'), [], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'], 'env': { 'NODE_ENV': 'production' } })

    forkedLogger.stdout.on('data', data => {
      if (data.includes('Test Log')) {
        assert.fail('Logs were not disabled in production mode')
      }
    })

    forkedLogger.on('exit', () => {
      done()
    })
  })

  it('Should disable logs if disable is set to [\'test2\'] and process.env.test2 = \'true\'', function (done) {
    const forkedLogger = fork(path.join(__dirname, '../util/fork.js'), [], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'], 'env': { 'test2': 'true' } })

    forkedLogger.stdout.on('data', data => {
      if (data.includes('Test Log')) {
        assert.fail('Logs were not disabled if process.env.test2 = \'true\'')
      }
    })

    forkedLogger.on('exit', () => {
      done()
    })
  })

  it('Should disable log prefix if process.env.ROOSEVELT_LOGGER_ENABLE_PREFIX = \'false\'', function (done) {
    const forkedLogger = fork(path.join(__dirname, '../util/fork.js'), [], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'], 'env': { 'ROOSEVELT_LOGGER_ENABLE_PREFIX': false } })

    forkedLogger.stderr.on('data', data => {
      if (data.includes('⚠️ Test Warning Log')) {
        assert.fail('Log prefixes were not disabled when process.env.ROOSEVELT_LOGGER_ENABLE_PREFIX = \'false\'')
      }
    })

    forkedLogger.on('exit', () => {
      done()
    })
  })

  it('Should disable logs via logger.disableLogging method and enable logs via logger.enableLogging method', function (done) {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    let logs = []
    // hook up standard output
    let unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })

    // disable logging
    logger.disableLogging()

    // testing log
    logger.log('This log should not be seen')

    // re-enable logging
    logger.enableLogging()

    // testing log
    logger.log('This log should be seen')

    // unhook stdout
    unhookStdout()

    // log assertions
    assert.strictEqual(logs.length === 1, true, 'The logger failed to disable logging')
    assert.strictEqual(logs[0].includes('This log should be seen'), true, 'The logger failed to enable logging')

    // exit test
    done()
  })

  it('Should disable prefix via logger.disablePrefix method and enable prefix via logger.enablePrefix method', function (done) {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    let errors = []
    // hook up standard output
    let unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // disable prefix
    logger.disablePrefix()

    // testing log
    logger.warn('This prefix should not be seen')

    // re-enable prefix
    logger.enablePrefix()

    // testing log
    logger.warn('This prefix should be seen')

    // unhook stdout
    unhookStderr()

    // log assertions
    assert.strictEqual(errors[0].includes('⚠️'), false, 'The logger failed to disable the prefix')
    assert.strictEqual(errors[1].includes('⚠️'), true, 'The logger failed to enable the prefix')

    // exit test
    done()
  })

  it('Should create a new functional log type via logger.createLogMethod method', function (done) {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    let logs = []
    let errors = []

    // hook up standard output/errors
    let unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    let unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // programmatically generate a new log type
    logger.createLogMethod({
      name: 'test',
      type: 'info'
    })

    // test out the new log type
    logger.test('This is a test')

    // generate another new invalid log type
    logger.createLogMethod({
      type: 'info'
    })

    // unhook stdout
    unhookStdout()
    unhookStderr()

    // log assertions
    assert.strictEqual(logs[0].includes('This is a test'), true, 'The logger failed to log with the new log type')
    assert.strictEqual(errors[0].includes('Must be type string.'), true, 'The logger attempted to create invalid log type')

    // exit test
    done()
  })

  it('Should disable log prefix by default in windows and allow override via ROOSEVELT_LOGGER_ENABLE_PREFIX env and logger.enablePrefix method', function (done) {
    let logs = []
    const forkedLogger = fork(path.join(__dirname, '../util/windowsFork.js'), [], { 'stdio': ['pipe', 'pipe', 'pipe', 'ipc'] })

    forkedLogger.stderr.on('data', data => {
      // push each log to an array
      logs.push(data.toString())
    })

    forkedLogger.on('exit', () => {
      // log assertions
      assert.strictEqual(logs[0].includes('⚠️'), false, 'The logger failed to disable prefixes in windows by default')
      assert.strictEqual(logs[1].includes('⚠️'), true, 'The logger failed to enable prefix via enablePrefix()')
      assert.strictEqual(logs[2].includes('⚠️'), true, 'The logger failed to enable prefix via env')
      done()
    })
  })
})
