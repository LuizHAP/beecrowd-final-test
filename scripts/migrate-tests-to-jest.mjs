import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

const MIGRATIONS = [
  ['src/domain/order/order.entity.test.ts', 'test/unit/domain/order/order.entity.spec.ts'],
  ['src/domain/order/order-item.entity.test.ts', 'test/unit/domain/order/order-item.entity.spec.ts'],
  ['src/domain/order/order-status.test.ts', 'test/unit/domain/order/order-status.spec.ts'],
  ['src/orders/orders.service.test.ts', 'test/unit/application/orders/orders.service.spec.ts'],
  ['src/ai-agent/ai-agent.service.test.ts', 'test/unit/application/ai-agent/ai-agent.service.spec.ts'],
  ['src/background-job/background-job.service.test.ts', 'test/unit/application/background-job/background-job.service.spec.ts'],
  ['src/orders/prisma-order.repository.test.ts', 'test/unit/infrastructure/persistence/prisma-order.repository.spec.ts'],
  ['src/common/prisma/prisma.service.test.ts', 'test/unit/infrastructure/prisma/prisma.service.spec.ts'],
  ['src/orders/orders.controller.test.ts', 'test/unit/presentation/orders/orders.controller.spec.ts'],
  ['src/ai-agent/ai-agent.controller.test.ts', 'test/unit/presentation/ai-agent/ai-agent.controller.spec.ts'],
  ['src/common/health/health.controller.test.ts', 'test/unit/presentation/health/health.controller.spec.ts'],
  ['src/orders/dto.test.ts', 'test/unit/presentation/orders/dto.spec.ts'],
  ['src/app.module.test.ts', 'test/unit/composition/app.module.spec.ts'],
  ['src/orders/orders.module.test.ts', 'test/unit/composition/orders.module.spec.ts'],
  ['src/ai-agent/ai-agent.module.test.ts', 'test/unit/composition/ai-agent.module.spec.ts'],
  ['src/background-job/background-job.module.test.ts', 'test/unit/composition/background-job.module.spec.ts'],
  ['src/main.test.ts', 'test/unit/composition/main.spec.ts'],
  ['test/e2e/orders.e2e.test.ts', 'test/e2e/orders.e2e-spec.ts'],
  ['test/e2e/ai-agent.e2e.test.ts', 'test/e2e/ai-agent.e2e-spec.ts'],
  ['test/e2e/status-transitions.e2e.test.ts', 'test/e2e/status-transitions.e2e-spec.ts'],
];

function convertVitestToJest(content, destPath) {
  let out = content;

  out = out.replace(/^import\s+\{[^}]+\}\s+from\s+['"]vitest['"];?\n/gm, '');
  out = out.replace(/\bvi\./g, 'jest.');
  out = out.replace(/jest\.mocked\(/g, 'jest.mocked(');

  const depth = destPath.split('/').length - 0;
  const srcPrefix = destPath.startsWith('test/e2e')
    ? '../support/e2e.setup'
    : null;

  if (srcPrefix && out.includes("from '../../test/setup'")) {
    out = out.replace("from '../../test/setup'", "from '../support/e2e.setup'");
  }
  if (srcPrefix && out.includes("from '../../test/setup.ts'")) {
    out = out.replace("from '../../test/setup.ts'", "from '../support/e2e.setup'");
  }

  const importMap = [
    [/\.\/orders\.service/g, '@/orders/orders.service'],
    [/\.\/orders\.controller/g, '@/orders/orders.controller'],
    [/\.\/orders\.module/g, '@/orders/orders.module'],
    [/\.\/dto/g, '@/orders/dto'],
    [/\.\/prisma-order\.repository/g, '@/orders/prisma-order.repository'],
    [/\.\/ai-agent\.service/g, '@/ai-agent/ai-agent.service'],
    [/\.\/ai-agent\.controller/g, '@/ai-agent/ai-agent.controller'],
    [/\.\/ai-agent\.module/g, '@/ai-agent/ai-agent.module'],
    [/\.\/background-job\.service/g, '@/background-job/background-job.service'],
    [/\.\/background-job\.module/g, '@/background-job/background-job.module'],
    [/\.\/app\.module/g, '@/app.module'],
    [/\.\/main/g, '@/main'],
    [/\.\.\/domain\/order\/order\.entity/g, '@/domain/order/order.entity'],
    [/\.\.\/domain\/order\/order-item\.entity/g, '@/domain/order/order-item.entity'],
    [/\.\.\/domain\/order\/order-status/g, '@/domain/order/order-status'],
    [/\.\.\/domain\/order\/order\.repository/g, '@/domain/order/order.repository'],
    [/\.\.\/orders\/prisma-order\.repository/g, '@/orders/prisma-order.repository'],
    [/\.\.\/common\/prisma\/prisma\.service/g, '@/common/prisma/prisma.service'],
    [/\.\.\/common\/prisma\/prisma\.module/g, '@/common/prisma/prisma.module'],
    [/\.\.\/common\/health\/health\.controller/g, '@/common/health/health.controller'],
    [/\.\.\/orders\/orders\.module/g, '@/orders/orders.module'],
    [/\.\.\/background-job\/background-job\.module/g, '@/background-job/background-job.module'],
    [/\.\.\/ai-agent\/ai-agent\.module/g, '@/ai-agent/ai-agent.module'],
    [/"(\.\.\/)+common\/prisma\/prisma\.service"/g, '"@/common/prisma/prisma.service"'],
    [/"(\.\.\/)+orders\/prisma-order\.repository"/g, '"@/orders/prisma-order.repository"'],
    [/"(\.\.\/)+background-job\/background-job\.service"/g, '"@/background-job/background-job.service"'],
    [/\.\.\/\.\.\/src\/app\.module/g, '@/app.module'],
    [/\.\.\/\.\.\/test\/setup/g, '../support/e2e.setup'],
  ];

  for (const [pattern, replacement] of importMap) {
    out = out.replace(pattern, replacement);
  }

  return out;
}

for (const [srcRel, destRel] of MIGRATIONS) {
  const src = path.join(ROOT, srcRel);
  const dest = path.join(ROOT, destRel);

  if (!fs.existsSync(src)) {
    console.warn(`Skip missing: ${srcRel}`);
    continue;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const content = fs.readFileSync(src, 'utf8');
  const converted = convertVitestToJest(content, destRel);
  fs.writeFileSync(dest, converted);
  console.log(`Migrated: ${srcRel} -> ${destRel}`);
}

console.log('Done.');
