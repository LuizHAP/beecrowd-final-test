import { readFileSync } from "fs";
import { join } from "path";

describe("main.ts", () => {
  it("exists and contains expected setup", () => {
    const mainPath = join(__dirname, "../bootstrap.ts");
    const content = readFileSync(mainPath, "utf-8");

    expect(content).toContain("NestFactory");
    expect(content).toContain("ValidationPipe");
    expect(content).toContain("enableCors");
    expect(content).toContain("setGlobalPrefix");
    expect(content).toContain("DocumentBuilder");
    expect(content).toContain("SwaggerModule");
    expect(content).toContain("bootstrap");
  });
});
