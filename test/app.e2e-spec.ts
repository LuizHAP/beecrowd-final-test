import request from "supertest";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "../src/app.module";

describe("App (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");

    const config = new DocumentBuilder()
      .setTitle("E-Commerce AI Support API")
      .setDescription("API documentation")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/api/health (GET) should return healthy status", () => {
    return request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect((res: { body: { status: string } }) => {
        expect(res.body.status).toBe("ok");
      });
  });

  it("/api (GET) should return swagger JSON schema", () => {
    return request(app.getHttpServer()).get("/api").expect(200);
  });
});
