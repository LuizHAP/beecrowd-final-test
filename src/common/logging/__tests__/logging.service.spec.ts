jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("test-uuid"),
}));

import { LoggingService } from "../index";

describe("LoggingService", () => {
  let service: LoggingService;

  beforeEach(() => {
    service = new LoggingService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should have info method", () => {
    expect(typeof service.info).toBe("function");
  });

  it("should have warn method", () => {
    expect(typeof service.warn).toBe("function");
  });

  it("should have error method", () => {
    expect(typeof service.error).toBe("function");
  });

  it("should have debug method", () => {
    expect(typeof service.debug).toBe("function");
  });

  it("should have log method", () => {
    expect(typeof service.log).toBe("function");
  });

  it("should have child method", () => {
    expect(typeof service.child).toBe("function");
  });

  it("should return a child logger", () => {
    const child = service.child("test");
    expect(child).toBeDefined();
  });

  it("should handle empty context in child logger", () => {
    const child = service.child("");
    expect(child).toBeDefined();
  });

  it("should handle undefined context in child logger", () => {
    const child = service.child(undefined as unknown as string);
    expect(child).toBeDefined();
  });

  it("should call info method", () => {
    service.info("test message");
  });

  it("should call warn method", () => {
    service.warn("test message");
  });

  it("should call error method", () => {
    service.error("test message");
  });

  it("should call debug method", () => {
    service.debug("test message");
  });

  it("should call log method", () => {
    service.log("test message");
  });

  it("should have fatal method", () => {
    expect(typeof service.fatal).toBe("function");
  });

  it("should call fatal method", () => {
    service.fatal("test message");
  });
});
