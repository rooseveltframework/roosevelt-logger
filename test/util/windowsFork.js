const Logger = require('../../roosevelt-logger')

// spoof windows environment
Object.defineProperty(process, 'platform', {
  value: 'win32'
})

// instantiate logger
let logger = new Logger({
  params: {
    enablePrefix: true
  }
})

// output a test log that would normally include a prefix
logger.warn('No prefix')

// force enable prefix
logger.enablePrefix()

// this log should have a prefix
logger.warn('A prefix enabled programmatically')

// set env that would enable prefix
process.env.ROOSEVELT_LOGGER_ENABLE_PREFIX = 'true'

// spin up a new logger instance
logger = new Logger({
  params: {
    enablePrefix: true
  }
})

// a prefix should show thanks to the env
logger.warn('A prefix enabled via env')
