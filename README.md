# MCP Rules Server

MCP (Model Context Protocol) server with modular architecture for sharing AI coding assistant rules across projects, tech stacks, and languages.  
The `rules/` folder includes example rules for multiple Bürokratt projects. Bürokratt is an open-source public sector virtual assistant platform.

## Setup

### In this repo folder

```bash
docker compose up -d
```

### In your project(s) folder

Note that this can be a folder with multiple projects/repositories.

#### Cursor

```bash
curl -sSL https://raw.githubusercontent.com/IgorKrupenja/modular-mcp/main/setup.sh | bash -s -- cursor
```

#### VS Code

```bash
curl -sSL https://raw.githubusercontent.com/IgorKrupenja/modular-mcp/main/setup.sh | bash -s -- vscode
```

#### JetBrains

1. Run:

   ```bash
   curl -sSL https://raw.githubusercontent.com/IgorKrupenja/modular-mcp/main/setup.sh | bash -s -- jetbrains
   ```

2. In **Settings | Tools | AI Assistant | Project Rules**, set `modular-mcp` to **Always** mode.

#### Claude Code

```bash
curl -sSL https://raw.githubusercontent.com/IgorKrupenja/modular-mcp/main/setup.sh | bash -s -- claude
```

## Prompting

If you followed the setup instructions above, your AI assistant will automatically use the `get_mcp_instructions` tool to learn how to interact with this MCP server. This means you can use natural language prompts like:

- "Get NestJS rules from MCP"
- "Load React rules"
- "What projects are available?"
- "Show available tech stacks"
- "Find rules about testing"
- "Load Service-Module rules"

## MCP Server Features

Once configured, the MCP server provides:

- **Resources**:
  - Rules: `rules://{scope}/{id}` (e.g., `rules://project/buerokratt/Service-Module`)
  - Assets: `assets://{path}` (e.g., `assets://projects/buerokratt/sync-upstream.sh`). This way you can include larger code examples, helper scripts, etc. One example is the `sync-upstream.sh` script for the Bürokratt projects.
    <!-- todo add link to buerokratt script example -->
    <!-- todo maybe move to docs and move section above -->
- **Tools**:
  - `get_mcp_instructions` - Get detailed instructions on how to use this MCP server
  - `list_scope_ids` - List available ids for a scope
  - `search_rules` - Search rules by keyword
- **Testing with MCP Inspector**: `pnpm inspect`.

## Development

### Editing rules

Rules are loaded fresh on every request, **so no server restart is needed**.

#### Global rules

Global rules live in `rules/general.md` and are always included. To always include a group, set `defaults.globalGroup` in `rules/manifest.yml`. Use `USE_GLOBAL_RULES=false` to disable loading the global group; when unset or `true`, the manifest value is used.

#### Manifest structure

`rules/manifest.yml` defines available ids and relationships between projects, groups, techs, and languages. The `defaults.globalGroup` entry is applied on every request unless `USE_GLOBAL_RULES` is set to `false`.

Rules are Markdown files with frontmatter. Use `appliesTo` to declare scope(s) and `rules/manifest.yml` to define projects, groups, techs, and languages. Update the manifest only when you introduce new ids. Example:

```md
---
appliesTo:
  projects:
    - buerokratt/Service-Module
  groups:
    - buerokratt
  techs:
    - react
  languages:
    - typescript
description: Description of the rule
---

## Some rule set

... rule set content ...
```

**⚠️ Important note on context size**. To ensure the MCP server works correctly, merged projects/techs should not exceed:

- Safe < 50 KB
- Warning < 100 KB

This can be with an npm script, see [checks](#checks) below.

### Rules Folder Structure

```shell
rules/
├── manifest.yml
├── general.md
├── projects/
│   ├── buerokratt/
│   │   ├── general.md
│   │   ├── css.md
│   │   ├── react.md
│   │   ├── ruuter.md
│   │   ├── sql.md
│   │   ├── sql-restrictions.md
│   │   ├── sync-upstream.sh
│   │   └── Service-Module/
│   │   │   └── rules.md
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── techs/
    ├── css/
    │   └── tailwind/
    │   │   └── rules.md
    │   └── ...
    ├── java/
    │   ├── rules.md
    │   └── spring/
    │   │   └── rules.md
    │   └── ...
    ├── typescript/
    │   ├── nestjs/
    │   │   └── rules.md
    │   ├── react/
    │   │   └── rules.md
    │   ├── rules.md
    │   └── ...
    └── ...
```

### Running the project for local development

```sh
# Install the correct Node version
nvm install
# Install the correct pnpm version
corepack enable pnpm
corepack use
pnpm install
pnpm start
```

After you are done with the code changes, rebuild the image and restart the container:

```sh
docker compose up -d --build --force-recreate
```

### Checks

#### CI

The following checks run automatically in CI on push and pull requests:

- **format**: Checks code formatting with Prettier
- **lint**: Runs ESLint to check code quality and style
- **lint-markdown**: Lints markdown files (rules and README) using markdownlint
- **typecheck**: Validates TypeScript types without emitting files
- **validate**: Validates rule files (frontmatter + manifest structure + markdown syntax)
- **check-context-size**: Checks merged projects/techs against safe token limits
- **test**: Runs tests

#### Local

These can also be run manually with npm scripts:

```sh
pnpm format
pnpm lint
pnpm lint:markdown
pnpm typecheck
pnpm validate
pnpm check-context-size
pnpm check-context-size <project-id> <tech-id>
pnpm test
```
