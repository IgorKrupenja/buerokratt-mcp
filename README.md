# Bürokratt MCP Server

MCP (Model Context Protocol) server for sharing Cursor rules across Bürokratt modules.

This MCP server provides centralized access to development rules and guidelines for different Bürokratt modules.
Rules are organized by module and can be queried by AI assistants (like Cursor) to provide
context-aware coding guidance.

Currently available rules:

- `global` - Global rules that apply to all modules
- `service-module` - Service Module specific rules
- `shared-backend` - Shared backend rules (SQL, Ruuter)
- `shared-frontend` - Shared frontend rules (React, CSS)

## Usage

In this repo folder:

```bash
docker-compose up -d
```

In your project folder:

**Cursor**:

`<project-root>/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "byrokratt-mcp": {
      "url": "http://localhost:3627/mcp",
      "transport": {
        "type": "sse"
      }
    }
  }
}
```

**VS Code**:

`<project-root>/.vscode/settings.json`

```json
{
  "mcp.servers": {
    "byrokratt-mcp": {
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
    "byrokratt-mcp": {
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

- **Resources**: Access to module-specific rules via `rules://{module}` (e.g., `rules://service-module`)
- **Tools**:
  - `get_rules` - Get rules for a specific module
  - `list_modules` - List all available modules
  - `search_rules` - Search rules by keyword
- **Prompts**:
  - `development-rules` - Get development rules as a system prompt for a specific module

## Development

```sh
curl -fsSL https://bun.sh/install | bash # install Bun runtime
bun install
bun start
```

### Checks

```sh
bun lint
bun lint:markdown # Check markdown files (rules + readme)
bun format:
```

### Project Structure

```shell
byrokratt-mcp/
├── src/              # Typescript source code
├── rules/            # Rule files (markdown with frontmatter)
│   ├── global/       # Global rules that apply to all modules
│   │   ├── common.md
│   │   └── typescript.md
│   ├── service-module/    # Service Module specific rules
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
