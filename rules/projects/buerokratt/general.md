---
appliesTo:
  projects:
    - buerokratt/Service-Module
    - buerokratt/Training-Module
    - buerokratt/Analytics-Module
    - buerokratt/Buerokratt-Chatbot
description: Common rules for all Bürokratt projects
---

## Project Overview

This repository contains a module with two main parts:

- **GUI folder**: React-based front-end application (contains all frontend code and tests)
- **DSL folder**: Back-end using a custom stack based on YAML files (configuration-based, no unit tests)

### Development Environment

- **Installation**: Always use `npm install` with `--legacy-peer-deps`

## Fork Synchronization

<!-- todo better way to locate script -->

- **Sync Command**: When the user says "sync" or asks to sync with upstream, automatically run the `sync-upstream.sh` script from `buerokratt-mcp/rules/projects/buerokratt/sync-upstream.sh`
- **Script Location**: The `sync-upstream.sh` script is located at `buerokratt-mcp/rules/projects/buerokratt/sync-upstream.sh` (single source of truth, not duplicated in module repos)
- **Execution**: When syncing, determine the current module directory from the workspace path and run: `buerokratt-mcp/rules/projects/buerokratt/sync-upstream.sh <module-directory>` (e.g., `buerokratt-mcp/rules/projects/buerokratt/sync-upstream.sh Training-Module`)
- **Permissions**: **ALWAYS** run the sync script with `required_permissions: ['all']` to avoid permission errors with git operations (fetching, merging, pushing, and updating remote URLs)
- **Usage Examples**:
  - Sync and push: `buerokratt-mcp/rules/projects/buerokratt/sync-upstream.sh Training-Module` (with `required_permissions: ['all']`)
  - Sync without pushing: `buerokratt-mcp/rules/projects/buerokratt/sync-upstream.sh Training-Module no-push` (with `required_permissions: ['all']`)
  - If run from within a module directory, can use relative path: `../buerokratt-mcp/rules/projects/buerokratt/sync-upstream.sh` (script will use current directory)
