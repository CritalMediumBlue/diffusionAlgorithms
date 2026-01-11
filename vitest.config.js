import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/**',
                'docs/**',
                '**/*.test.js',
                'vitest.config.js'
            ],
            cleanOnRerun: false,
            all: false
        },
        testTimeout: 50000,
    },
});