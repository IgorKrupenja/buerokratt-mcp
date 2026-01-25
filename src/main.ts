/**
 * Bürokratt MCP Server
 *
 * MCP (Model Context Protocol) server for sharing AI coding assistant rules
 * across Bürokratt modules.
 */

import express from 'express';

import { mcpDeleteHandler, mcpGetHandler, mcpPostHandler } from './server/handlers.ts';

const app = express();
app.use(express.json());

app.post('/mcp', mcpPostHandler);
app.get('/mcp', mcpGetHandler);
app.delete('/mcp', mcpDeleteHandler);

const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3627;

// Start server - bind to 0.0.0.0 to accept connections from outside the container
app.listen(MCP_PORT, '0.0.0.0', () => {
  console.log(`MCP Streamable HTTP Server listening on port ${MCP_PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');

  // Close all active transports to properly clean up resources
  const { transports } = await import('./server/handlers.ts');
  for (const sessionId in transports) {
    try {
      const transport = transports[sessionId];
      if (transport) {
        console.log(`Closing transport for session ${sessionId}`);
        await transport.close();
        delete transports[sessionId];
      }
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }

  console.log('Server shutdown complete');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('[Fatal Error]', error);
  process.exit(1);
});
