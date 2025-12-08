---
modules:
  - global
tags:
  - code-quality
  - best-practices
  - workflow
  - development
description: Global code quality rules and development best practices
---

# Code Quality

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

## Linting

- **Full Lint**: Run lint with `npm lint` for the entire project
- **Single File/Directory**: When linting specific files or directories, always use `--max-warnings 0`
- **Always Check**: ALWAYS check for lint and format issues when done with code (INCLUDING tests) changes

# Development Workflow

- **Big Changes**: If planned change is big, first suggest a plan of action for approval and then make changes step by step
- **Proposal Mode**: If asked to only propose changes WITHOUT implementing them, this is valid for this message ONLY.
  For next thing asked, feel free to implement without asking for approval

## Development Environment

- **Node Version**: Always do `nvm use` before running npm commands
- **Installation**: Always use `npm install` with legacy peer deps
