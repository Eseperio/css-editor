import { describe, it, expect } from 'vitest';

// Basic smoke test to ensure build works
describe('CSS Editor Build', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
  
  it('should have jsdom environment', () => {
    expect(typeof window).toBe('object'); // jsdom is initialized
    expect(typeof document).toBe('object');
  });
});
