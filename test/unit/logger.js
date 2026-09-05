const assert = require('assert')
const { describe, it, before } = require('node:test')
const { fork } = require('child_process')
const path = require('path')
const util = require('util')
const Logger = require('../../roosevelt-logger')

describe('roosevelt-logger', function () {
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
  const configs = {
    methods: {
      info: 'badparam',
      warn: true,
      verbose: {
        type: 'info',
        enable: true,
        prefix: false,
        color: false
      },
      error: {
        type: undefined,
        enable: undefined,
        prefix: undefined,
        color: undefined
      },
      custom1: true,
      custom2: {
        type: 'info',
        prefix: true,
        color: false
      },
      custom3: {
        enable: true
      },
      custom4: {
        enable: true,
        type: 'error'
      },
      custom5: {
        enable: false
      },
      custom6: {
        type: 'warn'
      },
      custom7: {
        type: 'info',
        prefix: '🍕',
        enable: true,
        color: false
      },
      custom8: false,
      custom9: 'badvalue',
      custom10: {
        type: 'info',
        enable: true,
        prefix: '🍪'
      }
    },
    params: {
      enablePrefix: 'default',
      disable: null
    }
  }

  // hook for stdout and stderr streams
  const hookStream = function (_stream, fn) {
    // reference default write method
    const oldWrite = _stream.write
    // _stream now write with our shiny function
    _stream.write = fn

    return function () {
      // reset to the default write method
      _stream.write = oldWrite
    }
  }

  /**
   * Run a script in a child process and resolve with everything it wrote, one entry per line.
   * The streams are buffered and split rather than read chunk by chunk because a chunk can
   * contain any number of lines depending on how the OS happens to flush the pipe.
   */
  const forkLogger = function (script, env) {
    return new Promise(resolve => {
      let stdout = ''
      let stderr = ''
      const forkedLogger = fork(path.join(__dirname, '../util/', script), [], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'], env })

      forkedLogger.stdout.on('data', data => { stdout += data.toString() })
      forkedLogger.stderr.on('data', data => { stderr += data.toString() })
      forkedLogger.on('close', () => resolve({
        logs: stdout.split('\n').filter(line => line !== ''),
        errors: stderr.split('\n').filter(line => line !== '')
      }))
    })
  }

  it('should initialize a logger and test many different logs', function () {
    // instantiate the logger for this test
    const logger = new Logger(configs)

    // variable to store the logs
    const logs = []
    const errors = []

    // hook up standard output/errors
    const unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    const unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // standard a log
    logger.log('First Test')
    logger.log('🍕', 'Pizza Emoji')
    logger.verbose('Verbose log')
    logger.custom1('Should be of type info')
    logger.custom2('Single object key type param')
    logger.custom3('Single object key enabled param')
    logger.log({ this: 'is an object' })
    logger.log('🍕', { this: 'is an object' })
    logger.custom7({ this: 'is an object' })
    logger.custom10('🍪 ', 'This log doubles down on the prefix')

    // error logs
    logger.error('This should have an emoji prefix')
    logger.warn('This should also have an emoji prefix')
    logger.error('❤️', 'This should not add a prefix because one is already there')

    // disabled logs
    logger.custom5('Should not have an output 1')

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
    assert.strictEqual(logs[6].includes(util.inspect({ this: 'is an object' }, false, null, false)), true, 'The logger did not output an object')
    assert.strictEqual(logs[7].includes('🍕  ' + util.inspect({ this: 'is an object' }, false, null, false)), true, 'The logger did not output an object with pizza prefix')
    assert.strictEqual(logs[8].includes('🍕  ' + util.inspect({ this: 'is an object' }, false, null, false)), true, 'The custom logger did not output an object with pizza prefix by default')
    assert.strictEqual(logs[9].includes('🍪  This log doubles down on the prefix'), true, 'The logger failed to handle a redundant prefix')

    // error log assertions
    assert.strictEqual(errors[0].includes('❌  This should have an emoji prefix'), true, 'The logger did not automatically add an emoji to the error log')
    assert.strictEqual(errors[1].includes('⚠️   This should also have an emoji prefix'), true, 'The logger did not automatically add an emoji to the error log')
    assert.strictEqual(errors[2].includes('❤️  This should not add a prefix because one is already there'), true, 'The logger added an emoji prefix')

    // disabled log assertions
    if (typeof logs[10] !== 'undefined') {
      assert.fail('logger.custom5 output a log even though the log type is disabled')
    }
  })

  it('should use the defaults if no logging params are passed in', function () {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    const logs = []
    const errors = []

    // hook up standard output/errors
    const unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    const unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
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
  })

  it('should handle empty logs and other data types', function () {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    const logs = []
    // hook up standard output
    const unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })

    // testing logs
    logger.log()
    logger.log('')
    logger.log(123)
    logger.log({ key: 'value' })
    logger.log(['array'])

    // unhook stdout
    unhookStdout()

    // log assertions
    assert.strictEqual(logs[0], '\n', 'The logger failed to output an empty log')
    assert.strictEqual(logs[1].includes(''), true, 'The logger failed to output an emty string')
    assert.strictEqual(logs[2].includes('123'), true, 'The logger did not output a number')
    // use inspect for objects
    assert.strictEqual(logs[3].includes('{ key: \'value\' }'), true, 'The logger did not output an object')
    assert.strictEqual(logs[4].includes(util.inspect(['array'], false, null, false)), true, 'The logger did not output an array')
  })

  it('should remove prefixes when enablePrefix is set to false', function () {
    // instantiate the logger for this test
    configs.params.enablePrefix = false
    const logger = new Logger(configs)

    // variable to store the logs
    const logs = []
    const errors = []

    // hook up standard output/errors
    const unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    const unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // standard logs
    logger.verbose('❤️', 'Test Verbose')

    // custom logs
    logger.custom2('❤️', 'Custom2')
    logger.custom10('🍪 ', 'Custom10')

    // error logs
    logger.error('Error Log')
    logger.warn('Warning Log')
    logger.warn('❤️', 'Warning Log')

    // unhook stdout
    unhookStdout()
    unhookStderr()

    // standard log assertions
    assert.strictEqual(logs[0].includes('❤️'), false, 'The logger did not remove the emoji in logger.verbose()')
    assert.strictEqual(logs[1].includes('❤️'), false, 'The logger did not remove the emoji in logger.custom2()')
    assert.strictEqual(logs[2].includes('🍪'), false, 'The logger did not remove the emoji in logger.custom10()')

    // error log assertions
    assert.strictEqual(errors[0].includes('❌'), false, 'The logger did not remove the emoji in logger.error()')
    assert.strictEqual(errors[1].includes('⚠️'), false, 'The logger did not remove the emoji in logger.warn()')
    assert.strictEqual(errors[2].includes('❤️'), false, 'The logger did not remove the emoji in logger.warn()')
  })

  it('should disable logs in production mode if disable is set to [\'production\']', async function () {
    const { logs } = await forkLogger('fork.js', { NODE_ENV: 'production' })

    assert.strictEqual(logs.join('').includes('Test Log'), false, 'Logs were not disabled in production mode')
  })

  it('should disable logs if disable is set to [\'test2\'] and process.env.test2 = \'true\'', async function () {
    const { logs } = await forkLogger('fork.js', { test2: 'true' })

    assert.strictEqual(logs.join('').includes('Test Log'), false, 'Logs were not disabled if process.env.test2 = \'true\'')
  })

  it('should disable log prefix if process.env.ROOSEVELT_LOGGER_ENABLE_PREFIX = \'false\'', async function () {
    const { errors } = await forkLogger('fork.js', { ROOSEVELT_LOGGER_ENABLE_PREFIX: 'false' })

    assert.strictEqual(errors.join('').includes('⚠️'), false, 'Log prefixes were not disabled when process.env.ROOSEVELT_LOGGER_ENABLE_PREFIX = \'false\'')
  })

  it('should disable logs via logger.disableLogging method and enable logs via logger.enableLogging method', function () {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    const logs = []
    // hook up standard output
    const unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
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
  })

  it('should disable prefix via logger.disablePrefix method and enable prefix via logger.enablePrefix method', function () {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    const errors = []
    // hook up standard output
    const unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
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
  })

  it('should create a new functional log type via logger.createLogMethod method', function () {
    // instantiate the logger for this test
    const logger = new Logger()

    // variable to store the logs
    const logs = []
    const errors = []

    // hook up standard output/errors
    const unhookStdout = hookStream(process.stdout, function (string, encoding, fd) {
      logs.push(string)
    })
    const unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // programmatically generate a new log type
    logger.createLogMethod({
      name: 'test',
      type: 'info'
    })

    // test out the new log type
    logger.test('This is a test')

    // programmatically generate a new log type with a prefix
    logger.createLogMethod({
      name: 'dbError',
      type: 'error',
      prefix: '💥'
    })

    // test out the prefixed log type
    logger.dbError('Our whole stack is in crisis mode!')

    // disable prefixes and log again
    logger.disablePrefix()
    logger.dbError('Our whole stack is in crisis mode!')

    // generate another new invalid log type
    logger.createLogMethod({
      type: 'info'
    })

    // unhook stdout
    unhookStdout()
    unhookStderr()

    // log assertions
    assert.strictEqual(logs[0].includes('This is a test'), true, 'The logger failed to log with the new log type')
    assert.strictEqual(errors[0].includes('💥  Our whole stack is in crisis mode!'), true, 'The logger failed to prefix a programmatically created log type')
    assert.strictEqual(errors[1].includes('💥'), false, 'The logger failed to remove the prefix of a programmatically created log type')
    assert.strictEqual(errors[2].includes('Must be type string.'), true, 'The logger attempted to create invalid log type')
  })

  it('should fall back to the default color when an unsupported color is configured', function () {
    // instantiate a logger with a color name that util.styleText does not support
    const logger = new Logger({
      methods: {
        custom1: {
          type: 'error',
          color: 'notacolor'
        }
      }
    })

    // variable to store the logs
    const errors = []
    // hook up standard errors
    const unhookStderr = hookStream(process.stderr, function (string, encoding, fd) {
      errors.push(string)
    })

    // this log would throw if the invalid color made it through to util.styleText
    logger.custom1('Invalid color')

    // unhook stderr
    unhookStderr()

    // config assertions
    assert.strictEqual(logger.params.methods.custom1.color, 'red', 'The logger did not fall back to the default color for the log type')
    assert.strictEqual(errors[0].includes('Invalid color'), true, 'The logger failed to output a log with an invalid color configured')
  })

  it('should skip colors when the output stream is not a TTY', async function () {
    const { errors } = await forkLogger('fork.js', {})

    assert.strictEqual(errors.join('').includes('\u001b['), false, 'The logger colorized a log written to a piped stream')
  })

  it('should apply colors when process.env.FORCE_COLOR is set', async function () {
    const { errors } = await forkLogger('fork.js', { FORCE_COLOR: '1' })

    // warnings are yellow by default
    assert.strictEqual(errors.join('').includes('\u001b[33m'), true, 'The logger did not colorize a log when FORCE_COLOR was set')
  })

  it('should skip colors when process.env.NO_COLOR is set', async function () {
    const { errors } = await forkLogger('fork.js', { FORCE_COLOR: '1', NO_COLOR: '1' })

    assert.strictEqual(errors.join('').includes('\u001b['), false, 'The logger colorized a log when NO_COLOR was set')
  })

  it('should disable log prefix by default in windows and allow override via ROOSEVELT_LOGGER_ENABLE_PREFIX env and logger.enablePrefix method', async function () {
    const { errors } = await forkLogger('windowsFork.js')

    // log assertions
    assert.strictEqual(errors[0].includes('⚠️'), false, 'The logger failed to disable prefixes in windows by default')
    assert.strictEqual(errors[1].includes('⚠️'), true, 'The logger failed to enable prefix via enablePrefix()')
    assert.strictEqual(errors[2].includes('⚠️'), true, 'The logger failed to enable prefix via env')
  })
})
