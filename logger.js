const defaults = require('./defaults.json')
const emoji = require('node-emoji')
const toArray = require('lodash.toarray')
const util = require('util')
const winston = require('winston')
const { combine, printf } = winston.format

// transports object to easily override settings
const transports = {
  console: new winston.transports.Console({
    stderrLevels: ['error', 'warn'],
    json: false,
    colorize: true
  })
}

// logger module
const logger = winston.createLogger({
  // clean output instead of winstons default
  format: combine(
    printf(info => `${info.message}`)
  ),
  // basic console transport set-up
  transports: [
    transports.console
  ]
})

/**
 * Takes in an input of arguments which are parsed, concatenated,
 * and returned back as a string.
 * @param {object} input - Objet of arguments to be parsed
 * @param {string} type - Accepts type 'error', 'warn', or null to prepend the log type to the returning string.
 * @param {boolean} enableEmoji - If the returning string should contain emojis or remove them
 * @returns {string} - Returns the parsed and concatenated string of arguments
 */
function argumentsToString (input, type, enableEmoji) {
  let str = ''
  let args = Array.prototype.slice.call(input)
  if (typeof args[0] === 'string' && args[0].length !== 0 && (type === 'warn' || type === 'error')) {
    if ((type === 'warn' || type === 'error') && enableEmoji && !emoji.which(args[0])) {
      str += type === 'error' ? '❌  ' : '⚠️  '
    } else if (!enableEmoji) {
      str += type === 'error' ? 'error: ' : 'warning: '
    }
  }
  for (let k in args) {
    if (typeof args[k] === 'string') {
      if (enableEmoji && emoji.which(args[k])) {
        str += args[k] + '  '
      } else if (!enableEmoji) {
        if (!emoji.which(args[k])) {
          str += removeEmojis(args[k]) + ' '
        }
      } else {
        str += args[k] + ' '
      }
    } else {
      str += util.inspect(args[k], false, null, true) + ' '
    }
  }
  return str
}

/**
 * Removes emojis and 1 proceeding space if one exists
 * Ex: 'Test 🌗 String' would be 'Test String'
 * @param {string} str - String to remove emojis from
 * @returns {String} - String with the emojis removed
 */
function removeEmojis (str) {
  let words = toArray(str)
  for (let x = words.length - 1; x >= 0; x--) {
    if (emoji.findByCode(words[x])) {
      words[x] = ''
      if (words[x + 1] === ' ') {
        words[x + 1] = ''
      }
    }
  }
  return words.join('')
}

class Logger {
  constructor (params) {
    // check to see if parameters are set
    if (params && typeof params === 'object') {
      // iterate over params
      for (let key in params) {
        // check if the param is already a key in the defaults
        if (key in defaults) {
          // set the value for the default param
          switch (key) {
            case 'appStatus':
              this.enableAppStatus = params[key]
              break
            case 'warnings':
              this.enableWarnings = params[key]
              break
            case 'verbose':
              this.enableVerbose = params[key]
              break
            case 'emoji':
              this.enableEmoji = params[key]
          }
        } else if (key === 'disable') {
          // loop through array of args in the disable param
          for (let env in params[key]) {
            // if the arg is set to true/"true" in process.env or it's the env in process.env.NODE_ENV, supress the logs
            if (process.env.NODE_ENV === params[key][env] || process.env[params[key][env]] === true || process.env[params[key][env]] === 'true') {
              transports.console.silent = true
            }
          }
        } else {
          // the param is a new key that's not one of the defaults
          let enable
          let type
          let emoji
          // check if the new key is an object
          if (typeof params[key] === 'object') {
            // assign values. if enable isn't set, set it to true
            enable = (params[key]['enable'] !== undefined) ? params[key]['enable'] : true
            type = params[key]['type'] || 'info'
            emoji = typeof params.emoji !== 'undefined' ? params.emoji : true
          } else {
            // if it's not an object set enable
            enable = params[key]
            type = 'info'
            emoji = typeof params.emoji !== 'undefined' ? params.emoji : true
          }
          // create a function for the new param
          this[key] = function () {
            // log if the param is set to true
            if (enable !== 'false' && enable !== false) {
              // parse the log arguments
              let logs = argumentsToString(arguments, type, emoji)
              // send the log level and message to winston for logging
              logger.log({ level: type, message: logs })
            }
          }
        }
      }
    } else {
      // if there are no parameters set then use the defaults
      this.enableAppStatus = defaults.appStatus
      this.enableWarnings = defaults.warnings
      this.enableVerbose = defaults.verbose
      this.enableEmoji = defaults.emoji
    }
  }

  // default log types
  // appStatus logs
  log () {
    if (this.enableAppStatus !== 'false' && this.enableAppStatus !== false) {
      logger.log({ level: 'info', message: argumentsToString(arguments, null, this.enableEmoji) })
    }
  }

  // warning logs
  warn () {
    if (this.enableWarnings !== 'false' && this.enableWarnings !== false) {
      logger.log({ level: 'warn', message: argumentsToString(arguments, 'warn', this.enableEmoji) })
    }
  }

  // verbose logs
  verbose () {
    if (this.enableVerbose !== 'false' && this.enableVerbose !== false) {
      logger.log({ level: 'info', message: argumentsToString(arguments, null, this.enableEmoji) })
    }
  }

  // error logs (always on by default)
  error () {
    logger.log({ level: 'error', message: argumentsToString(arguments, 'error', this.enableEmoji) })
  }
}

module.exports = (params) => new Logger(params)
