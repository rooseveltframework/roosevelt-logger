// Require logger
const logger = require('../../logger')({ disable: ['production', 'test1', 'test2'] })

// Output a test log
logger.log('Test Log')
