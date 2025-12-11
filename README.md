# Bürokratt MCP Server

MCP (Model Context Protocol) server for sharing Cursor rules across Bürokratt modules.

This MCP server provides centralized access to development rules and guidelines for different Bürokratt modules.
Rules are organized by module and can be queried by AI assistants (like Cursor) to provide
context-aware coding guidance.

## Usage

In this repo folder:

```bash
docker-compose up -d
```

In your project:

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

## Development

### Project Structure

```shell
byrokratt-mcp/
├── src/              # Source code
├── rules/            # Rule files (markdown with frontmatter)
│   ├── global/       # Global rules that apply to all modules
│   │   ├── common.md
│   │   └── typescript.md
│   ├── service-module/    # Service Module specific rules
│   │   └── rules.md
│   ├── training-module/    # Training Module specific rules (and so on for other modules)
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

### Prerequisites

- Bun runtime (for local development)
- Docker (for running via Docker)

### Local Development

```bash
bun install
bun run src/server.ts
```

### Docker

Run the MCP server using Docker Compose:

```bash
docker-compose up
```

The `rules/` directory is volume-mounted, so changes to rule files will be reflected immediately after pulling updates
from git. No container restart needed for rule changes.

To rebuild the container after code changes:

```bash
docker-compose up --build
```

### Using the MCP Server

Once configured, the MCP server provides:

- **Resources**: Access to module-specific rules via `rules://{module}` (e.g., `rules://service-module`)
- **Tools**:
  - `get_rules` - Get rules for a specific module
  - `list_modules` - List all available modules
  - `search_rules` - Search rules by keyword
- **Prompts**:
  - `development-rules` - Get development rules as a system prompt for a specific module

The AI assistant in Cursor will automatically use these resources and tools when relevant to provide context-aware coding
guidance based on your module's rules.

### Available Modules

- `service-module` - Service Module specific rules
- `training-module` - Training Module specific rules
- `analytics-module` - Analytics Module specific rules
- `buerokratt-chatbot` - Bürokratt Chatbot specific rules
- `global` - Global rules that apply to all modules
