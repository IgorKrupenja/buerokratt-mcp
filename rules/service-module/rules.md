---
modules:
  - service-module
tags:
  - service-module
  - overview
  - testing
  - utils
description: Service Module specific rules (overview, testing, utilities)
---

# Project Overview

This repository contains a Service Module with two main parts:

- **GUI folder**: React-based front-end application (contains all frontend code and tests)
- **DSL folder**: Back-end using a custom stack (configuration-based, no unit tests)

# Tests

- **Tests are ONLY in GUI folder**: All tests are located in the `GUI/` directory
- **Run tests from GUI directory**: Always `cd GUI` before running `npm run test:run`
- **Testing Framework**: Use Vitest + @testing-library/react (NOT Jest)
- **Test Execution**: Use `npm run test:run` for running tests (NOT `npm test` which is watch mode)
- **Test File Naming**: Test files must be named `*.test.ts` (not `.spec.ts` or other variations)
- **Test File Location**: Test files are collocated with the code they test (same directory as source files)
- **Test File Names**: Test file names should match the name of the file from where tested stuff is exported
  (e.g., `utils.ts` → `utils.test.ts`)
- **Always suggest adding tests** for new code (new files, new functions in existing files)
- **Avoid test duplication**: Be reasonable when creating tests and avoid testing the same functionality multiple times
- **Export Requirements**: If a function under test is not exported, add export so that tests can be added successfully
- **Test Coverage**: Ensure comprehensive test coverage for all new functionality
- **Coverage Commands**: Use `npm run test:run -- --coverage --reporter=verbose` with:
  - Specific test files: `src/utils/object-util.test.ts`
  - Pattern matching: `--run object-util` (matches `object-util.test.ts`)
  - Directory coverage: `src/utils/` (runs all tests in directory)
- **ALWAYS run tests until they pass** before proceeding with other tasks
- **Test-First Approach**: ONLY fix linter issues after all tests pass
- **Step-by-Step Tests**: When you have several functions, create tests step by step. First for one function, so it
  can be reviewed. Only after that, create tests for second function, review + so on

# SQL Rules (Service Module Specific)

- **UPDATE and DELETE Statements for `services/` folder**: UPDATE and DELETE statements are allowed and should be used
  for modifying and removing data. When updating records, use direct identifiers (e.g., `service_id`, `endpoint_id`) in
  WHERE clauses.
- **UPDATE and DELETE Statements for `training/` and `analytics/` folders**: UPDATE and DELETE statements are NOT
  ALLOWED (see shared-backend/sql-restrictions.md for details). This is an exception - service-module allows
  UPDATE/DELETE in the `services/` folder only.

# Utils

- **String Utilities**: Use `src/utils/string-util.ts` for string manipulation functions:
  - **Template Functions**: `isTemplate()`, `stringToTemplate()`, `templateToString()` for `${variable}` template handling
  - **Escaping Curly Brackets**: `stringToEscapedTemplate()` for expressions with curly brackets - wraps value in
    `$= ... =` syntax (use when generating Ruuter YAML expressions that contain `{}` like functions or objects)
  - **Case Conversion**: `toSnakeCase()`, `fromSnakeCase()` for snake_case ↔ display format conversion
  - **String Processing**: `getLastDigits()`, `removeTrailingUnderscores()`, `stringToArray()`, `removeNestedTemplates()`
- **i18n Utilities**: Use `src/utils/i18n-util.ts` for translation helpers:
  - **Object Translation**: `translateObjectKeys()` for translating object keys using translation paths
- **Import Pattern**: Import specific functions: `import { functionName } from 'utils/filename'`
- **Usage Context**: String utils are used in components, services, and form elements for data processing

