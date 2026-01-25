---
appliesTo:
  projects:
    - buerokratt/Service-Module
    - buerokratt/Buerokratt-Chatbot
description: React frontend rules
---

<!-- todo some move to generic -->

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

## Component Architecture

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

## Type Management

- **Component Props**: Always use `interface` for component props, never `type` (e.g., `interface ComponentProps { ... }`)
- **Repeated Types**: If you see repeated types in code, create a new type for them
- **Local Types**: If used only in one file, create in that file (prefer local over global)
- **Global Types**: Otherwise create in `src/types/`
- **One Type Per File**: Types in `src/types/` should be one type per file
- **Split Legacy Types**: When dealing with old types in `src/types/`, if there are several types in one file, split
  them into separate files

## Internationalization (i18n)

- **No Hardcoded Strings**: NEVER hardcode user-facing strings in components. ALL user-visible text MUST use
  translation files
- **Languages**: Only English and Estonian are supported
- **Create Translations**: Always create translations yourself if not present for BOTH languages
- **Translation Files**: Located in `src/i18n/en/common.json` and `src/i18n/et/common.json`
- **Key Structure**: Use dot notation for nested keys (e.g., `global.add`, `chat.service-input`, `settings.title`)
- **Usage Pattern**: Use `useTranslation()` hook in components: `const { t } = useTranslation();`
- **Translation Calls**: Use `t('key.path')` for translation calls
- **Key Organization**: Organize keys by feature/component (e.g., `global.*`, `chat.*`, `settings.*`, `menu.*`)
- **Both Languages Required**: When adding new translation keys, add them to BOTH `en/common.json` AND `et/common.json`
- **Key Naming**: Use kebab-case for multi-word keys (e.g., `service-input`, `max-user-input-try-count`)
- **Key Content Alignment**: Rename translation keys to match their string content when refactoring. Keep key names
  simple and aligned with the actual translation values

### Using Translations Outside React Components

- **Outside React Hooks**: When using translations outside of React components or hooks, use direct `t` import from
  i18next
- **Import Pattern**: `import { t } from 'i18next';` (NOT `useTranslation` hook)
- **Usage Context**: Use in utility functions, constants, services, handlers, and other non-React code
- **Example - Using `t` in a utility function**:

```typescript
import { t } from 'i18next';

export const getErrorMessage = (errorCode: string): string => {
  return t(`errors.${errorCode}`, { defaultValue: t('errors.unknown') });
};
```

- **Hook vs Direct Import**:
  - **React Components**: Use `useTranslation()` hook inside React components
  - **Non-React Code**: Use direct `import { t } from 'i18next'` for utility functions, services, constants, etc.
- **Never Mix**: Never use `useTranslation()` hook outside of React components - it will cause linter errors
