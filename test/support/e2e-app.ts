import type { INestApplication } from '@nestjs/common';

export let app: INestApplication;

export function setE2EApp(instance: INestApplication): void {
  app = instance;
}
