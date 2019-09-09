# Changelog

## Next version

- Put your changes here...

## 0.2.3

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
