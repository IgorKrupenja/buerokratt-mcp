/**
 * Bürokratt MCP Server
 *
 * MCP (Model Context Protocol) server for sharing Cursor rules
 * across Bürokratt modules.
 */

import { randomUUID } from 'node:crypto';

import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express, { type Request, type Response } from 'express';

import { setupPrompts } from './mcp/prompts.ts';
import { setupResources } from './mcp/resources.ts';
import { setupTools } from './mcp/tools.ts';

/**
 * Create and configure the MCP server instance
 */
function createServer(): McpServer {
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

  server.server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  setupResources(server);
  setupTools(server);
  setupPrompts(server);

  return server;
}

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3627;

const app = express();
app.use(express.json());

// MCP POST endpoint (JSON-RPC messages)
const mcpPostHandler = async (req: Request, res: Response): Promise<void> => {
  const sessionId = (req.headers['mcp-session-id'] as string) || undefined;
  if (sessionId) {
    console.log(`Received MCP request for session: ${sessionId}`);
  }

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      const eventStore = new InMemoryEventStore();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore, // Enable resumability
        onsessioninitialized: (sid) => {
          console.log(`Session initialized with ID: ${sid}`);
          transports[sid] = transport;
        },
      });

      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`Transport closed for session ${sid}, removing from transports map`);
          delete transports[sid];
        }
      };

      // Connect the transport to the MCP server
      const mcpServer = createServer();
      await mcpServer.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request with existing transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
};

app.post('/mcp', mcpPostHandler);

// Handle GET requests (SSE streams)
const mcpGetHandler = async (req: Request, res: Response): Promise<void> => {
  const sessionId = (req.headers['mcp-session-id'] as string) || undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const lastEventId = (req.headers['last-event-id'] as string) || undefined;
  if (lastEventId) {
    console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
  } else {
    console.log(`Establishing new SSE stream for session ${sessionId}`);
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', mcpGetHandler);

// Handle DELETE requests (session termination)
const mcpDeleteHandler = async (req: Request, res: Response): Promise<void> => {
  const sessionId = (req.headers['mcp-session-id'] as string) || undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  console.log(`Received session termination request for session ${sessionId}`);

  try {
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
};

app.delete('/mcp', mcpDeleteHandler);

// Start server - bind to 0.0.0.0 to accept connections from outside the container
app.listen(MCP_PORT, '0.0.0.0', () => {
  console.log(`MCP Streamable HTTP Server listening on port ${MCP_PORT}`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');

  // Close all active transports to properly clean up resources
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
