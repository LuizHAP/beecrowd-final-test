import { AppModule } from "../app.module";

describe("AppModule", () => {
  it("is defined", () => {
    expect(AppModule).toBeDefined();
  });

  it("is a class", () => {
    expect(typeof AppModule).toBe("function");
  });
});
