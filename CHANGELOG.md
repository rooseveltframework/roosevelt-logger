## 2.0.0

- Breaking: Dropped Node 20 support.
- Breaking: `roosevelt-logger` is no longer based on Winston. Accordingly, removed the `winston`, `winstonInstance`, and `transports` properties from the logger instance. Logging is now toggled with the `silent` property, which `enableLogging()` and `disableLogging()` continue to set for you.
- Breaking: the `color` param now accepts the format names supported by `util.styleText` (the keys of `util.inspect.colors`) rather than those of `@colors/colors`. Most names are shared between the two, but a few differ, e.g. `brightRed` is now `redBright`. An unsupported color name falls back to the default color for the log type instead of crashing. Colors are now suppressed when the target stream is not a TTY, when `NO_COLOR` is set, or when `FORCE_COLOR` is set to `0`.
- Fixed a bug where log methods created with `createLogMethod()` ignored the `enablePrefix` param and never displayed their prefix.
- Fixed a bug where log methods created with `createLogMethod()` were written to the wrong place in the logger config.
- Fixed a bug where calling a log method with no arguments would print `undefined`.
- Updated dependencies.

## 1.0.1

- Fixed crash.

## 1.0.0

- Refactored the code.
- Updated dependencies.

## 0.2.3

- Dropped Node 10 and Node 12 support
- Updated various dependencies
  - Migrated colors to @colors/colors
- Migrated from Travis to GitHub Actions

## 0.2.2

- Fixed bug which caused whitespace at the end of a log to be removed.
- Better docs.
- CI improvements.
- Various dependencies bumped.

## 0.2.1

- Fixed bug where disabling prefix would chop off more than the prefix.
- CI improvements.
- Various dependencies bumped.

## 0.2.0

- Module fully refactored, including some breaking API changes, such as:
  - Changed to class-based instantiation:
    - Added `enableLogger()` and `disableLogger()` methods.
    - Added `enablePrefix()` and `disablePrefix()` methods.
    - Added `createLogMethod()` method.
  - Other smaller changes to the API as well. See README.

## 0.1.0

- Initial version.
