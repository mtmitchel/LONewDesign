import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './components',
  testMatch: '**/*.test.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    
    // Explicit viewport size for React rendering
    viewport: { width: 1920, height: 1080 },
    
    // Additional stability settings
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Launch in headed mode with slow motion to debug rendering issues
        launchOptions: {
          headless: false,
          slowMo: 100,
        },
      },
    },
  ],

  // Run dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
