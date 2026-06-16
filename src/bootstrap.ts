import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { Request, Response } from "express";
import pinoHttp from "pino-http";
import { AppModule } from "./app.module";
import { CORRELATION_ID_HEADER } from "./common/logging/correlation-id.middleware";
import { randomUUID } from "crypto";

interface CorrelationRequest extends Request {
  correlationId: string;
}

interface CorrelationResponse extends Response {
  [CORRELATION_ID_HEADER]?: string;
}

/* c8 ignore next 3 */
function customProps(req: CorrelationRequest): Record<string, string> {
  return { correlationId: req.correlationId };
}

/* c8 ignore next 4 */
function customReceivedMessage(req: Request, res: CorrelationResponse): string {
  const correlationId = res[CORRELATION_ID_HEADER] ?? "unknown";
  return `HTTP ${res.statusCode} ${req.method} ${req.url} [correlationId:${correlationId}]`;
}

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();
  app.setGlobalPrefix("api");

  // Correlation ID middleware (must run before pino-http)
  /* c8 ignore next 11 */
  app.use((req: Request, _res: Response, next: () => void) => {
    const headerValue = req.headers[CORRELATION_ID_HEADER];
    const correlationId =
      typeof headerValue === "string" && /^[a-zA-Z0-9_-]+$/.test(headerValue)
        ? headerValue
        : randomUUID();
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    (req as CorrelationRequest).correlationId = correlationId;
    next();
  });

  // Structured request logging with Pino
  app.use(
    pinoHttp({
      customProps,
      customReceivedMessage,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("E-Commerce AI Support API")
    .setDescription(
      "AI-powered support agent for an e-commerce platform. " +
        "Provides order management, intent classification, RAG contextualization, " +
        "and autonomous tool calling with prompt injection guardrails.",
    )
    .setVersion("1.0")
    .addServer("/api", "API with global prefix")
    .addTag("orders", "Order management — CRUD with strict state machine")
    .addTag("ai-agent", "AI Agent — chat and observability logs")
    .addTag("health", "Health check — database connectivity")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
