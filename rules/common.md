---
appliesTo:
  groups:
    - global
description: Global code quality rules and development best practices
---

## Code Quality

- **No Double Negation**: Never use double negation in variables, functions, types, etc naming. Fix double negation if
  you come across it
- **ALWAYS Check Usages**: Before removing or modifying any prop, parameter, function, component signature, type
  definition, or interface property, you MUST search the entire codebase for all usages and update them accordingly.
  This includes:
  - Function calls and references
  - Type imports and usage
  - Interface/type property access
  - Component prop usage
  - Variable assignments and destructuring
  - Never remove something without checking where it's used first
- **Unused Code**: Actively check for unused variables, functions etc and either use them (could be a bug) or remove
  them if no longer necessary
- **Avoid Trivial Comments**: Do not add trivial comments in code, if they are obvious and code is simple and
  self-explanatory

### Linting

- **Always Check**: ALWAYS check for lint and format issues when done with code (INCLUDING tests) changes

## Development Workflow

- **Proposal Mode**: If asked to only propose changes WITHOUT implementing them, this is valid for this message ONLY.
  For next thing asked, feel free to implement without asking for approval

### Git Commit Messages

- **One-liner Only**: Commit messages MUST be a single line with no body
- **Character Limit**: Keep commit messages under 72 characters
- **Format**: Use imperative mood (e.g., "Fix bug" not "Fixed bug" or "Fixes bug")
