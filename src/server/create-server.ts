/**
 * MCP Server Creation
 *
 * Creates and configures the MCP server instance
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { setupPrompts } from '../mcp/prompts.ts';
import { setupResources } from '../mcp/resources.ts';
import { setupTools } from '../mcp/tools.ts';

/**
 * Create and configure the MCP server instance
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: 'buerokratt-mcp',
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

  server.server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  setupResources(server);
  setupTools(server);
  setupPrompts(server);

  return server;
}
