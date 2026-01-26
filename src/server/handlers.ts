/**
 * MCP Route Handlers
 *
 * Handlers for MCP endpoints (POST, GET, DELETE /mcp)
 */

import { randomUUID } from 'node:crypto';

import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';

import { createServer } from './create-server.ts';

// Map to store transports by session ID (exported for testing)
export const transports: Record<string, StreamableHTTPServerTransport> = {};
export const sseTransports: Record<string, SSEServerTransport> = {};

const getAcceptHeader = (req: Request): string | undefined => {
  const acceptHeader = req.headers.accept;
  if (Array.isArray(acceptHeader)) {
    return acceptHeader.join(', ');
  }
  return acceptHeader;
};

const preferJsonResponse = (acceptHeader?: string): boolean =>
  !acceptHeader || !acceptHeader.includes('text/event-stream');

const ensureStreamableAcceptHeader = (req: Request): void => {
  const acceptHeader = getAcceptHeader(req);
  if (!acceptHeader || !acceptHeader.includes('application/json') || !acceptHeader.includes('text/event-stream')) {
    req.headers.accept = 'application/json, text/event-stream';
  }
};

/**
 * GET /mcp/sse - Establish legacy SSE stream
 */
export const mcpSseGetHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const transport = new SSEServerTransport('/mcp/messages', res);
    sseTransports[transport.sessionId] = transport;

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sseTransports[sid]) {
        delete sseTransports[sid];
      }
    };

    const mcpServer = createServer();
    await mcpServer.connect(transport);
  } catch (error) {
    console.error('Error establishing SSE transport:', error);
    if (!res.headersSent) {
      res.status(500).send('Error establishing SSE transport');
    }
  }
};

/**
 * POST /mcp/messages - Handle legacy SSE client messages
 */
export const mcpSsePostHandler = async (req: Request, res: Response): Promise<void> => {
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  if (!sessionId || !sseTransports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  try {
    const transport = sseTransports[sessionId];
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('Error handling SSE message:', error);
    if (!res.headersSent) {
      res.status(500).send('Error handling SSE message');
    }
  }
};

/**
 * POST /mcp - Handle JSON-RPC messages
 */
export const mcpPostHandler = async (req: Request, res: Response): Promise<void> => {
  const sessionId = (req.headers['mcp-session-id'] as string) || undefined;
  if (sessionId) {
    console.log(`Received MCP request for session: ${sessionId}`);
  }

  try {
    const originalAcceptHeader = getAcceptHeader(req);
    const useJsonResponse = preferJsonResponse(originalAcceptHeader);
    ensureStreamableAcceptHeader(req);
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
        enableJsonResponse: useJsonResponse,
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

/**
 * GET /mcp - Handle SSE streams
 */
export const mcpGetHandler = async (req: Request, res: Response): Promise<void> => {
  const sessionId = (req.headers['mcp-session-id'] as string) || undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  ensureStreamableAcceptHeader(req);
  const lastEventId = (req.headers['last-event-id'] as string) || undefined;
  if (lastEventId) {
    console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
  } else {
    console.log(`Establishing new SSE stream for session ${sessionId}`);
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

/**
 * DELETE /mcp - Handle session termination
 */
export const mcpDeleteHandler = async (req: Request, res: Response): Promise<void> => {
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
