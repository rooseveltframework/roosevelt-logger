// Require logger
const logger = require('../../logger')({ disable: ['production', 'test1', 'test2'] })

// Output a test log with and without a prefix
logger.log('Test Log')
logger.warn('Test Warning Log')
