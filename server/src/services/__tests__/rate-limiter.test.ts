import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimiter } from "../../middleware/rate-limiter.js";

test("1. rateLimiter allows requests under limit", () => {
  const limiter = rateLimiter({ maxRequests: 5, windowMs: 10_000 });

  let nextCalled = 0;
  const mockReq = { ip: "127.0.0.1", socket: {} } as any;
  const headers: Record<string, string> = {};
  const mockRes = {
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    status: () => mockRes,
    json: () => mockRes,
  } as any;

  for (let i = 0; i < 5; i++) {
    limiter(mockReq, mockRes, () => {
      nextCalled++;
    });
  }

  assert.equal(nextCalled, 5);
  assert.equal(headers["X-RateLimit-Limit"], "5");
  assert.equal(headers["X-RateLimit-Remaining"], "0");
});

test("2. rateLimiter rejects requests over limit with 429", () => {
  const limiter = rateLimiter({ maxRequests: 2, windowMs: 10_000 });

  let statusCode = 200;
  let jsonBody: any = null;
  const mockReq = { ip: "192.168.1.100", socket: {} } as any;
  const mockRes = {
    setHeader: () => {},
    status: (code: number) => {
      statusCode = code;
      return mockRes;
    },
    json: (body: any) => {
      jsonBody = body;
      return mockRes;
    },
  } as any;

  // Request 1: allowed
  limiter(mockReq, mockRes, () => {});
  assert.equal(statusCode, 200);

  // Request 2: allowed
  limiter(mockReq, mockRes, () => {});
  assert.equal(statusCode, 200);

  // Request 3: blocked
  limiter(mockReq, mockRes, () => {});
  assert.equal(statusCode, 429);
  assert.ok(jsonBody?.error);
});
