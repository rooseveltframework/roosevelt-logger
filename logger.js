require('@colors/colors')
const emoji = require('node-emoji')
const util = require('util')
const winston = require('winston')
const colors = require('@colors/colors/safe')
const defaults = require('./defaults.json')
const { combine, printf } = winston.format

/** Class representing roosevelt-logger */
class Logger {
  /**
   * Create a logger instance
   * @param {object} params - Logger configuration
   */
  constructor (params) {
    // ensure params is an object
    params = params || {}

    // bind parameters
    this.params = setParams(params)
    params = this.params
    const globals = params.params
    const methods = params.methods

    // transports object to easily override settings
    const transports = {
      console: new winston.transports.Console({
        stderrLevels: ['error', 'warn']
      })
    }

    // logger module
    const wLogger = winston.createLogger({
      // clean output instead of winstons default
      format: combine(
        printf(info => info.message)
      ),
      // basic console transport set-up
      transports: [
        transports.console
      ]
    })

    // expose the bare winston module as well as this instance of it
    this.winston = winston
    this.winstonInstance = wLogger
    this.transports = transports

    // iterate over global disable array
    for (const env in globals.disable) {
      // if the arg is set to true/"true" in process.env or it's the env in process.env.NODE_ENV, suppress all logs
      if (process.env.NODE_ENV === globals.disable[env] || process.env[globals.disable[env]] === 'true') {
        transports.console.silent = true
      }
    }

    // iterate over methods and bind each one to this class
    for (const key in methods) {
      const { enable, type, prefix, color } = methods[key]

      this[key] = function (...args) {
        this._createLog(args, enable, globals.enablePrefix, prefix, color, type)
      }
    }

    // create log function to map to logger.info
    this.log = this.info
  }

  /**
   * Parse log configuration and dispatch to winston logger instance
   * @param {Array<*>} args - Args to pass to the interal logger
   * @param {boolean} enable - Flag to state if this should be logged
   * @param {boolean} enablePrefix - Flag to state if the prefix should be printed
   * @param {string} prefix - The prefix for this log entry
   * @param {string} color - The color for this log entry
   * @param {string} type - The internal log level type for winston
   */
  _createLog (args, enable, enablePrefix, prefix, color, type) {
    // log if the param is set to true
    if (enable !== 'false' && enable !== false) {
      // parse the log arguments
      const logs = argumentsToString(args, enablePrefix, prefix)
      // send the log level and message to winston for logging
      if (color === false) {
        this.winstonInstance.log({ level: type, message: logs })
      } else {
        this.winstonInstance.log({ level: type, message: colors[color](logs) })
      }
    }
  }

  /**
   * Disable logging to console
   */
  disableLogging () {
    this.transports.console.silent = true
  }

  /**
   * Enable logging to console
   */
  enableLogging () {
    this.transports.console.silent = false
  }

  /**
   * Disable logging prefix
   */
  disablePrefix () {
    this.params.params.enablePrefix = false
  }

  /**
   * Enable logging prefix
   */
  enablePrefix () {
    this.params.params.enablePrefix = true
  }

  /**
   * Create a new logger method
   * @param {object} params - Configuration for new logger method
   */
  createLogMethod (params) {
    const name = params.name

    // validate that the method name is a string
    if (!name || typeof name !== 'string') {
      console.error('❌ ', `Method name: ${name} invalid. Must be type string.`)
      return
    }

    // validate and sanitize config
    params = validateLoggerMethod(name, params)
    const { type, prefix, color } = params

    // bind new logger type to logger config
    this.params[name] = {
      type: type,
      enable: true,
      prefix: prefix,
      color: color
    }

    // create a function for the new logger
    this[name] = function (...args) {
      this._createLog(args, true, this.params.enablePrefix, prefix, color, type)
    }
  }
}

/**
 * Utility Functions
 */

/**
 * Takes in an input of arguments which are parsed, concatenated, and returned back as a string.
 * @param {object} input - Object of arguments to be parsed
 * @param {boolean} enablePrefix - If the returning string should contain a prefix or remove them
 * @param {string} prefix - A string that is prepended to the returning string.
 * @returns {string} - Returns the parsed and concatenated string of arguments
 */
function argumentsToString (input, enablePrefix, prefix) {
  let str = ''
  const args = Object.values(input)

  // determine if first arg is a prefix
  if (typeof args[0] === 'string' && args[0].trim() === prefix) {
    // first arg is the prefix, add it when enabled
    if (enablePrefix) {
      str += args[0].trim() + '  '
    }
  } else if (typeof args[0] === 'string' && emoji.which(args[0].trim())) {
    // first arg is an emoji, add it as a prefix when enabled
    if (enablePrefix) {
      str += args[0].trim() + '  '
    }
  } else if (prefix && prefix.length > 0) {
    // first arg is not a prefix and prefix is set, add prefix when enabled
    const arg0 = (typeof args[0] === 'string') ? args[0] : util.inspect(args[0], false, null, false)
    if (enablePrefix) {
      str += prefix + '  ' + arg0
    } else {
      str += arg0 + ' '
    }
  } else {
    // no prefix configured or in use
    const arg0 = (typeof args[0] === 'string') ? args[0] : util.inspect(args[0], false, null, false)
    str += arg0 + ' '
  }

  // print out remaining args
  const rest = args.slice(1)
  for (const k in rest) {
    const arg = (typeof rest[k] === 'string') ? rest[k] : util.inspect(rest[k], false, null, false)
    str += arg + ' '
  }
  return str
}

/**
 * Generate params object based on params in logger constructor and defaults
 * @param {object} params - Params in logger constructor
 * @returns {object} - Fleshed out params object
  */
