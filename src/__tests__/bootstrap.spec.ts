const mockApp = {
  useGlobalPipes: jest.fn(),
  enableCors: jest.fn(),
  setGlobalPrefix: jest.fn(),
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

import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { bootstrap } from "../bootstrap";

describe("bootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PORT;
  });

  it("creates and configures the NestJS application", async () => {
    const logSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalled();
    expect(mockApp.useGlobalPipes).toHaveBeenCalled();
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith("api");
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith("api", mockApp, {});
    expect(mockApp.listen).toHaveBeenCalledWith(3000);
    expect(logSpy).toHaveBeenCalledWith(
      "E-Commerce AI Support running on port 3000",
    );

    logSpy.mockRestore();
  });

  it("uses PORT from environment when provided", async () => {
    process.env.PORT = "4000";
    jest.spyOn(console, "log").mockImplementation(() => undefined);

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith("4000");
  });
});
