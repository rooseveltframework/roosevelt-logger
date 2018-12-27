# roosevelt-logger

Intuitive, attractive logger for Node.js applications based on [Winston](https://github.com/winstonjs/winston). This module was built and is maintained by the [Roosevelt web framework team](https://github.com/rooseveltframework/roosevelt), but it can be used independently of Roosevelt as well.

## Install

First declare `roosevelt-logger` as a dependency in your app.

## Usage

Require the package into your application and call its constructor:

```js
const logger = require('roosevelt-logger')()

logger.log('some info')
logger.warn('a warning')
logger.error('an error')
logger.verbose('noisy log only displayed when verbose is enabled')
```

This would output the following:

```
some info
⚠️  a warning
❌  an error
```

## Configure logger

Optionally you can pass the logger a set of configs. Each config type that maps to a default log type can be set to either a boolean to enable / disable the log or an object :

- `info` *[Boolean]*: Enable regular logs.

  - Default: `true`.

- `warnings` *[Boolean]*: Enable logging of warnings.

  - Default: `true`.

- `verbose` *[Boolean]*: Enable verbose (noisy) logging.

  - Default: `false`.

- `disable` *[Array of Strings]*: Disable logging in certain environments. Each entry can be either an environment variable or a set NODE_ENV mode.

  - Default: `[]`.
  - Example usage:
    -`['LOADED_MOCHA_OPTS']` (disables logger when being run by [Mocha](https://mochajs.org/).)
    -`['production']` (disables logger when NODE_ENV is set to 'production'.)

- `enablePrefix` *[Boolean]*: Enable prefixes which can contain emojis to be prepended to logs. This can also be toggled with the `ROOSEVELT_LOGGER_ENABLE_PREFIX` environment variable.

- Custom log type *[Object]*: You can also define your own log types and specify what native log type it maps to.

  - API:

    - `enable` *[Boolean]*: Enable this custom log.
      - Default:  `true`.
    - `type` *[String]*: What type of native log this custom log maps to.
      - Default: `info`
      - Allowed values: `info`, `warn`, or `error`.
    - `prefix`: *[String]*: The string that prefixes any log entry. If set to a falsy item (null, an empty string, etc), the prefix will be disabled for the following log type.
      - default: If not set, default to the prefix of the type (i.e.: if the type is `warn`, the prefix will default to `⚠️`)
    - `color`: *[String]*: The color that the text will be set to using [Colors](https://www.npmjs.com/package/colors).
      - default: If not set, it will default to the color of the type for `warn` and `error`, and no color for `info`.

  - Simple custom type example for a new log type called `dbError`:

    ```json
    {
      "dbError": {}
    }
    ```

  - The above example would create a custom log type `dbError`. Since no params are supplied to it, it defaults to being enabled and defaults to log type `info` and no prefix or color.

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

## Usage with custom configs

Require the package into your application and call its constructor:

```js
const logger = require('roosevelt-logger')({
    verbose: true,
    dbError: {
        type: 'error',
        prefix: '🗄'
    }
    disable: ['LOADED_MOCHA_OPTS']
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

In addition to the constructor, roosevelt-logger exposes the following properties:

* `winston`: *[Function]*: The instance of [Winston](https://www.npmjs.com/package/winston) that roosevelt-logger uses internally.
* `winstonLogger`: The specific logger instance of [Winston](https://www.npmjs.com/package/winston) in roosevelt-logger.
* `transports`: The default transports enabled by roosevelt-logger.