function setParams (params) {
  // sanitized configuration to output
  const newParams = {
    methods: {},
    params: {}
  }

  const globals = params.params || {}
  const methods = params.methods || {}

  // sanitize enablePrefix param
  if (Object.prototype.hasOwnProperty.call(globals, 'enablePrefix')) {
    newParams.params.enablePrefix = typeof globals.enablePrefix === 'boolean' ? globals.enablePrefix : defaults.params.enablePrefix
  } else {
    newParams.params.enablePrefix = defaults.params.enablePrefix
  }

  /**
   * Disable prefixes in windows by default
   * See: https://github.com/rooseveltframework/roosevelt-logger/issues/34 for more details
   */
  if (process.platform === 'win32') {
    newParams.params.enablePrefix = false
  }

  // toggle prefix based on env
  if (process.env.ROOSEVELT_LOGGER_ENABLE_PREFIX === 'true') {
    newParams.params.enablePrefix = true
  } else if (process.env.ROOSEVELT_LOGGER_ENABLE_PREFIX === 'false') {
    newParams.params.enablePrefix = false
  }

  // sanitize disable param
  if (Object.prototype.hasOwnProperty.call(globals, 'disable')) {
    newParams.params.disable = Array.isArray(globals.disable) ? globals.disable : defaults.params.disable
  } else {
    newParams.params.disable = defaults.params.disable
  }

  // loop through and validate configured methods
  for (const key in methods) {
    // this if statement ensures that the method object doesn't get polluted by invalid params
    if (validateLoggerMethod(key, methods[key])) {
      newParams.methods[key] = validateLoggerMethod(key, methods[key])
    }
  }

  // loop defaults to make sure the newParams contains all default log types
  for (const key in defaults.methods) {
    if (newParams.methods[key] === undefined) {
      newParams.methods[key] = defaults.methods[key]
    }
  }

  return newParams
}

/**
 * Sanitize logger method configuration and return it
 * @param {object} method - Logger method name
 * @param {object|boolean} - Logger method config
 * @returns {object} - Validated logger method config
 */
function validateLoggerMethod (method, params) {
  let sanitizedConfig

  if (defaults.methods[method]) {
    // sanitize the params on a default method
    if (typeof params === 'object') {
      const { type, enable, prefix, color } = params
      sanitizedConfig = {}
      sanitizedConfig.type = validateType(type) ? type : defaults.methods[method].type
      sanitizedConfig.enable = validateEnable(enable) ? enable : defaults.methods[method].enable
      sanitizedConfig.prefix = sanitizePrefix(prefix, sanitizedConfig.type)
      sanitizedConfig.color = sanitizeColor(color, sanitizedConfig.type)
    } else if (typeof params === 'boolean') {
      sanitizedConfig = {}
      sanitizedConfig.type = defaults.methods[method].type
      sanitizedConfig.enable = params
      sanitizedConfig.prefix = sanitizePrefix(defaults.methods[method].prefix, sanitizedConfig.type)
      sanitizedConfig.color = sanitizeColor(defaults.methods[method].color, sanitizedConfig.type)
    }
  } else {
    // sanitize the params on a custom method
    if (typeof params === 'object') {
      const { type, enable, prefix, color } = params
      sanitizedConfig = {}
      sanitizedConfig.type = validateType(type) ? type : 'info'
      sanitizedConfig.enable = validateEnable(enable) ? enable : true
      sanitizedConfig.prefix = sanitizePrefix(prefix, sanitizedConfig.type)
      sanitizedConfig.color = sanitizeColor(color, sanitizedConfig.type)
    } else if (typeof params === 'boolean') {
      const { prefix, color } = params
      sanitizedConfig = {}
      sanitizedConfig.type = 'info'
      sanitizedConfig.enable = params
      sanitizedConfig.prefix = sanitizePrefix(prefix, sanitizedConfig.type)
      sanitizedConfig.color = sanitizeColor(color, sanitizedConfig.type)
    }
  }

  return sanitizedConfig
}

/**
 * Check the 'type' property is defined and a valid option
 * @param {string} type - Type of a log type
 */
function validateType (type) {
  return type !== undefined && ['info', 'warn', 'error'].includes(type)
}

/**
 * Check the 'enable' property is defined and a boolean
 * @param {boolean} enableBool - Boolean to decide if a specific log type is enabled
 */
function validateEnable (enableBool) {
  return enableBool !== undefined && typeof enableBool === 'boolean'
}

/**
 * Check the 'prefix' property is defined and a string or boolean and set to a default if undefined
 * @param {string|boolean} prefix - Prefix of a log type
 * @param {string} type - Type of a log type
 */
function sanitizePrefix (prefix, type) {
  // check prefix validity
  const validPrefix = prefix !== undefined && (typeof prefix === 'string' || typeof prefix === 'boolean')

  // set to a default if invalid
  if (!validPrefix) {
    switch (type) {
      case 'warn':
        prefix = '⚠️ '
        break
      case 'error':
        prefix = '❌'
        break
      default:
        prefix = false
    }
  }

  return prefix
}

/**
 * Check the 'color' property is defined and a string or boolean and set to a default if undefined
 * @param {string|boolean} color - Custom color of a log type
 * @param {string} type - Type of a log type
 */
function sanitizeColor (color, type) {
  // check color validity
  const validColor = color !== undefined && (typeof color === 'string' || typeof color === 'boolean')

  // set to a default if invalid
  if (!validColor) {
    switch (type) {
      case 'warn':
        color = 'yellow'
        break
      case 'error':
        color = 'red'
        break
      default:
        color = false
    }
  }

  return color
}

module.exports = Logger
