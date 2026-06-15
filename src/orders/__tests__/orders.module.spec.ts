import { MODULE_METADATA } from "@nestjs/common/constants";
import { OrdersModule } from "../orders.module";
import { OrdersService } from "../orders.service";
import { OrdersController } from "../orders.controller";
import { PrismaOrderRepository } from "../prisma-order.repository";

describe("OrdersModule", () => {
  it("should be defined", () => {
    expect(OrdersModule).toBeDefined();
  });

  it("should have correct providers", () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      OrdersModule,
    );
    expect(providers).toContain(OrdersService);
    expect(providers).toContain(PrismaOrderRepository);
  });

  it("should have correct controllers", () => {
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      OrdersModule,
    );
    expect(controllers).toContain(OrdersController);
  });

  it("should export OrdersService", () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, OrdersModule);
    expect(exports).toContain(OrdersService);
  });
});
