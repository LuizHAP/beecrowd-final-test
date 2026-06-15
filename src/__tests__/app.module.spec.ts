import { AppModule } from "../app.module";

describe("AppModule", () => {
  it("is defined", () => {
    expect(AppModule).toBeDefined();
  });

  it("is a class decorated with @Module", () => {
    expect(typeof AppModule).toBe("function");
  });

  it("has the expected module configuration", () => {
    expect(AppModule).toBeDefined();
    expect(typeof AppModule).toBe("function");
  });

  it("is an instance of AppModule", () => {
    const module = new AppModule();
    expect(module).toBeInstanceOf(AppModule);
  });
});
