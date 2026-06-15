jest.mock("uuid", () => ({
  v4: jest.fn().mockReturnValue("test-correlation-id"),
}));

import { AppModule } from "../app.module";

describe("AppModule", () => {
  it("is defined", () => {
    expect(AppModule).toBeDefined();
  });

  it("is a class", () => {
    expect(typeof AppModule).toBe("function");
  });

  it("has a configure method for middleware", () => {
    expect(typeof AppModule.prototype.configure).toBe("function");
  });

  it("configure method should register middleware", () => {
    const module = new AppModule();
    const mockApply = jest.fn().mockReturnThis();
    const mockConsumer = {
      apply: mockApply,
    } as any;
    mockConsumer.forRoutes = jest.fn();
    module.configure(mockConsumer);
    expect(mockApply).toHaveBeenCalled();
  });
});
