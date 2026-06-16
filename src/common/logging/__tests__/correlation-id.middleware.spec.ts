jest.mock("crypto", () => ({
  randomUUID: jest.fn().mockReturnValue("generated-uuid"),
}));

import {
  CorrelationIdMiddleware,
  CORRELATION_ID_HEADER,
} from "../correlation-id.middleware";
import type { IncomingHttpHeaders } from "http";
import type { NextFunction, Response } from "express";

interface CorrelationRequest {
  headers: IncomingHttpHeaders;
  correlationId?: string;
}

describe("CorrelationIdMiddleware", () => {
  let middleware: CorrelationIdMiddleware;
  let req: CorrelationRequest;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    req = { headers: {} as IncomingHttpHeaders };
    res = {} as Response;
    next = jest.fn();
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  it("should set correlation ID from header when present and valid", () => {
    req.headers[CORRELATION_ID_HEADER] = "test-correlation-id";
    middleware.use(req as never, res as never, next as never);

    expect(req.headers[CORRELATION_ID_HEADER]).toBe("test-correlation-id");
    expect(req.correlationId).toBe("test-correlation-id");
    expect(next).toHaveBeenCalled();
  });

  it("should generate a new correlation ID when header is missing", () => {
    middleware.use(req as never, res as never, next as never);

    expect(req.headers[CORRELATION_ID_HEADER]).toBeDefined();
    expect(req.headers[CORRELATION_ID_HEADER]).toBe("generated-uuid");
    expect(req.correlationId).toBe("generated-uuid");
    expect(next).toHaveBeenCalled();
  });

  it("should reject malformed header values and generate new ID", () => {
    req.headers[CORRELATION_ID_HEADER] = "malicious<script>alert(1)</script>";
    middleware.use(req as never, res as never, next as never);

    expect(req.headers[CORRELATION_ID_HEADER]).toBe("generated-uuid");
    expect(req.correlationId).toBe("generated-uuid");
  });

  it("should reject empty string header and generate new ID", () => {
    req.headers[CORRELATION_ID_HEADER] = "";
    middleware.use(req as never, res as never, next as never);

    expect(req.headers[CORRELATION_ID_HEADER]).toBe("generated-uuid");
    expect(req.correlationId).toBe("generated-uuid");
  });
});
