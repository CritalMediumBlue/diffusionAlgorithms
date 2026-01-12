import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        passWithNoTests: true,
        pool: 'threads',
        singleThread: false,
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
            all: false
        },
        testTimeout: 50000,
    },
});