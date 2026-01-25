---
appliesTo:
  techs:
    - react
description: React-specific code quality rules and best practices
---

## Component Architecture

- **Extract Functions**: When dealing with React components, extract functions from component itself OUTSIDE for testability
- **Separate Testable Logic**: Place extracted functions in separate files and export them for easy testing
- **Small Functions**: Make functions small to make them easily testable
