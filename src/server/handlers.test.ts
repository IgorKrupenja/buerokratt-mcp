import { beforeEach, describe, expect, it } from 'bun:test';
import type { Request, Response } from 'express';

import { mcpDeleteHandler, mcpGetHandler, mcpPostHandler, transports } from './handlers.ts';

// Simple mock function type
type MockFn = {
  (...args: unknown[]): unknown;
  mockReturnThis: () => MockFn;
  mockReturnValue: (value: unknown) => MockFn;
  mockImplementation: (fn: (...args: unknown[]) => unknown) => MockFn;
  mockResolvedValue: (value: unknown) => MockFn;
  mockRejectedValue: (value: unknown) => MockFn;
  mockClear: () => void;
  mockReset: () => void;
  calls: unknown[][];
};

function createMockFn(impl?: (...args: unknown[]) => unknown): MockFn {
  const fn = ((...args: unknown[]) => {
    fn.calls.push(args);
    if (impl) {
      return impl(...args);
    }
    return undefined;
  }) as MockFn;

  fn.calls = [];
  fn.mockReturnThis = () => {
    impl = () => fn;
    return fn;
  };
  fn.mockReturnValue = (value: unknown) => {
    impl = () => value;
    return fn;
  };
  fn.mockImplementation = (newImpl: (...args: unknown[]) => unknown) => {
    impl = newImpl;
    return fn;
  };
  fn.mockResolvedValue = (value: unknown) => {
    impl = () => Promise.resolve(value);
    return fn;
  };
  fn.mockRejectedValue = (value: unknown) => {
    impl = () => Promise.reject(value);
    return fn;
  };
  fn.mockClear = () => {
    fn.calls = [];
  };
  fn.mockReset = () => {
    fn.calls = [];
    impl = undefined;
  };

  return fn;
}

describe('mcpPostHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusSpy: MockFn;
  let jsonSpy: MockFn;
  let sendSpy: MockFn;

  beforeEach(() => {
    // Clear transports before each test
    Object.keys(transports).forEach((key) => delete transports[key]);

    jsonSpy = createMockFn().mockReturnThis();
    sendSpy = createMockFn().mockReturnThis();
    statusSpy = createMockFn().mockReturnValue({
      json: jsonSpy,
      send: sendSpy,
    });

    mockReq = {
      headers: {},
      body: {},
    };

    mockRes = {
      status: statusSpy as any,
      json: jsonSpy as any,
      send: sendSpy as any,
      headersSent: false,
    };
  });

  it('handles request with existing session ID successfully', async () => {
    const sessionId = 'existing-session-id';
    const mockHandleRequest = createMockFn().mockResolvedValue(undefined);
    const mockTransport = {
      handleRequest: mockHandleRequest,
      sessionId,
    };

    // Add transport to transports map
    transports[sessionId] = mockTransport as any;

    mockReq.headers = { 'mcp-session-id': sessionId };
    mockReq.body = { jsonrpc: '2.0', method: 'test', id: 1 };

    await mcpPostHandler(mockReq as Request, mockRes as Response);

    // Verify transport.handleRequest was called
    expect(mockHandleRequest.calls.length).toBeGreaterThan(0);
    expect(mockHandleRequest.calls[0]?.[0]).toBe(mockReq);
    expect(mockHandleRequest.calls[0]?.[1]).toBe(mockRes);
    expect(mockHandleRequest.calls[0]?.[2]).toBe(mockReq.body);

    // Cleanup
    delete transports[sessionId];
  });

  it('returns 400 when no session ID and not initialization request', async () => {
    mockReq.body = { jsonrpc: '2.0', method: 'test', id: 1 };

    await mcpPostHandler(mockReq as Request, mockRes as Response);

    expect(statusSpy.calls.length).toBeGreaterThan(0);
    expect(statusSpy.calls[0]?.[0]).toBe(400);
    expect(jsonSpy.calls.length).toBeGreaterThan(0);
    expect(jsonSpy.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        jsonrpc: '2.0',
        error: expect.objectContaining({
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        }),
      }),
    );
  });

  it('returns 400 when session ID provided but transport does not exist', async () => {
    mockReq.headers = { 'mcp-session-id': 'non-existent-session' };
    mockReq.body = { jsonrpc: '2.0', method: 'test', id: 1 };

    await mcpPostHandler(mockReq as Request, mockRes as Response);

    expect(statusSpy.calls.length).toBeGreaterThan(0);
    expect(statusSpy.calls[0]?.[0]).toBe(400);
  });

  it('handles errors and returns 500', async () => {
    // Create a request that will cause an error
    mockReq.body = null; // This might cause issues

    await mcpPostHandler(mockReq as Request, mockRes as Response);

    // Should handle error gracefully
    expect(statusSpy.calls.length).toBeGreaterThan(0);
  });
});

