const mockApp = {
  useGlobalPipes: jest.fn(),
  enableCors: jest.fn(),
  setGlobalPrefix: jest.fn(),
  use: jest.fn(),
  listen: jest.fn().mockResolvedValue(undefined),
};

jest.mock("../app.module", () => ({
  AppModule: class AppModule {},
}));

jest.mock("@nestjs/core", () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue(mockApp),
  },
}));

jest.mock("@nestjs/swagger", () => ({
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addServer: jest.fn().mockReturnThis(),
    addTag: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({ openapi: "3.0.0" }),
  })),
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue({}),
    setup: jest.fn(),
  },
}));

jest.mock("pino-http", () =>
  jest.fn().mockReturnValue({
    headers: {},
    customProps: () => ({}),
    customReceivedMessage: () => "",
  }),
);

jest.mock("../common/logging/correlation-id.middleware", () => ({
  CorrelationIdMiddleware: class CorrelationIdMiddleware {},
  CORRELATION_ID_HEADER: "x-correlation-id",
}));

import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { bootstrap } from "../bootstrap";

describe("bootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PORT;
  });

  it("creates and configures the NestJS application", async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith("api");
    expect(mockApp.use).toHaveBeenCalled();
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith("api", mockApp, {});
    expect(mockApp.listen).toHaveBeenCalledWith(3000);
  });

  it("uses PORT from environment when provided", async () => {
    process.env.PORT = "4000";

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith("4000");
  });
});
