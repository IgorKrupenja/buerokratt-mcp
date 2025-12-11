# Cursor Rules for Service-Module Repository

⚠️ **WARNING: THIS FILE IS NOT USED BY MCP SERVER** ⚠️

**This is an example/reference file showing the original `.cursorrules` format from Service-Module.**
**The MCP server uses the modular rules structure in the `rules/` directory instead.**
**This file is kept here for reference only and should not be used normally.**
**It is not guaranteed to be up to date with the MCP server rules in the `rules/` directory.**

<!-- This file should not exceed 500 lines. -->
<!-- If more lines are needed, split the file into multiple files and use the approach suggested here: -->
<!-- https://forum.cursor.com/t/maximum-file-size-for-cursorrules-in-cursor-ide/39374/3 -->

## Project Overview

This repository contains a Service Module with two main parts:

- **GUI folder**: React-based front-end application (contains all frontend code and tests)
- **DSL folder**: Back-end using a custom stack (configuration-based, no unit tests)

## Back-End

### Database Migrations

- **Migration Location**: SQL migrations are in `DSL/Liquibase/changelog/` folder
- **Migration Format**: Check latest files in `Liquibase/changelog` folder for current format
- **Three Files Required**: When creating migrations, ALWAYS create three files:
  - **XML file**: `YYYYMMDDHHMMSS_description.xml` in `changelog/` folder
  - **SQL file**: `YYYYMMDDHHMMSS_description.sql` in `changelog/migrations/` folder
  - **Rollback file**: `YYYYMMDDHHMMSS_rollback.sql` in `changelog/migrations/rollback/` folder
- **File Naming**: Use timestamp format `YYYYMMDDHHMMSS` followed by descriptive name
- **XML Structure**: Include proper XML headers and changeSet with sqlFile and rollback sections
- **Legacy Migrations**: Do NOT modify old migrations in legacy format (direct .sql files)
- **Local Execution**: Run migrations locally with `migrate.sh` in repo root
- **Author Format**: Use GitHub username in changeSet. Get username with `git remote get-url origin | sed 's/.*github.com[:/]\([^/]*\)\/.*/\1/'`

### SQL Queries

- **Location**: SQL files are under `DSL/Resql/` folder
- **Database Structure**:
  - `services/` - Main services database (most queries)
  - `training/` - Training database queries
  - `users/` - User management queries
- **IMPORTANT**: Always use snake_case for new SQL files (e.g., `get_services_list.sql`, `create_endpoint.sql`) - this is a strict requirement
- **Legacy Files**: Do NOT rename old files with incorrect naming conventions
- **Parameter Format**: Use colon-prefixed parameters: `:page_size`, `:search`, `:sorting`, `:page`, `:id`
- **Type Casting**: Use PostgreSQL type casting: `:value::uuid`, `:state::service_state`, `:data::json`
- **UPDATE and DELETE Statements**:
  - **For `services/` folder**: UPDATE and DELETE statements are allowed and should be used for modifying and removing data. When updating records, use direct identifiers (e.g., `service_id`, `endpoint_id`) in WHERE clauses.
  - **For `training/` and `users/` folders**: UPDATE and DELETE statements are NOT ALLOWED. Use INSERT statements with SELECT from existing records as a workaround:
    - Copy all fields from existing record
    - Modify only the fields that need to change
    - Use `ORDER BY id DESC LIMIT 1` to get latest record
- **Query Structure**:
  - Use CTEs (WITH clauses) for complex queries
  - Include pagination with `OFFSET` and `LIMIT`
- **HTTP Method Folders**: Organize by HTTP method (`GET/`, `POST/`) within database folders

### Business Logic (Ruuter YAML)

- **Location**: YAML files are under `DSL/Ruuter/` folder
- **Purpose**: YAML files define API endpoints and business logic
- **Structure**: Each YAML file represents one API endpoint
- **File Organization**:
  - `services/` - Main service endpoints
  - `training/` - Training-related endpoints
  - `users/` - User management endpoints
  - `TEMPLATES/` - Reusable template endpoints
- **HTTP Methods**: Organize by method (`GET/`, `POST/`) within service folders

#### YAML Structure Patterns

```yaml
declaration:
  call: declare
  version: 0.1
  description: 'Description of the endpoint'
  method: post # or get
  accepts: json
  returns: json
  namespace: service
  allowlist:
    body:
      - field: paramName
        type: string|number|boolean|object
        description: 'Parameter description'
    params:
      - field: id
        type: string
        description: 'URL parameter'
    headers:
      - field: cookie
        type: string
        description: 'Header field'
```

#### Variable Assignment Pattern

```yaml
extract_request_data:
  assign:
    name: ${incoming.body.name}
    description: ${incoming.body.description}
    type: ${incoming.body.type.toUpperCase()}
    id: ${incoming.params.id}
  next: next_step_name
```

#### Escaping Curly Brackets

