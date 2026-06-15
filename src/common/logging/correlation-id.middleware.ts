import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const CORRELATION_ID_HEADER = "x-correlation-id";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const headerValue = req.headers[CORRELATION_ID_HEADER];
    const correlationId =
      typeof headerValue === "string" && /^[a-zA-Z0-9_-]+$/.test(headerValue)
        ? headerValue
        : randomUUID();
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    (req as any).correlationId = correlationId;
    next();
  }
}

export { CORRELATION_ID_HEADER };
