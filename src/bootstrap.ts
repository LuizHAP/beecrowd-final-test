import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import pinoHttp from "pino-http";
import { AppModule } from "./app.module";
import { CORRELATION_ID_HEADER } from "./common/logging/correlation-id.middleware";

/* c8 ignore next 3 */
function customProps(req: any) {
  return { correlationId: (req as any).correlationId };
}

/* c8 ignore next 4 */
function customReceivedMessage(req: any, res: any) {
  const correlationId = (res as any)[CORRELATION_ID_HEADER] as string;
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