- **Standard Syntax**: Use `${...}` for JavaScript expressions without curly brackets
- **Escaping Syntax**: Use `$= ... =` for JavaScript expressions that contain curly brackets `{}`
- **When to Use**: Use `$= ... =` when expressions contain:
  - Function definitions with function bodies: `$= (function() { return value; })() =`
  - Object literals: `$= {"key1":"value1","key2":"value2"} =`
  - Any other JavaScript code with curly brackets
- **Helper Function**: In front-end code, use `stringToEscapedTemplate()` from `src/utils/string-util.ts` when generating expressions that may contain curly brackets

**Examples:**

```yaml
assign:
  # Function with curly brackets - use $= ... =
  dateString: $= (function() { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); })() =

  # Object literal - use $= ... =
  config: $= {"key1":"value1","key2":"value2"} =

  # Simple expression without curly brackets - use ${...}
  name: ${incoming.body.name}
```

#### Conditional Logic Pattern

```yaml
check_for_required_parameters:
  switch:
    - condition: ${incoming.body.name == null || incoming.body.description == null}
      next: return_incorrect_request
    - condition: ${incoming.body.type === 'GET'}
      next: handle_get_type
  next: default_next_step
```

#### HTTP Call Pattern

```yaml
service_add:
  call: http.post # or http.get
  args:
    url: '[#SERVICE_RESQL]/add'
    body:
      name: ${name}
      description: ${description}
      type: ${type}
    headers:
      cookie: ${incoming.headers.cookie}
  result: createdService
  next: next_step
```

#### Response Pattern

```yaml
return_ok:
  reloadDsl: true # Optional: reload DSL after success
  status: 200
  return: ${results.response.body}
  next: end

return_error:
  status: 400
  return: 'Error message'
  next: end
```

#### Key Rules

- **JavaScript in ${}**: Everything inside `${}` is JavaScript code executed by Ruuter
- **Variable Access**: Use `incoming.body.field`, `incoming.params.field`, `incoming.headers.field`
- **Service URLs**: Use `[#SERVICE_NAME]` for service references (e.g., `[#SERVICE_RESQL]`, `[#SERVICE_DMAPPER]`)
- **Conditional Logic**: Use `switch` with `condition` for if/else logic
- **Step Flow**: Use `next` to define execution flow
- **Error Handling**: Always include error response patterns
- **Result Storage**: Use `result` to store HTTP call responses
- **Variable Assignment**: Use `assign` to create/modify variables
- **File Operations**: Use DMAPPER service for file operations
- **Database Operations**: Use RESQL service for database queries
- **HTTP Call Requirements**:
  - `result` is REQUIRED for all HTTP calls (endpoint fails without it). Always include `result` even if you don't plan to use the response
  - `next` is optional but useful for flow control

## Front-End

### Component Architecture

- **Extract Functions**: When dealing with React components, extract functions from component itself OUTSIDE for testability
- **Separate Testable Logic**: Place extracted functions in separate files and export them for easy testing
- **Small Functions**: Make functions small to make them easily testable

### File Naming & Organization

- **Component Names**: Use CamelCase for component names
- **Other Files**: Use kebab-case for all other files
- **Component Structure**: Components go to `src/components` folder
- **Component Folders**: Each folder inside `src/components` is a component or set of closely related components
- **Single Component**: Use `index.tsx` for single components
- **Multiple Related Components**: Use `index.tsx` for main component, `CamelCasedComponentName.tsx` for others

### Styling

- **CSS Modules**: Use CSS modules for new components
- **Legacy Components**: If small, suggest changing old components to use CSS modules
- **CSS Units**: CSS values should be in em, not px

### Type Management

- **Component Props**: Always use `interface` for component props, never `type` (e.g., `interface ComponentProps { ... }`)
- **Repeated Types**: If you see repeated types in code, create a new type for them
- **Local Types**: If used only in one file, create in that file (prefer local over global)
- **Global Types**: Otherwise create in `src/types/`
- **One Type Per File**: Types in `src/types/` should be one type per file
- **Split Legacy Types**: When dealing with old types in `src/types/`, if there are several types in one file, split them into separate files

### Linting

- **Full Lint**: Run lint with `npm lint` for the entire project
- **Single File/Directory**: When linting specific files or directories, always use `--max-warnings 0`
- **Always Check**: ALWAYS check for lint and format issues when done with code (INCLUDING tests) changes

### Internationalization (i18n)

- **No Hardcoded Strings**: NEVER hardcode user-facing strings in components. ALL user-visible text MUST use translation files
- **Languages**: Only English and Estonian are supported
- **Create Translations**: Always create translations yourself if not present for BOTH languages
- **Translation Files**: Located in `src/i18n/en/common.json` and `src/i18n/et/common.json`
- **Key Structure**: Use dot notation for nested keys (e.g., `global.add`, `chat.service-input`, `settings.title`)
- **Usage Pattern**: Use `useTranslation()` hook in components: `const { t } = useTranslation();`
- **Translation Calls**: Use `t('key.path')` for translation calls
- **Key Organization**: Organize keys by feature/component (e.g., `global.*`, `chat.*`, `settings.*`, `menu.*`)
- **Both Languages Required**: When adding new translation keys, add them to BOTH `en/common.json` AND `et/common.json`
- **Key Naming**: Use kebab-case for multi-word keys (e.g., `service-input`, `max-user-input-try-count`)
- **Key Content Alignment**: Rename translation keys to match their string content when refactoring. Keep key names simple and aligned with the actual translation values

