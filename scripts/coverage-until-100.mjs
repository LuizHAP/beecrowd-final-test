#!/usr/bin/env node
/**
 * Runs Jest coverage in a loop until global thresholds reach 100% or max attempts.
 * Usage: node scripts/coverage-until-100.mjs [--max=10]
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const maxArg = process.argv.find((a) => a.startsWith('--max='));
const maxAttempts = maxArg ? Number(maxArg.split('=')[1]) : 10;

function runCoverage() {
  execSync('npm run test:cov -- --silent', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' },
  });
}

function reportGaps() {
  const summaryPath = join(root, 'coverage/coverage-summary.json');
  if (!existsSync(summaryPath)) {
    console.error('No coverage-summary.json found.');
    return;
  }
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const total = summary.total;
  console.error('\nCoverage gaps:');
  console.error(
    `  statements ${total.statements.pct}% | branches ${total.branches.pct}% | functions ${total.functions.pct}% | lines ${total.lines.pct}%`,
  );
  for (const [file, metrics] of Object.entries(summary)) {
    if (file === 'total') continue;
    if (metrics.statements.pct < 100 || metrics.branches.pct < 100) {
      console.error(`  - ${file.replace(root + '/', '')}: ${metrics.statements.pct}% stmts`);
    }
  }
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  console.log(`\n[coverage-until-100] attempt ${attempt}/${maxAttempts}`);
  try {
    runCoverage();
    console.log('[coverage-until-100] 100% coverage reached.');
    process.exit(0);
  } catch {
    reportGaps();
  }
}

console.error('[coverage-until-100] max attempts reached without 100% coverage.');
process.exit(1);
