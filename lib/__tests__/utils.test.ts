import { describe, it, expect } from 'vitest';
import { convertFileSize } from '../utils';

describe('convertFileSize', () => {
  it('returns bytes for values under 1 KB', () => {
    expect(convertFileSize(500)).toBe('500 Bytes');
  });

  it('converts bytes to KB', () => {
    expect(convertFileSize(1024)).toBe('1.0 KB');
    expect(convertFileSize(1536)).toBe('1.5 KB');
  });

  it('converts bytes to MB', () => {
    const bytes = 2 * 1024 * 1024;
    expect(convertFileSize(bytes)).toBe('2.0 MB');
  });

  it('converts bytes to GB', () => {
    const bytes = 3 * 1024 * 1024 * 1024;
    expect(convertFileSize(bytes)).toBe('3.0 GB');
  });
});