#### Using Translations Outside React Components

- **Outside React Hooks**: When using translations outside of React components or hooks, use direct `t` import from i18next
- **Import Pattern**: `import { t } from 'i18next';` (NOT `useTranslation` hook)
- **Usage Context**: Use in utility functions, constants, services, handlers, and other non-React code
- **Examples**:
  - Utility functions: `src/utils/constants.ts`
  - Service files: `src/services/service-builder.ts`
  - Handler files: `src/handlers/unsavedChangesDialog.tsx`
  - Component files with non-hook functions: `src/components/FlowElementsPopup/AssignBuilder/AssignElement.tsx`
- **Hook vs Direct Import**:
  - **React Components**: Use `useTranslation()` hook inside React components
  - **Non-React Code**: Use direct `import { t } from 'i18next'` for utility functions, services, constants, etc.
- **Never Mix**: Never use `useTranslation()` hook outside of React components - it will cause linter errors

### Code Quality

- **No Double Negation**: Never use double negation in variables, functions, types, etc naming. Fix double negation if you come across it
- **ALWAYS Check Usages**: Before removing or modifying any prop, parameter, function, component signature, type definition, or interface property, you MUST search the entire codebase for all usages and update them accordingly. This includes:
  - Function calls and references
  - Type imports and usage
  - Interface/type property access
  - Component prop usage
  - Variable assignments and destructuring
  - Never remove something without checking where it's used first
- **Unused Code**: Actively check for unused variables, functions etc and either use them (could be a bug) or remove them if no longer necessary
- **Avoid Trivial Comments**: Do not add trivial comments in code, if they are obvious and code is simple and self-explanatory
- **Avoid `any` and `unknown` types**: Avoid using `any` or `unknown` type if at all possible. Use proper TypeScript types instead
- **Type assertions**: When necessary, use type assertions with proper type guards rather than `any`
- **Promise Handling**: When encountering linter errors about unhandled Promises, ALWAYS analyze the context to determine the appropriate solution:
  - **Use `void` operator**: For fire-and-forget operations where you don't need to wait for completion or handle errors (e.g., clipboard operations, analytics tracking, logging)
  - **Use `async/await`**: When you need to wait for the Promise to complete or handle the result/error
  - **Consider the UX**: For UI operations, immediate feedback is often more important than waiting for async completion

### Development Workflow

- **Big Changes**: If planned change is big, first suggest a plan of action for approval and then make changes step by step
- **Proposal Mode**: If asked to only propose changes WITHOUT implementing them, this is valid for this message ONLY. For next thing asked, feel free to implement without asking for approval

### Utils

- **String Utilities**: Use `src/utils/string-util.ts` for string manipulation functions:
  - **Template Functions**: `isTemplate()`, `stringToTemplate()`, `templateToString()` for `${variable}` template handling
  - **Escaping Curly Brackets**: `stringToEscapedTemplate()` for expressions with curly brackets - wraps value in `$= ... =` syntax (use when generating Ruuter YAML expressions that contain `{}` like functions or objects)
  - **Case Conversion**: `toSnakeCase()`, `fromSnakeCase()` for snake_case ↔ display format conversion
  - **String Processing**: `getLastDigits()`, `removeTrailingUnderscores()`, `stringToArray()`, `removeNestedTemplates()`
- **i18n Utilities**: Use `src/utils/i18n-util.ts` for translation helpers:
  - **Object Translation**: `translateObjectKeys()` for translating object keys using translation paths
- **Import Pattern**: Import specific functions: `import { functionName } from 'utils/filename'`
- **Usage Context**: String utils are used in components, services, and form elements for data processing

### Development Environment

- **Node Version**: Always do `nvm use` before running npm commands
- **Installation**: Always use `npm install` with legacy peer deps

### Tests

- **Tests are ONLY in GUI folder**: All tests are located in the `GUI/` directory
- **Run tests from GUI directory**: Always `cd GUI` before running `npm run test:run`
- **Testing Framework**: Use Vitest + @testing-library/react (NOT Jest)
- **Test Execution**: Use `npm run test:run` for running tests (NOT `npm test` which is watch mode)
- **Test File Naming**: Test files must be named `*.test.ts` (not `.spec.ts` or other variations)
- **Test File Location**: Test files are collocated with the code they test (same directory as source files)
- **Test File Names**: Test file names should match the name of the file from where tested stuff is exported (e.g., `utils.ts` → `utils.test.ts`)
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
- **Step-by-Step Tests**: When you have several functions, create tests step by step. First for one function, so it can be reviewed. Only after that, create tests for second function, review + so on
