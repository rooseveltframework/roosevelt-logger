# roosevelt-logger

Intuitive, attractive logger for Node.js applications based on Winston.

## Install

You can install `roosevelt-logger` from NPM:

```
npm install roosevelt-logger
```

## Usage

To use the `roosevelt-logger` simply require the package into your application:

```js
const logger = require('roosevelt-logger')()
```

Optionally you can pass the logger a set of configurations. There are default log types that can be enabled and disabled. Additionally custom log types can also be added.

* Default log types: *[Object]*
  ```json
  {
    "info": true,
    "warnings": true,
    "verbose": false
  }
  ```
* Custom log types: *[Object]*
  ```json
  {
    "debug": {
      "enable": true,
      "type": "error"
    }
  }
  ```
  * `enable`: Enables or disables the custom log.
    * Default: *[Boolean]* `true`.
  * `type`: Specifies what kind of log your custom log is:
    * Allowed values: *[String]* `info`, `warn`, or `error`.
* Disable logging in certain environments:
  * Example: `'disable': ['LOADED_MOCHA_OPTS']`

Example usage of a custom configuration with the `roosevelt-logger`:

```js
const logger = require('roosevelt-logger')({
  "info": true,
  "warnings": true,
  "verbose": false,
  "debug": {
    "enable": true,
    "type": "error"
  },
  "disable": ['production']
})
```

## Unit Tests

To run the unit tests use the command:

```
npm run test
```

To run the unit tests with a coverage report use the command:

```
npm run coverage
```
