# Bürokratt MCP Server

MCP (Model Context Protocol) server for sharing AI coding assistant rules for [Bürokratt modules](https://github.com/buerokratt).

Rationale: The Buerokratt tech stack, especially the DSL-based backend, is quite unique and is difficult to use with AI coding assistants. This MCP server provides a way to share rules and guidelines for different [Bürokratt modules](https://github.com/buerokratt) in a way that is easy to use with different IDEs and AI coding assistants. It is based on an initial `.cursorrules` setup that is also [provided](examples/legacy/.cursorrules) in this repo for legacy purposes.

Currently available rules:

- `global` - Global rules that apply to all modules
- `Service-Module` - Service Module specific rules
- `shared-backend` - Shared backend rules (SQL, Ruuter)
- `shared-frontend` - Shared frontend rules (React, CSS)

Planned:

- [ ] **⚠️ Knwon issue in Cursor**: Sometimes Cursor reports "Failed to open SSE stream: Conflict" errors. This does not actually affect the usage of the MCP server.
- [ ] Add support for more modules.
- [ ] Add OAuth2 support for authentication.
- [ ] Consider using several MCP servers for different modules **if** context size is an issue. There is a CI check for this, see [checks](#checks) below.
- [ ] Cache rules in memory if needed. Check with `measure-load-time` script. But this should be very fast with Bun.

## Usage

In this repo folder:

```bash
docker-compose up -d
```

In your project folder:

Note that `<project-root>` can also be a folder with several Bürokratt modules.

**Cursor**:

`<project-root>/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "buerokratt-mcp": {
      "url": "http://localhost:3627/mcp"
    }
  }
}
```

You might also want to add a simple rule to automatically load the rules for the module of the file you are editing. See `.cursor/rules/buerokratt-mcp.mdc` for an example. Place it in `<project-root>/.cursor/rules/buerokratt-mcp.mdc`.

**VS Code**:

`<project-root>/.vscode/settings.json`

```json
{
  "mcp.servers": {
    "buerokratt-mcp": {
      "url": "http://localhost:3627/mcp",
      "transport": {
        "type": "sse"
      }
    }
  }
}
```

**JetBrains**:

`<project-root>/.idea/mcp.json`

```json
{
  "mcpServers": {
    "buerokratt-mcp": {
      "url": "http://localhost:3627/mcp",
      "transport": {
        "type": "sse"
      }
    }
  }
}
```

### MCP Server Features

Once configured, the MCP server provides:

- **Resources**: Access to module-specific rules via `rules://{module}` (e.g., `rules://Service-Module`)
- **Tools**:
  - `get_rules` - Get rules for a specific module
  - `list_modules` - List all available modules
  - `search_rules` - Search rules by keyword
- **Prompts**:
  - `development-rules` - Get development rules as a system prompt for a specific module

## Development

### Editing rules

Simply edit the rules in the `rules/` folder and commit. Rules are loaded fresh on every request, **so no server restart is needed to get the changes**.

These rules are in Markdown format with frontmatter. `modules` field in frontmatter is required and should be an array of module names. Module names should match Bürokratt repository folder names exactly (e.g., `Service-Module`, `Training-Module`, `Analytics-Module`, `Buerokratt-Chatbot`). Other fields are optional. An example:

```md
---
modules:
  - Service-Module
  - Training-Module
  - Analytics-Module
  - Buerokratt-Chatbot
tags:
  - backend
  - sql
  - database
description: Description of the rule
---

## Some rule set

... rule set content ...
```

**⚠️ Important note on context size**. To ensure the MCP server works correctly, the rule set should not exceed the following limits:

- Individual files: Safe < 10 KB, Warning < 20 KB
- Merged modules: Safe < 50 KB, Warning < 100 KB

This can be with an npm script, see [checks](#checks) below.

### Project Structure

```shell
buerokratt-mcp/
├── src/              # Typescript source code
├── rules/            # Rule files (markdown with frontmatter)
│   ├── global/       # Global rules that apply to all modules
│   │   ├── common.md
│   │   └── typescript.md
│   ├── Service-Module/    # Service Module specific rules
│   │   └── rules.md
│   ├── ...other-modules...    # Other modules specific rules
│   │   └── rules.md
│   ├── shared-backend/    # Shared backend rules (SQL, Ruuter)
│   │   ├── sql-rules.md
│   │   ├── sql-restrictions.md
│   │   └── ruuter-rules.md
│   └── shared-frontend/   # Shared frontend rules (React, CSS)
│       ├── react-rules.md
│       └── css-rules.md
└── ...
```

### Running the MCP server

```sh
curl -fsSL https://bun.sh/install | bash # install Bun runtime
bun install
bun start
```

#### Testing with MCP Inspector

```sh
bun inspect
```

### Checks

#### CI

The following checks run automatically in CI on push and pull requests:

- **format**: Checks code formatting with Prettier
- **lint**: Runs ESLint to check code quality and style
- **lint-markdown**: Lints markdown files (rules and README) using markdownlint
- **typecheck**: Validates TypeScript types without emitting files
- **validate**: Validates rule files (frontmatter structure, markdown syntax, and module names against GitHub repositories)
- **check-context-size**: Checks that rule files don't exceed safe token limits
- **test**: Runs tests

#### Local

These can also be run manually with npm scripts:

```sh
bun format
bun lint
bun lint:markdown
bun typecheck
bun validate
bun check-context-size
bun check-context-size <module-name>
bun test
```
