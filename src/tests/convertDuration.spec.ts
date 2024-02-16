import { describe, it, expect } from 'vitest';
import convertDuration from '../utils/convertDuration';

describe('convertDuration.js', () => {
  it('should convert duration to hours', () => {
    expect(convertDuration('01:30:00')).toBe(1.5);
  });
});
