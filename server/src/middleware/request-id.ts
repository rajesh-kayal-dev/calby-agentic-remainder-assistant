import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware that generates a unique request ID for every incoming request.
 * - Sets `req.requestId` for use in downstream handlers/services.
 * - Adds `X-Request-Id` response header for client-side correlation.
 * - Preserves any existing `X-Request-Id` header from upstream proxies.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existingId = req.headers["x-request-id"];
  const requestId =
    typeof existingId === "string" && existingId.length > 0
      ? existingId
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}
