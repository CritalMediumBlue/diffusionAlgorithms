import { afterAll } from 'vitest';
import { generateAllPlots } from './plotHelper.js';

// Generate all plots after all tests complete
afterAll(() => {
    generateAllPlots('all-test-plots');
});
