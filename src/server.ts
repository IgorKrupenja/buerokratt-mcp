#!/usr/bin/env bun

/**
 * Bürokratt MCP Server
 *
 * MCP (Model Context Protocol) server for sharing Cursor rules
 * across Bürokratt modules.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Import handlers (will be implemented in next steps)
import { setupPrompts } from './mcp/prompts.ts';
import { setupResources } from './mcp/resources.ts';
import { setupTools } from './mcp/tools.ts';

// Create MCP server instance using the high-level API
const server = new McpServer(
  {
    name: 'byrokratt-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  },
);

// Set up error handler on underlying server
server.server.onerror = (error) => {
  console.error('[MCP Error]', error);
};

// Register resources, tools, and prompts
setupResources(server);
setupTools(server);
setupPrompts(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('[Fatal Error]', error);
  process.exit(1);
});

// Create stdio transport and connect
const transport = new StdioServerTransport();
await server.connect(transport);
