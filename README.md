# roosevelt-logger

[![Build Status](https://travis-ci.org/rooseveltframework/roosevelt-logger.svg?branch=master)](https://travis-ci.org/rooseveltframework/roosevelt-logger) [![codecov](https://codecov.io/gh/rooseveltframework/roosevelt-logger/branch/master/graph/badge.svg)](https://codecov.io/gh/rooseveltframework/roosevelt-logger) [![npm](https://img.shields.io/npm/v/roosevelt-logger.svg)](https://www.npmjs.com/package/roosevelt-logger)

Intuitive, attractive logger for Node.js applications based on [Winston](https://github.com/winstonjs/winston). This module was built and is maintained by the [Roosevelt web framework team](https://github.com/rooseveltframework/roosevelt), but it can be used independently of Roosevelt as well.

## Install

First declare `roosevelt-logger` as a dependency in your app.

## Usage

Require the package into your application and call its constructor:

```js
const Logger = require('roosevelt-logger')
const logger = new Logger()

logger.log('some info')
//=> some info

logger.warn('a warning')
//=> ⚠️  a warning

logger.error('an error')
//=> ❌  an error

logger.verbose('noisy log only displayed when verbose is enabled')
//=>

logger.log('✅', 'log prepended with a custom emoji or other string')
//=> ✅  log prepended with a custom emoji or other string
```

## Configure logger

Optionally you can pass the logger a set of configs.

- `methods`: A set of configs that represent logger methods that are available to use. Each config type that maps to a default log type can be set to either a boolean to enable / disable the log or an object:

  - `info` *[Boolean]*: Enable regular logs.

    - Default: `true`.

  - `warn` *[Boolean]*: Enable logging of warnings.

    - Default: `true`.

  - `verbose` *[Boolean]*: Enable verbose (noisy) logging.

    - Default: `false`.

  - Custom log type *[Object]*: You can also define your own log types and specify what native log type it maps to.

    - API:
      - `enable` *[Boolean]*: Enable this custom log.
        - Default:  `true`.
      - `type` *[String]*: What type of native log this custom log maps to.
        - Default: `info`.
        - Allowed values: `info`, `warn`, or `error`.
      - `prefix`: *[String]*: The string that prefixes any log entry. If not set or set to a falsy value (e.g. `null`, an empty string, etc), the prefix will be disabled.
        - Default for warnings: `⚠️`.
        - Default for errors: `❌`.
      - `color`: *[String]*: The color that the text will be set to using [colors](https://www.npmjs.com/package/colors) npm package. If not set, it will use whatever the default color is for the native type selected.
    - Example: Simple custom type example for a new log type called `dbError`:

    ```json
    {
      "dbError": {}
    }
    ```

    - The above example would create a custom log type called `dbError`. Since no params are supplied to it, it defaults to being enabled and defaults to log type `info` with no prefix or color.

    - Complex custom type example:

    ```json
    {
      "dbError": {
        "enable": false,
        "type": "error",
        "prefix": "🗄",
        "color": "cyan"
      }
    }
    ```

- `params`: Configuration that applies to all logger methods:

  - `disable` *[Array of Strings]*: Disable all logging in certain environments. Each entry can be either an environment variable or the value of the `NODE_ENV` environment variable.
  - Default: `[]`.
    - Example usage:
      - `['LOADED_MOCHA_OPTS']`: Disables logger when app is being run by [Mocha](https://mochajs.org/).
      - `['production']`: Disables logger when `NODE_ENV` is set to `production`.

  - `enablePrefix` *[Boolean]*: Enable prefixes which can contain emojis or other strings to be prepended to logs. This can also be toggled with the `ROOSEVELT_LOGGER_ENABLE_PREFIX` environment variable.

## Usage with custom configs

Require the package into your application and call its constructor:

```js
const logger = require('roosevelt-logger')({
    verbose: true, // enables verbose logging
    dbError: {     // create custom error called dbError
        type: 'error',
        prefix: '🗄'
    }
    disable: ['LOADED_MOCHA_OPTS'] // disable logging during Mocha tests
})

logger.log('some info')
logger.warn('a warning')
logger.error('an error')
logger.verbose('noisy log only displayed when verbose is enabled')
logger.dbError('custom log for database errors')
```

Output:

```
some info
⚠️ a warning
❌ an error
noisy log only displayed when verbose is enabled
🗄 custom log for database errors
```

## Properties of roosevelt-logger module

In addition to the constructor, `roosevelt-logger` exposes the following properties:

### .winston()

The [Winston](https://www.npmjs.com/package/winston) module that `roosevelt-logger` uses internally.

### .winstonInstance

The specific [Winston](https://www.npmjs.com/package/winston) object instance instantiated by `roosevelt-logger`.

### .transports

The default [Winston transports](https://github.com/winstonjs/winston#transports) enabled by `roosevelt-logger`.

### .enableLogging()

Programmatically enable the logger.

### .disableLogging()

Programmatically disable the logger.

### .enablePrefix()

Programmatically enable all log prefixes.

### .disablePrefix()

Programmatically disable all log prefixes.

### .createLogMethod(config)

Programmatically create a new logger method.

- API:
  - `name` *[String]*: New Logger method name.
  - `type` *[String]*: What type of native log this custom log maps to.
    - Default: `info`.
    - Allowed values: `info`, `warn`, or `error`.
  - `prefix`: *[String]*: The string that prefixes any log entry. If not set or set to a falsy value (e.g. `null`, an empty string, etc), the prefix will be disabled.
    - Default for warnings: `⚠️`.
    - Default for errors: `❌`.
  - `color`: *[String]*: The color that the text will be set to using [colors](https://www.npmjs.com/package/colors) npm package. If not set, it will use whatever the default color is for the native type selected.
- Example:

```js
  logger.createLogMethod({
    name: 'dbError',
    type: 'error'
    prefix: '💥 ',
    color: 'red'
  })

  logger.dbError('Our whole stack is in crisis mode!')
  //=> 💥 Our whole stack is in crisis mode!
```
