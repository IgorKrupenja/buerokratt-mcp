/**
 * MCP Resource Handlers
 *
 * Handles resource-related requests (listing and reading rules)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Set up resource handlers for the MCP server
 */
export function setupResources(server: McpServer): void {
  // TODO: Register resources for each module
  // Example:
  // server.registerResource(
  //   "service-module-rules",
  //   "rules://service-module",
  //   {
  //     description: "Rules for the Service Module",
  //     mimeType: "text/markdown",
  //   },
  //   async (uri) => {
  //     // Load and return rules for service-module
  //     return {
  //       contents: [
  //         {
  //           uri: uri.toString(),
  //           mimeType: "text/markdown",
  //           text: "# Service Module Rules\n\n...",
  //         },
  //       ],
  //     };
  //   }
  // );
}