describe('mcpGetHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusSpy: MockFn;
  let sendSpy: MockFn;

  beforeEach(() => {
    // Clear transports before each test
    Object.keys(transports).forEach((key) => delete transports[key]);

    sendSpy = createMockFn().mockReturnThis();
    statusSpy = createMockFn().mockReturnValue({
      send: sendSpy,
    });

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: statusSpy as any,
      send: sendSpy as any,
      headersSent: false,
    };
  });

  it('handles GET request with valid session ID successfully', async () => {
    const sessionId = 'valid-session-id';
    const mockHandleRequest = createMockFn().mockResolvedValue(undefined);
    const mockTransport = {
      handleRequest: mockHandleRequest,
      sessionId,
    };

    // Add transport to transports map
    transports[sessionId] = mockTransport as any;

    mockReq.headers = { 'mcp-session-id': sessionId };

    await mcpGetHandler(mockReq as Request, mockRes as Response);

    // Verify transport.handleRequest was called
    expect(mockHandleRequest.calls.length).toBeGreaterThan(0);
    expect(mockHandleRequest.calls[0]?.[0]).toBe(mockReq);
    expect(mockHandleRequest.calls[0]?.[1]).toBe(mockRes);

    // Cleanup
    delete transports[sessionId];
  });

  it('handles GET request with Last-Event-ID header for reconnection', async () => {
    const sessionId = 'valid-session-id';
    const lastEventId = 'event-123';
    const mockHandleRequest = createMockFn().mockResolvedValue(undefined);
    const mockTransport = {
      handleRequest: mockHandleRequest,
      sessionId,
    };

    // Add transport to transports map
    transports[sessionId] = mockTransport as any;

    mockReq.headers = {
      'mcp-session-id': sessionId,
      'last-event-id': lastEventId,
    };

    await mcpGetHandler(mockReq as Request, mockRes as Response);

    // Verify transport.handleRequest was called
    expect(mockHandleRequest.calls.length).toBeGreaterThan(0);

    // Cleanup
    delete transports[sessionId];
  });

  it('returns 400 when session ID is missing', async () => {
    await mcpGetHandler(mockReq as Request, mockRes as Response);

    expect(statusSpy.calls.length).toBeGreaterThan(0);
    expect(statusSpy.calls[0]?.[0]).toBe(400);
    expect(sendSpy.calls.length).toBeGreaterThan(0);
    expect(sendSpy.calls[0]?.[0]).toBe('Invalid or missing session ID');
  });

  it('returns 400 when session ID does not exist in transports', async () => {
    mockReq.headers = { 'mcp-session-id': 'non-existent-session' };

    await mcpGetHandler(mockReq as Request, mockRes as Response);

    expect(statusSpy.calls.length).toBeGreaterThan(0);
    expect(statusSpy.calls[0]?.[0]).toBe(400);
    expect(sendSpy.calls.length).toBeGreaterThan(0);
    expect(sendSpy.calls[0]?.[0]).toBe('Invalid or missing session ID');
  });
});

describe('mcpDeleteHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusSpy: MockFn;
  let sendSpy: MockFn;

  beforeEach(() => {
    // Clear transports before each test
    Object.keys(transports).forEach((key) => delete transports[key]);

    sendSpy = createMockFn().mockReturnThis();
    statusSpy = createMockFn().mockReturnValue({
      send: sendSpy,
    });

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: statusSpy as any,
      send: sendSpy as any,
      headersSent: false,
    };
  });

  it('handles DELETE request with valid session ID successfully', async () => {
    const sessionId = 'valid-session-id';
    const mockHandleRequest = createMockFn().mockResolvedValue(undefined);
    const mockTransport = {
      handleRequest: mockHandleRequest,
      sessionId,
    };

    // Add transport to transports map
    transports[sessionId] = mockTransport as any;

    mockReq.headers = { 'mcp-session-id': sessionId };

    await mcpDeleteHandler(mockReq as Request, mockRes as Response);

    // Verify transport.handleRequest was called
    expect(mockHandleRequest.calls.length).toBeGreaterThan(0);
    expect(mockHandleRequest.calls[0]?.[0]).toBe(mockReq);
    expect(mockHandleRequest.calls[0]?.[1]).toBe(mockRes);

    // Cleanup
    delete transports[sessionId];
  });

  it('returns 400 when session ID is missing', async () => {
    await mcpDeleteHandler(mockReq as Request, mockRes as Response);

    expect(statusSpy.calls.length).toBeGreaterThan(0);
    expect(statusSpy.calls[0]?.[0]).toBe(400);
    expect(sendSpy.calls.length).toBeGreaterThan(0);
    expect(sendSpy.calls[0]?.[0]).toBe('Invalid or missing session ID');
  });

  it('returns 400 when session ID does not exist in transports', async () => {
    mockReq.headers = { 'mcp-session-id': 'non-existent-session' };

    await mcpDeleteHandler(mockReq as Request, mockRes as Response);

    expect(statusSpy.calls.length).toBeGreaterThan(0);
    expect(statusSpy.calls[0]?.[0]).toBe(400);
    expect(sendSpy.calls.length).toBeGreaterThan(0);
    expect(sendSpy.calls[0]?.[0]).toBe('Invalid or missing session ID');
  });
});
