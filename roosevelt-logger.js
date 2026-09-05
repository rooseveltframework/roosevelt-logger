const util = require('util')
const defaults = require('./defaults.json')

/**
 * matches a string that is nothing but a single emoji, e.g. the first arg of logger.log('🍕', 'Pizza Emoji')
 *
 * RGI_Emoji covers multi-codepoint emoji like 👍🏽 and 🇺🇸, while Extended_Pictographic covers the single codepoints that RGI_Emoji skips unless they carry a variation selector, like 🗄 and ©.
 *
 * this is built with the RegExp constructor rather than written as a literal because the linter can't yet parse the `v` flag that the RGI_Emoji property requires.
 */
// eslint-disable-next-line prefer-regex-literals
const emojiRegex = new RegExp('^(?:\\p{RGI_Emoji}|\\p{Extended_Pictographic})$', 'v')

// util.inspect.colors enumerates every format name util.styleText will accept
const validColors = new Set(Object.keys(util.inspect.colors))

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
    const globals = this.params.params

    // when true all logging is suppressed
    this.silent = false

    // iterate over global disable array
    for (const env of globals.disable) {
      // if the arg is set to true/"true" in process.env or it's the env in process.env.NODE_ENV, suppress all logs
      if (process.env.NODE_ENV === env || process.env[env] === 'true') {
        this.silent = true
      }
    }

    // iterate over methods and bind each one to this class
    for (const name in this.params.methods) {
      this[name] = function (...args) {
        this._createLog(name, args)
      }
    }

    // create log function to map to logger.info
    this.log = this.info
  }

  /**
   * parse log configuration and write the log entry to the appropriate stream
   * @param {string} name - name of the logger method that produced this log
   * @param {Array<*>} args - args passed to the logger method
   */
  _createLog (name, args) {
    const { enable, type, prefix, color } = this.params.methods[name]

    // skip the log if logging is off entirely or this method is disabled
    if (this.silent || enable === false || enable === 'false') {
      return
    }

    // warnings and errors go to stderr, everything else to stdout
    const stream = type === 'info' ? process.stdout : process.stderr

    // parse the log arguments and write them out
    const message = argumentsToString(args, this.params.params.enablePrefix, prefix)
    stream.write(colorize(message, color, stream) + '\n')
  }

  /**
   * disable logging to console
   */
  disableLogging () {
    this.silent = true
  }

  /**
   * enable logging to console
   */
  enableLogging () {
    this.silent = false
  }

  /**
   * disable logging prefix
   */
  disablePrefix () {
    this.params.params.enablePrefix = false
  }

  /**
   * enable logging prefix
   */
  enablePrefix () {
    this.params.params.enablePrefix = true
  }

  /**
   * create a new logger method
   * @param {object} params - configuration for new logger method
   */
  createLogMethod (params) {
    const name = params.name

    // validate that the method name is a string
    if (!name || typeof name !== 'string') {
      console.error('❌ ', `Method name: ${name} invalid. Must be type string.`)
      return
    }

    // validate and sanitize config, then bind the new logger type to the logger config
    this.params.methods[name] = validateLoggerMethod(name, params)

    // create a function for the new logger
    this[name] = function (...args) {
      this._createLog(name, args)
    }
  }
}

/**
 * stringify a single log argument
 * @param {*} arg - the argument to stringify
 * @returns {string} - returns the argument as a string
 */
function stringify (arg) {
  return typeof arg === 'string' ? arg : util.inspect(arg, false, null, false)
}

/**
 * takes in an input of arguments which are parsed, concatenated, and returned back as a string
 * @param {Array<*>} args - array of arguments to be parsed
 * @param {boolean} enablePrefix - if the returning string should contain a prefix or remove them
 * @param {string} prefix - a string that is prepended to the returning string.
 * @returns {string} - returns the parsed and concatenated string of arguments
 */
function argumentsToString (args, enablePrefix, prefix) {
  let str = ''

  // nothing was logged
  if (args.length === 0) {
    return str
  }

  // determine if first arg is a prefix
  if (typeof args[0] === 'string' && args[0].trim() === prefix) {
    // first arg is the prefix, add it when enabled
    if (enablePrefix) {
      str += args[0].trim() + '  '
    }
  } else if (typeof args[0] === 'string' && emojiRegex.test(args[0].trim())) {
    // first arg is an emoji, add it as a prefix when enabled
    if (enablePrefix) {
      str += args[0].trim() + '  '
    }
  } else if (prefix && prefix.length > 0) {
    // first arg is not a prefix and prefix is set, add prefix when enabled
    if (enablePrefix) {
      str += prefix + '  ' + stringify(args[0])
    } else {
      str += stringify(args[0]) + ' '
    }
  } else {
    // no prefix configured or in use
    str += stringify(args[0]) + ' '
  }

  // print out remaining args
  for (const arg of args.slice(1)) {
    str += stringify(arg) + ' '
  }

  return str
}

