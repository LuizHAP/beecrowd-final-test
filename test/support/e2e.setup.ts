import 'reflect-metadata';
import { execSync } from 'child_process';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { setE2EApp, app } from './e2e-app';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://ecommerce:ecommerce123@127.0.0.1:5433/ecommerce';

beforeAll(async () => {
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.NODE_ENV = 'test';

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      DATABASE_URL: TEST_DB_URL,
    },
    stdio: 'inherit',
  });

  const nestApp = await NestFactory.create(AppModule);
  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  nestApp.enableCors();
  nestApp.setGlobalPrefix('api');
  await nestApp.init();
  setE2EApp(nestApp);
});

beforeEach(async () => {
  const prisma = app.get(PrismaService);
  await prisma.aILog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
});

afterAll(async () => {
  await app?.close();
});
