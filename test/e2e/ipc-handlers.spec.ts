import {test, expect, _electron as electron} from '@playwright/test';

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

test.describe('IPC Handlers Error Handling', () => {
  test('should handle missing parameters in storeAdd', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: {...process.env, NODE_ENV: 'test'},
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    await resetTestDatabase(electronApp);

    // Test missing storeName
    const result1 = await firstWindow.evaluate(async () => {
      try {
        await (window as any).ipcRenderer.invoke('storeAdd', null, 'customerData', {});
        return {success: true};
      } catch (error) {
        return {success: false, error: error.message};
      }
    });

    expect(result1.success).toBe(false);
    expect(result1.error).toContain('Store name and key are required');

    // Test missing key
    const result2 = await firstWindow.evaluate(async () => {
      try {
        await (window as any).ipcRenderer.invoke('storeAdd', 'customerData', null, {});
        return {success: true};
      } catch (error) {
        return {success: false, error: error.message};
      }
    });

    expect(result2.success).toBe(false);
    expect(result2.error).toContain('Store name and key are required');

    // Test null value
    const result3 = await firstWindow.evaluate(async () => {
      try {
        await (window as any).ipcRenderer.invoke('storeAdd', 'customerData', 'customerData', null);
        return {success: true};
      } catch (error) {
        return {success: false, error: error.message};
      }
    });

    expect(result3.success).toBe(false);
    expect(result3.error).toContain('Value cannot be null or undefined');

    await electronApp.close();
  });

  test('should handle validation errors in customer creation', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: {...process.env, NODE_ENV: 'test'},
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    await resetTestDatabase(electronApp);

    // Test missing required fields
    const result = await firstWindow.evaluate(async () => {
      try {
        await (window as any).ipcRenderer.invoke('storeAdd', 'customerData', 'customerData', {
          firstName: 'Test',
          // Missing lastName and customerNumber
        });
        return {success: true};
      } catch (error) {
        return {success: false, error: error.message};
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Customer must have firstName, lastName, and customerNumber');

    await electronApp.close();
  });

  test('should handle validation errors in customer update', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: {...process.env, NODE_ENV: 'test'},
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    await resetTestDatabase(electronApp);

    // First create a customer
    const customer = await firstWindow.evaluate(() => {
      return (window as any).ipcRenderer.invoke('storeAdd', 'customerData', 'customerData', {
        firstName: 'Test',
        lastName: 'Customer',
        customerNumber: 'TC001',
        email: 'test@example.com',
        company: 'Test Company',
        address: '123 Test St',
        zip: '12345',
        city: 'Test City',
        country: 'United States'
      });
    });

    // Try to update with invalid data
    const result = await firstWindow.evaluate(async (customerId) => {
      try {
        await (window as any).ipcRenderer.invoke('storeUpdate', 'customerData', 'customerData', customerId, {
          firstName: '', // Empty firstName should fail validation
        });
        return {success: true};
      } catch (error) {
        return {success: false, error: error.message};
      }
    }, customer._id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Customer firstName cannot be empty');

    await electronApp.close();
  });

  test('should handle non-existent entity deletion', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: {...process.env, NODE_ENV: 'test'},
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    await resetTestDatabase(electronApp);

    // Try to delete non-existent customer
    const result = await firstWindow.evaluate(async () => {
      try {
        await (window as any).ipcRenderer.invoke('storeRemoveSingle', 'customerData', 'customerData', 'non-existent-id');
        return {success: true};
      } catch (error) {
        return {success: false, error: error.message};
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Customer with ID non-existent-id not found');

    await electronApp.close();
  });

  test('should handle backward compatibility with existing API format', async () => {
    const electronApp = await electron.launch({
      args: ['./dist-electron/main/index.js'],
      env: {...process.env, NODE_ENV: 'test'},
    });

    const firstWindow = await electronApp.firstWindow();
    await firstWindow.waitForLoadState('domcontentloaded');
    await resetTestDatabase(electronApp);

    // Test that the API still works with the expected format
    const customer = await firstWindow.evaluate(() => {
      return (window as any).ipcRenderer.invoke('storeAdd', 'customerData', 'customerData', {
        firstName: 'Test',
        lastName: 'Customer',
        customerNumber: 'TC001',
        email: 'test@example.com',
        company: 'Test Company',
        address: '123 Test St',
        zip: '12345',
        city: 'Test City',
        country: 'United States'
      });
    });

    expect(customer).toBeDefined();
    expect(customer._id).toBeDefined();
    expect(customer.firstName).toBe('Test');
    expect(customer.lastName).toBe('Customer');

    // Test retrieval still works
    const customers = await firstWindow.evaluate(() => {
      return (window as any).ipcRenderer.invoke('storeGet', 'customerData', 'customerData');
    });

    expect(customers).toHaveLength(1);
    expect(customers[0]._id).toBe(customer._id);

    await electronApp.close();
  });
});
