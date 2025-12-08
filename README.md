# Bürokratt MCP Server

MCP (Model Context Protocol) server for sharing Cursor rules across Bürokratt modules.

## Overview

This MCP server provides centralized access to development rules and guidelines for different Bürokratt modules.
Rules are organized by module and can be queried by AI assistants (like Cursor) to provide
context-aware coding guidance.

## Status

🚧 **In Development** - Initial setup phase

## Project Structure

```shell
byrokratt-mcp/
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

## License

[To be determined]
