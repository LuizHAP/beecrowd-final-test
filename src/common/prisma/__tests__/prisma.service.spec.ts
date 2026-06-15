import { PrismaService } from "../prisma.service";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(function () {
    this.$connect = jest.fn().mockResolvedValue(undefined);
    this.$disconnect = jest.fn().mockResolvedValue(undefined);
  }),
}));

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  describe("onModuleInit", () => {
    it("calls $connect on module init", async () => {
      await service.onModuleInit();

      expect(service["$connect"]).toHaveBeenCalled();
    });
  });
});