/**
 * apply a color to a log entry, but only when the target stream can render it
 * @param {string} text - the log entry
 * @param {string|boolean} color - a util.styleText format name, or false for no color
 * @param {object} stream - the stream the log entry will be written to
 * @returns {string} - returns the log entry, colorized when appropriate
 */
function colorize (text, color, stream) {
  // no color was configured for this log type
  if (color === false) {
    return text
  }

  // util.styleText can perform this check itself via its validateStream option, but that option is not present in every release of Node 22, so the check is performed here instead
  if (process.env.NO_COLOR || process.env.FORCE_COLOR === '0') {
    return text
  }
  if (!stream.isTTY && !process.env.FORCE_COLOR) {
    return text
  }

  return util.styleText(color, text)
}

/**
 * generate params object based on params in logger constructor and defaults
 * @param {object} params - params in logger constructor
 * @returns {object} - fleshed out params object
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
  if (Object.hasOwn(globals, 'enablePrefix')) {
    newParams.params.enablePrefix = typeof globals.enablePrefix === 'boolean' ? globals.enablePrefix : defaults.params.enablePrefix
  } else {
    newParams.params.enablePrefix = defaults.params.enablePrefix
  }

  /**
   * disable prefixes in windows by default
   * see: https://github.com/rooseveltframework/roosevelt-logger/issues/34 for more details
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
  if (Object.hasOwn(globals, 'disable')) {
    newParams.params.disable = Array.isArray(globals.disable) ? globals.disable : defaults.params.disable
  } else {
    newParams.params.disable = defaults.params.disable
  }

  // loop through and validate configured methods
  for (const key in methods) {
    const sanitizedConfig = validateLoggerMethod(key, methods[key])

    // this if statement ensures that the method object doesn't get polluted by invalid params
    if (sanitizedConfig) {
      newParams.methods[key] = sanitizedConfig
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
 * sanitize logger method configuration and return it
 * @param {string} method - logger method name
 * @param {object|boolean} params - logger method config
 * @returns {object} - validated logger method config
 */
function validateLoggerMethod (method, params) {
  // a default method falls back to its own defaults, a custom method falls back to info
  const fallback = defaults.methods[method] || { type: 'info', enable: true }

  if (typeof params === 'object' && params !== null) {
    const { type, enable, prefix, color } = params
    const sanitizedConfig = {}

    sanitizedConfig.type = validateType(type) ? type : fallback.type
    sanitizedConfig.enable = validateEnable(enable) ? enable : fallback.enable
    sanitizedConfig.prefix = sanitizePrefix(prefix, sanitizedConfig.type)
    sanitizedConfig.color = sanitizeColor(color, sanitizedConfig.type)

    return sanitizedConfig
  }

  if (typeof params === 'boolean') {
    const sanitizedConfig = {}

    sanitizedConfig.type = fallback.type
    sanitizedConfig.enable = params
    sanitizedConfig.prefix = sanitizePrefix(fallback.prefix, sanitizedConfig.type)
    sanitizedConfig.color = sanitizeColor(fallback.color, sanitizedConfig.type)

    return sanitizedConfig
  }

  // the config is neither an object nor a boolean, so there is nothing to sanitize
  return undefined
}

/**
 * check the 'type' property is defined and a valid option
 * @param {string} type - type of a log type
 */
function validateType (type) {
  return type !== undefined && ['info', 'warn', 'error'].includes(type)
}

/**
 * check the 'enable' property is defined and a boolean
 * @param {boolean} enableBool - boolean to decide if a specific log type is enabled
 */
function validateEnable (enableBool) {
  return enableBool !== undefined && typeof enableBool === 'boolean'
}

/**
 * check the 'prefix' property is defined and a string or boolean and set to a default if undefined
 * @param {string|boolean} prefix - prefix of a log type
 * @param {string} type - type of a log type
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
 * check the 'color' property is a supported color name or false and set to a default if not
 * @param {string|boolean} color - custom color of a log type
 * @param {string} type - type of a log type
 */
function sanitizeColor (color, type) {
  // check color validity
  const validColor = color === false || (typeof color === 'string' && validColors.has(color))

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
