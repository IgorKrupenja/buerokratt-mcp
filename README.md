# Bürokratt MCP Server

MCP (Model Context Protocol) server for sharing Cursor rules across Bürokratt modules.

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

## Configuring with Cursor

To use this MCP server with Cursor, you need to add it to Cursor's MCP settings.

### Option 1: Using Docker (Recommended)

1. **Start the Docker container**:

   ```bash
   docker-compose up -d
   ```

   The server will be available at `http://localhost:3627/mcp`

2. **Open Cursor Settings**:
   - Go to `Cursor Settings` > `Features` > `MCP`

3. **Add MCP Server Configuration**:
   - Click `+ Add New MCP Server`
   - Configure as follows:
     - **Name**: `byrokratt-mcp` (or any name you prefer)
     - **Type**: `sse` (Server-Sent Events)
     - **URL**: `http://localhost:3627/mcp`

### Option 2: Using Bun (Local Development)

If you have Bun installed and prefer to run the server locally:

1. **Start the server**:

   ```bash
   cd /absolute/path/to/byrokratt-mcp
   bun run src/server.ts
   ```

   The server will be available at `http://localhost:3627/mcp`

2. **Open Cursor Settings**:
   - Go to `Cursor Settings` > `Features` > `MCP`

3. **Add MCP Server Configuration**:
   - Click `+ Add New MCP Server`
   - Configure as follows:
     - **Name**: `byrokratt-mcp`
     - **Type**: `sse` (Server-Sent Events)
     - **URL**: `http://localhost:3627/mcp`

### Manual Configuration (JSON)

Alternatively, you can manually edit Cursor's user settings JSON file. The settings file is located at:

- **macOS**: `~/Library/Application Support/Cursor/User/settings.json`
- **Windows**: `%APPDATA%\Cursor\User\settings.json`
- **Linux**: `~/.config/Cursor/User/settings.json`

You can also access it through Cursor:

1. Open Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
2. Type "Preferences: Open User Settings (JSON)" and select it

Add the following to your Cursor settings:

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

**Note**: Make sure the server is running before configuring Cursor. For Docker, use `docker-compose up -d`. For local
development, run `bun run src/server.ts`.

### Using the MCP Server in Cursor

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

## License

[To be determined]
