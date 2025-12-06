# Burokratt MCP Server

MCP (Model Context Protocol) server for sharing Cursor rules across Burokratt modules.

## Overview

This MCP server provides centralized access to development rules and guidelines for different Burokratt modules. Rules are organized by module and can be queried by AI assistants (like Cursor) to provide context-aware coding guidance.

## Status

🚧 **In Development** - Initial setup phase

## Project Structure

```
burokratt-mcp/
├── src/              # Source code
├── rules/            # Rule files (markdown with frontmatter)
└── ...
```

## Development

### Prerequisites

- Bun runtime (for local development)
- Docker (for running via Docker)

### Local Development

```bash
bun install
bun run src/server.ts
```

### Docker

```bash
docker-compose up
```

## License

[To be determined]
