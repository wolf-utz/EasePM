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

// Test helper to create test data
async function createTestCustomer(electronApp: any) {
  const mainWindow = await electronApp.firstWindow();
  return await mainWindow.evaluate(() => {
    return (window as any).ipcRenderer.invoke('storeAdd', 'customerData', 'customerData', {
      firstName: 'Test',
      lastName: 'Customer',
      customerNumber: 'TC001',
      email: 'test@example.com',
      company: 'Test Company',
      address: '123 Test St',
      zip: '12345',
      city: 'Test City',
      country: 'United States' // Added required country field
    });
  });
}

test.describe('EasePM Database Integration', () => {
  test('should use separate test database', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);
    
    // Verify database is empty after reset
    const customers = await firstWindow.evaluate(() => {
      return (window as any).ipcRenderer.invoke('storeGet', 'customerData', 'customerData');
    });
    
    expect(customers).toEqual([]);

    await electronApp.close();
  });

  test('should create and retrieve customer data', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);
    
    // Create a test customer
    const createdCustomer = await createTestCustomer(electronApp);
    expect(createdCustomer).toBeDefined();
    expect(createdCustomer.firstName).toBe('Test');
    expect(createdCustomer.lastName).toBe('Customer');
    
    // Retrieve all customers
    const customers = await firstWindow.evaluate(() => {
      return (window as any).ipcRenderer.invoke('storeGet', 'customerData', 'customerData');
    });
    
    expect(customers).toHaveLength(1);
    expect(customers[0].firstName).toBe('Test');

    await electronApp.close();
  });

  test('should reset database between tests', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: { ...process.env, NODE_ENV: 'test' },
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    
    // Reset test database for clean state
    await resetTestDatabase(electronApp);
    
    // Verify database is empty (previous test data should be gone)
    const customers = await firstWindow.evaluate(() => {
      return (window as any).ipcRenderer.invoke('storeGet', 'customerData', 'customerData');
    });
    
    expect(customers).toEqual([]);

    await electronApp.close();
  });
});