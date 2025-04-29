## Install

First declare `roosevelt-logger` as a dependency in your app.

## Use

```js
const Logger = require('roosevelt-logger')
const logger = new Logger()

logger.log('some info')
// => some info

logger.warn('a warning')
// => ⚠️  a warning

logger.error('an error')
// => ❌  an error

logger.verbose('noisy log only displayed when verbose is enabled')
// =>

logger.log('✅', 'log prepended with a custom emoji or other string')
// => ✅  log prepended with a custom emoji or other string
```

## Use with custom configs

```js
const Logger = require('roosevelt-logger')
const logger = new Logger({
  methods: {
    verbose: true, // enables verbose logging
    dbError: { // create custom error called dbError
      type: 'error',
      prefix: '🗄'
    }
  },
  params: {
    disable: ['LOADED_MOCHA_OPTS'] // disable logging during Mocha tests
  }
})

logger.log('some info')
// => some info

logger.warn('a warning')
// => ⚠️  a warning

logger.error('an error')
// => ❌  an error

logger.verbose('noisy log only displayed when verbose is enabled')
// => noisy log only displayed when verbose is enabled

logger.dbError('custom log for database errors')
// => 🗄  custom log for database errors
```

See "Configuration" for more info about how to configure `roosevelt-logger`.
