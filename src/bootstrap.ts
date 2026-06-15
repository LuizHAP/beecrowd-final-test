import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

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
  console.log(`E-Commerce AI Support running on port ${port}`);
}
