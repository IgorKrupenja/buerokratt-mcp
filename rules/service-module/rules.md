---
modules:
  - Service-Module
tags:
  - service-module
  - overview
  - testing
  - utils
description: Service Module specific rules (overview, testing, utilities)
---

## Project Overview

This repository contains a Service Module with two main parts:

- **GUI folder**: React-based front-end application (contains all frontend code and tests)
- **DSL folder**: Back-end using a custom stack (configuration-based, no unit tests)

## Tests

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

## SQL Rules (Service Module Specific)

- **UPDATE and DELETE Statements for `services/` folder**: UPDATE and DELETE statements are allowed and should be used
  for modifying and removing data. When updating records, use direct identifiers (e.g., `service_id`, `endpoint_id`) in
  WHERE clauses.
- **UPDATE and DELETE Statements for `training/` and `analytics/` folders**: UPDATE and DELETE statements are NOT
  ALLOWED (see shared-backend/sql-restrictions.md for details). This is an exception - Service-Module allows
  UPDATE/DELETE in the `services/` folder only.

## Utils

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

## Service Testing

- **Service Storage**: Services are saved as YAML files in `DSL/Ruuter/services/POST/services/{status}/{serviceName}.yml` where `{status}` is one of: `active`, `inactive`, `draft`, `ready`
- **Programmatic Service Testing**: Services can be tested programmatically using curl or HTTP requests to Ruuter:
  - **Endpoint Format**: `http://localhost:8086/services/services/{state}/{serviceName}` (e.g., `http://localhost:8086/services/services/active/igor_837`)
    - **Note**: The path includes double "services" prefix: `{baseUrl}` already contains `/services`, and the endpoint adds `/services/{state}/{serviceName}`
  - **Method**: POST
  - **Required Headers**:
    - `Content-Type: application/json`
    - `x-ruuter-testing: {testingKey}` (default: `voorshpellhappilo` from `REACT_APP_RUUTER_SERVICES_TESTING_HEADER`)
  - **Request Body**: Format depends on the service's `allowList` declaration. Common fields include:
    - `chatId` (string): The chat ID for the message
    - `authorId` (string): The author ID for the message
    - `input` (string): Can only be a string, separated by commas. E.g. `value1,value2,value3` or just `value`.
  - **Example curl command**:

    ```bash
    curl -X POST http://localhost:8086/services/services/active/igor_837 \
      -H "Content-Type: application/json" \
      -H "x-ruuter-testing: voorshpellhappilo" \
      -d '{"chatId": "test-chat-123", "authorId": "test-author-456", "input": {"test": "data"}}'
    ```

  - **Service States**: Use lowercase state names: `active`, `inactive`, `draft`, `ready`
  - **Testing Header**: The `x-ruuter-testing` header enables detailed error responses from Ruuter during testing

## Front-End Browser Access

- **⚠️ MANDATORY AUTHENTICATION STEPS**: When opening the Service Module front-end in a browser (via `browser_navigate` or similar), you MUST follow ALL authentication steps below. These steps are REQUIRED, not optional.
- **When to Apply**: These steps apply whenever you:
  - Open the browser to the Service Module front-end (`http://localhost:3006`)
  - Navigate to any Service Module page that requires authentication
  - Test or interact with the front-end interface
- **Authentication Required**: The front-end requires authentication via a JWT cookie to access protected content. Without authentication, the page may load but protected features will not be accessible.
- **Required Steps** (MUST be completed in order):
  1. **Make Cookie Request**: Execute a login request to TIM to obtain the JWT token (requires `network` permission):

     ```bash
     curl -X POST -H "Content-Type: application/json" \
       -d '{"login": "EE30303039914", "password": "OK"}' \
       http://localhost:8086/services/auth/login
     ```

  2. **Extract Token**: The response contains a `response` field with the JWT token value
  3. **Open Browser**: Navigate to the Service Module front-end URL (`http://localhost:3006/services/overview`)
  4. **Add Cookie to Browser**: Set the `customJwtCookie` cookie in the browser with the token value using `browser_evaluate`:
     - Cookie name: `customJwtCookie`
     - Cookie value: The JWT token from the login response
     - Domain: `localhost`
     - Path: `/`
     - Example JavaScript: `document.cookie = "customJwtCookie={TOKEN}; path=/; domain=localhost";`
  5. **Refresh the Page**: **This step is necessary** - After setting the cookie, refresh/navigate to the page again to see the authenticated content. The page will not display protected content until after a refresh
