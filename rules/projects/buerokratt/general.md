---
appliesTo:
  groups:
    - buerokratt
description: Common rules for all Bürokratt projects
---

### Development Environment

- **Installation**: Always use `npm install` with `--legacy-peer-deps`

## Fork Synchronization

- **Sync Command**: When the user says "sync" or asks to sync with upstream, fetch the script from the MCP resource `assets://projects/buerokratt/sync-upstream.sh`, write it to a temp file, and execute it.
- **Execution**: Save the script to a temp path and run: `/tmp/sync-upstream.sh <module-directory>` (e.g., `/tmp/sync-upstream.sh Training-Module`)
- **Permissions**: **ALWAYS** run the sync script with `required_permissions: ['all']` to avoid permission errors with git operations (fetching, merging, pushing, and updating remote URLs)
- **Usage Examples**:
  - Sync and push: `/tmp/sync-upstream.sh Training-Module` (with `required_permissions: ['all']`)
  - Sync without pushing: `/tmp/sync-upstream.sh Training-Module no-push` (with `required_permissions: ['all']`)
  - Download step: read `assets://projects/buerokratt/sync-upstream.sh` and write it to `/tmp/sync-upstream.sh`, then `chmod +x /tmp/sync-upstream.sh`
