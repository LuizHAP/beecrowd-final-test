import { describe, it, expect } from 'vitest';
import { BackgroundJobModule } from './background-job.module';

describe('BackgroundJobModule', () => {
  it('is defined', () => {
    expect(BackgroundJobModule).toBeDefined();
  });

  it('is a class', () => {
    expect(typeof BackgroundJobModule).toBe('function');
  });
});
