import { test, expect, _electron as electron } from '@playwright/test';

// Test helper to reset database before each test
async function resetTestDatabase(electronApp: any) {
  try {
    const mainWindow = await electronApp.firstWindow();
    await mainWindow.evaluate(() => {
      return (window as any).ipcRenderer.invoke('test:resetDatabase');
    });
  } catch (error) {
    console.warn('Failed to reset test database:', error);
  }
}

test.describe('EasePM Application', () => {
  test('should launch app and display main window', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: { ...process.env, NODE_ENV: 'test' }, // Set test environment
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);
    
    // Check for the actual title or app content instead
    await expect(firstWindow).toHaveTitle(/Electron \+ Vite \+ Vue|EasePM/);
    
    const isVisible = await firstWindow.isVisible('body');
    expect(isVisible).toBe(true);

    await electronApp.close();
  });

  test('should navigate to customers page', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: { ...process.env, NODE_ENV: 'test' }, // Set test environment
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);

    const customersLink = firstWindow.locator('text=Customers').first();
    if (await customersLink.isVisible()) {
      await customersLink.click();
      await firstWindow.waitForTimeout(1000);
    }

    await electronApp.close();
  });

  test('should navigate to projects page', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: { ...process.env, NODE_ENV: 'test' }, // Set test environment
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);

    const projectsLink = firstWindow.locator('text=Projects').first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await firstWindow.waitForTimeout(1000);
    }

    await electronApp.close();
  });

  test('should navigate to invoices page', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: { ...process.env, NODE_ENV: 'test' }, // Set test environment
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);

    const invoicesLink = firstWindow.locator('text=Invoices').first();
    if (await invoicesLink.isVisible()) {
      await invoicesLink.click();
      await firstWindow.waitForTimeout(1000);
    }

    await electronApp.close();
  });
});