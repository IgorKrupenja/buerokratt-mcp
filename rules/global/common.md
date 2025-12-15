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

- **Full Lint**: Run lint with `npm lint` for the entire project
- **Single File/Directory**: When linting specific files or directories, always use `--max-warnings 0`
- **Always Check**: ALWAYS check for lint and format issues when done with code (INCLUDING tests) changes

## Development Workflow

- **Big Changes**: If planned change is big, first suggest a plan of action for approval and then make changes step by step
- **Proposal Mode**: If asked to only propose changes WITHOUT implementing them, this is valid for this message ONLY.
  For next thing asked, feel free to implement without asking for approval

### Development Environment

- **Node Version**: Always do `nvm use` before running npm commands
- **Installation**: Always use `npm install` with legacy peer deps

## Fork Synchronization

- **Sync Command**: When the user says "sync" or asks to sync with upstream, automatically run the `sync-upstream.sh` script from `buerokratt-mcp/scripts/sync-upstream.sh`
- **Script Location**: The `sync-upstream.sh` script is located at `buerokratt-mcp/scripts/sync-upstream.sh` (single source of truth, not duplicated in module repos)
- **Execution**: When syncing, determine the current module directory from the workspace path and run: `buerokratt-mcp/scripts/sync-upstream.sh <module-directory>` (e.g., `buerokratt-mcp/scripts/sync-upstream.sh Training-Module`)
- **Permissions**: **ALWAYS** run the sync script with `required_permissions: ['all']` to avoid permission errors with git operations (fetching, merging, pushing, and updating remote URLs)
- **Usage Examples**:
  - Sync and push: `buerokratt-mcp/scripts/sync-upstream.sh Training-Module` (with `required_permissions: ['all']`)
  - Sync without pushing: `buerokratt-mcp/scripts/sync-upstream.sh Training-Module no-push` (with `required_permissions: ['all']`)
  - If run from within a module directory, can use relative path: `../buerokratt-mcp/scripts/sync-upstream.sh` (script will use current directory)
