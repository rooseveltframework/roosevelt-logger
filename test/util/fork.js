// Require logger
const Logger = require('../../logger')
const logger = new Logger({
  params: {
    enablePrefix: true,
    disable: ['production', 'test1', 'test2']
  }
})

// Output a test log with and without a prefix
logger.log('Test Log')
logger.warn('Test Warning Log')
