const util = require('util')
const winston = require('winston')
require('colors')
const colors = require('colors/safe')

const defaults = require('./defaults.json')
const { combine, printf } = winston.format

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

/**
 * Takes in an input of arguments which are parsed, concatenated, and returned back as a string.
 * @param {object} input - Objet of arguments to be parsed
 * @param {boolean} enablePrefix - If the returning string should contain a prefix or remove them
 * @param {string} prefix - a string that is prepended to the returning string.
 * @returns {string} - Returns the parsed and concatenated string of arguments
 */
function argumentsToString (input, enablePrefix, prefix) {
  let str = ''
  let args = Object.values(input)

  if (enablePrefix && typeof args[0] === 'string' && args.length > 1) {
    str += args[0] + '  '
  } else if (
    typeof args[0] === 'string' && enablePrefix &&
    (prefix !== '' && prefix !== false && prefix !== null && prefix !== undefined)
  ) {
    str += prefix + '  ' + args[0]
  } else if (args.length === 1) {
    if (typeof args[0] === 'string') {
      str += args[0] + ' '
    } else {
      str += util.inspect(args[0], false, null, false) + ' '
    }
  }

  let rest = args.slice(1)

  for (let k in rest) {
    if (typeof rest[k] === 'string') {
      str += rest[k] + ' '
    } else {
      str += util.inspect(rest[k], false, null, false) + ' '
    }
  }
  return str.trimRight()
}

function setParams (params) {
  let newParams = {}
  // loop params and assign values
  for (let key in params) {
    if (defaults[key]) {
      if (key === 'enablePrefix') {
        newParams[key] = typeof params[key] === 'boolean' ? params[key] : defaults[key]
      } else if (key === 'disable') {
        newParams[key] = Array.isArray(params[key]) ? params[key] : defaults[key]
      } else if (typeof params[key] === 'object') {
        let { type, enable, prefix, color } = params[key]
        newParams[key] = {
          type: validateType(type) ? type : defaults[key].type,
          enable: validateEnable(enable) ? enable : defaults[key].enable,
          prefix: validatePrefix(prefix) ? prefix : defaults[key].prefix,
          color: validateColor(color) ? color : defaults[key].color
        }
      } else if (typeof params[key] === 'boolean') {
        newParams[key] = {
          type: defaults[key].type,
          enable: params[key],
          prefix: defaults[key].prefix,
          color: false
        }
      }
    } else {
      if (typeof params[key] === 'object') {
        let { type, enable, prefix, color } = params[key]
        newParams[key] = {
          type: validateType(type) ? type : 'info',
          enable: validateEnable(enable) ? enable : true,
          prefix: validatePrefix(prefix) ? prefix : false,
          color: validateColor(color) ? color : false
        }
      } else if (typeof params[key] === 'boolean') {
        newParams[key] = {
          type: 'info',
          enable: params[key],
          prefix: false,
          color: false
        }
      } else if (key === 'disable') {
        newParams[key] = params[key]
      }
    }
  }

  if (process.env['ROOSEVELT_LOGGER_DISABLE_PREFIX'] === 'true') {
    newParams.enablePrefix = false
  }

  // loop defaults to make sure the newParams contains all default log types
  for (let key in defaults) {
    if (newParams[key] === undefined) {
      newParams[key] = defaults[key]
    }
  }
  return newParams
}

class Logger {
  constructor (params) {
    this.params = setParams(params)
    params = this.params
    // check to see if parameters are set
    if (params && typeof params === 'object') {
      // iterate over params
      for (let key in params) {
        // check if the param is already a key in the defaults
        if (key in defaults) {
          // set the value for the default param
          if (key === 'disable') {
            // loop through array of args in the disable param
            for (let env in params[key]) {
              // if the arg is set to true/"true" in process.env or it's the env in process.env.NODE_ENV, supress the logs
              if (process.env.NODE_ENV === params[key][env] || process.env[params[key][env]] === 'true') {
                transports.console.silent = true
              }
            }
          }

          if (['info', 'warn', 'verbose', 'error'].includes(key)) {
            let { enablePrefix } = params
            let { enable, type, color } = params[key]

            this[key] = function () {
              // log if the param is set to true
              if (enable !== 'false' && enable !== false) {
                // parse the log arguments
                let logs = argumentsToString(arguments, enablePrefix, params[key]['prefix'])
                // send the log level and message to winston for logging
                if (color === false) {
                  wLogger.log({ level: type, message: logs })
                } else {
                  wLogger.log({ level: type, message: colors[color](logs) })
                }
              }
            }
          }
        } else {
          // the param is a new key that's not one of the defaults
          let enable
          let type
          let color
          let { enablePrefix } = params

          // check if the new key is an object
          if (typeof params[key] === 'object') {
            // assign values. if enable isn't set, set it to true
            enable = params[key].enable
            type = params[key].type
            color = (typeof params[key].color === 'undefined')
              ? (() => {
                switch (type) {
                  case 'warn':
                    return 'yellow'
                  case 'error':
                    return 'red'
                  default:
                    return false
                }
              })()
              : params[key].color
          } else {
            // if it's not an object set enable
            enable = params[key]
            type = 'info'
            color = false
          }
          // create a function for the new param
          this[key] = function () {
            // log if the param is set to true
            if (enable !== 'false' && enable !== false) {
              // parse the log arguments
              let logs = argumentsToString(arguments, enablePrefix, params[key]['prefix'])
              // send the log level and message to winston for logging
              if (color === false) {
                wLogger.log({ level: type, message: logs })
              } else {
                wLogger.log({ level: type, message: colors[color](logs) })
              }
            }
          }
        }
      }
    }

    // create log function to map to logger.info
    this.log = this.info
  }
}

function validateType (type) {
  return type !== undefined && typeof type === 'string'
}

function validateEnable (enableBool) {
  return enableBool !== undefined && typeof enableBool === 'boolean'
}

function validatePrefix (prefix) {
  return prefix !== undefined && (typeof prefix === 'string' || typeof prefix === 'boolean')
}

function validateColor (color) {
  return color !== undefined && (typeof color === 'string' || typeof color === 'boolean')
}

module.exports = createLogger

function createLogger (params) {
  return new Logger(params)
}

createLogger.winston = winston
createLogger.winstonLogger = wLogger
createLogger.transports = transports
