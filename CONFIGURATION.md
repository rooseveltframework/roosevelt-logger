## Params

The following params can be passed when creating a new instance of `roosevelt-logger`:

- `methods` *[Object]*: A set of configs that represent logger methods that are available to use. Each config type that maps to a default log type can be set to either a boolean to enable / disable the log or an object:
  - `info` *[Boolean]*: Enable regular logs. Default: `true`.
  - `warn` *[Boolean]*: Enable logging of warnings. Default: `true`.
  - `verbose` *[Boolean]*: Enable verbose (noisy) logging. Default: `false`.
  - `[custom log name]` *[Object]*: You can also define your own log types and specify what native log type it maps to.
    - API:
      - `enable` *[Boolean]*: Enable this custom log. Default:  `true`.
      - `type` *[String]*: What type of native log this custom log maps to. Default: `info`.
        - Allowed values: `info`, `warn`, or `error`.
      - `prefix`: *[String]*: The string that prefixes any log entry. If not set or set to a falsy value (e.g. `null`, an empty string, etc), the prefix will be disabled.
        - Default for warnings: `⚠️`.
        - Default for errors: `❌`.
      - `color`: *[String]*: The color that the text will be set to using [@colors/colors](https://www.npmjs.com/package/@colors/colors) npm package. If not set, it will use whatever the default color is for the native type selected.

Custom type example:

```json
{
  "dbError": {
    "type": "error",
    "prefix": "🗄",
    "color": "cyan"
  }
}
```

The above example would create a custom log type called `dbError`. It will log errors with a 🗄 prefix and cyan text color.

- `params`: Configuration that applies to all logger methods:
  - `disable` *[Array of Strings]*: Disable all logging in certain environments. Each entry can be either an environment variable or the value of the `NODE_ENV` environment variable. Default: `[]`.
    - Example usage:
      - `['LOADED_MOCHA_OPTS']`: Disables logger when app is being run by [Mocha](https://mochajs.org/).
      - `['production']`: Disables logger when `NODE_ENV` is set to `production`.
  - `enablePrefix` *[Boolean]*: Enable prefixes which can contain emojis or other strings to be prepended to logs. This can also be toggled with the `ROOSEVELT_LOGGER_ENABLE_PREFIX` environment variable. Default: `true`.

## API

When you create an instance of `roosevelt-logger`, the following properties will be available on the `logger` instance:

- `winston` *[Object]*: The [Winston](https://www.npmjs.com/package/winston) module that `roosevelt-logger` uses internally.
- `winstonInstance` *[Object]*: The specific [Winston](https://www.npmjs.com/package/winston) object instance instantiated by `roosevelt-logger`.
- `transports` *[Object]*: The default [Winston transports](https://github.com/winstonjs/winston#transports) enabled by `roosevelt-logger`.
- `enableLogging()` *[Function]*: Enable the logger.
- `disableLogging()` *[Function]*: Disable the logger.
- `enablePrefix()` *[Function]*: Enable all log prefixes.
- `disablePrefix()` *[Function]*: Disable all log prefixes.
- `createLogMethod(config)` *[Function]*: Programmatically create a new logger method.
  - `config` argument *[Object]*:
    - `name` *[String]*: New logger method name.
    - `type` *[String]*: What type of native log this custom log maps to.
      - Default: `info`.
      - Allowed values: `info`, `warn`, or `error`.
    - `prefix`: *[String]*: The string that prefixes any log entry. If not set or set to a falsy value (e.g. `null`, an empty string, etc), the prefix will be disabled.
      - Default for warnings: `⚠️`.
      - Default for errors: `❌`.
    - `color`: *[String]*: The color that the text will be set to using [colors](https://www.npmjs.com/package/colors) npm package. If not set, it will use whatever the default color is for the native type selected.

Example `createLogMethod` usage:

```js
logger.createLogMethod({
  name: 'dbError',
  type: 'error'
  prefix: '💥',
  color: 'red'
})

logger.dbError('Our whole stack is in crisis mode!')
// => 💥 Our whole stack is in crisis mode!
```
