import {app, BrowserWindow, ipcMain} from "electron";
import path from "node:path";
import {
  InvoiceSettings,
  PersonalData,
  TimesheetFilter
} from "./types";
import {createInvoicePdf} from "./pdf-invoice-generator";
import {formatUnixTimestampToGermanDate} from "./util/timestamp-date-util";
import {createTimeSheetReportCsvString, createTimeSheetReportData} from "./time-sheet";
import {openFileDialog} from "./io/file-dialog";
import fs from "fs/promises";
import Store from "./store";
import FileManager from "./file-manager";
import {createServiceContainer, ServiceContainer} from "../services/Container";
import {AppDataSource, resetTestDatabase} from "../data-source";
import {Invoice} from "../entity/Invoice";
import {Customer} from "../entity/Customer";
import {InvoiceLineItem} from "../entity/InvoiceLineItem";
import config from "../config/env";

const stores = {
  personalData: new Store({
    configName: "personal-data",
    defaults: {personalData: []},
  }),
  customerData: new Store({
    configName: "customer-data",
    defaults: {customerData: []},
  }),
  invoiceData: new Store({
    configName: "invoice-data",
    defaults: {invoiceData: []},
  }),
  projectData: new Store({
    configName: "project-data",
    defaults: {projectData: []},
  }),
};
const fileManager: FileManager = new FileManager();
let services: ServiceContainer | null = null;

async function getServices(): Promise<ServiceContainer> {
  if (!services) {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized. Please initialize database first.');
    }
    services = createServiceContainer();
  }
  return services;
}


export function registerIpcHandlers() {

  ipcMain.handle("storeSet", (_, storeName, key, value) => {
    const targetStore = stores[storeName] || null;
    if (targetStore === null) {
      throw new Error(`Requested not existing store "${storeName}".`);
    }

    targetStore.set(key, value);
  });

  ipcMain.handle("storeGet", async (_, storeName, key) => {
    // Handle customer data with TypeORM
    if (storeName === "customerData" && key === "customerData") {
      try {
        const serviceContainer = await getServices();
        return await serviceContainer.customerService.findAll();
      } catch (error) {
        console.error('Error fetching customers from database:', error);
        throw new Error(`Failed to fetch customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle invoice data with TypeORM
    if (storeName === "invoiceData" && key === "invoiceData") {
      try {
        const serviceContainer = await getServices();
        return await serviceContainer.invoiceService.findAll();
      } catch (error) {
        console.error('Error fetching invoices from database:', error);
        throw new Error(`Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle project data with TypeORM
    if (storeName === "projectData" && key === "projectData") {
      try {
        const serviceContainer = await getServices();
        return await serviceContainer.projectService.findAll();
      } catch (error) {
        console.error('Error fetching projects from database:', error);
        throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fall back to existing store for other data
    const targetStore = stores[storeName] || null;
    if (targetStore === null) {
      throw new Error(`Requested not existing store "${storeName}".`);
    }

    return targetStore.get(key);
  });

  ipcMain.handle("storeGetSingle", async (_, storeName, key, id) => {
    // Handle customer data with TypeORM
    if (storeName === "customerData" && key === "customerData") {
      try {
        const serviceContainer = await getServices();
        return await serviceContainer.customerService.findById(id);
      } catch (error) {
        console.error('Error fetching customer from database:', error);
        throw new Error(`Failed to fetch customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle invoice data with TypeORM
    if (storeName === "invoiceData" && key === "invoiceData") {
      try {
        const serviceContainer = await getServices();
        return await serviceContainer.invoiceService.findById(id);
      } catch (error) {
        console.error('Error fetching invoice from database:', error);
        throw new Error(`Failed to fetch invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle project data with TypeORM
    if (storeName === "projectData" && key === "projectData") {
      try {
        const serviceContainer = await getServices();
        return await serviceContainer.projectService.findById(id);
      } catch (error) {
        console.error('Error fetching project from database:', error);
        throw new Error(`Failed to fetch project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fall back to existing store for other data
    const targetStore = stores[storeName] || null;
    if (targetStore === null) {
      throw new Error(`Requested not existing store "${storeName}".`);
    }

    return targetStore.getSingle(key, id);
  });

  ipcMain.handle("storeAdd", async (_, storeName, key, value) => {
    // Validate input parameters
    if (!storeName || !key) {
      throw new Error('Store name and key are required');
    }
    if (value === undefined || value === null) {
      throw new Error('Value cannot be null or undefined');
    }

    // Handle customer data with TypeORM
    if (storeName === "customerData" && key === "customerData") {
      try {
        // Validate required customer fields
        if (!value.firstName || !value.lastName || !value.customerNumber) {
          throw new Error('Customer must have firstName, lastName, and customerNumber');
        }

        const serviceContainer = await getServices();
        return await serviceContainer.customerService.create(value);
      } catch (error) {
        console.error('Error adding customer to database:', error);
        throw new Error(`Failed to add customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle invoice data with TypeORM
    if (storeName === "invoiceData" && key === "invoiceData") {
      try {
        // Validate required invoice fields
        if (!value.invoiceNumber || !value._customerId) {
          throw new Error('Invoice must have invoiceNumber and _customerId');
        }

        const serviceContainer = await getServices();
        return await serviceContainer.invoiceService.create(value, value.lineItems || []);
      } catch (error) {
        console.error('Error adding invoice to database:', error);
        throw new Error(`Failed to add invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle project data with TypeORM
    if (storeName === "projectData" && key === "projectData") {
      try {
        // Validate required project fields
        if (!value.projectNumber || !value.title || !value._customerId) {
          throw new Error('Project must have projectNumber, title, and _customerId');
        }

        const serviceContainer = await getServices();
        return await serviceContainer.projectService.create(value);
      } catch (error) {
        console.error('Error adding project to database:', error);
        throw new Error(`Failed to add project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle invoice settings and other non-entity data
    if (storeName === "invoiceData" && key === "invoiceSettings") {
      const targetStore = stores[storeName];
      if (!targetStore) {
        throw new Error(`Store "${storeName}" not found`);
      }
      targetStore.add(key, value);
      console.log(`Updated invoice settings`);
      return value;
    }

    // Fall back to existing store for other data (e.g., personalData)
    const targetStore = stores[storeName] || null;
    if (targetStore === null) {
      throw new Error(`Requested not existing store "${storeName}".`);
    }

    targetStore.add(key, value);
    console.log(`Added to store: ${storeName}.${key}`);
    return value;
  });

  ipcMain.handle("storeUpdate", async (_, storeName, key, id, value) => {
    // Validate input parameters
    if (!storeName || !key || !id) {
      throw new Error('Store name, key, and ID are required');
    }
    if (value === undefined || value === null) {
      throw new Error('Value cannot be null or undefined');
    }

    // Handle customer data with TypeORM
    if (storeName === "customerData" && key === "customerData") {
      try {
        // Validate that we're not trying to clear required fields
        if (value.hasOwnProperty('firstName') && (!value.firstName || value.firstName.trim() === '')) {
          throw new Error('Customer firstName cannot be empty');
        }
        if (value.hasOwnProperty('lastName') && (!value.lastName || value.lastName.trim() === '')) {
          throw new Error('Customer lastName cannot be empty');
        }
        if (value.hasOwnProperty('customerNumber') && (!value.customerNumber || value.customerNumber.trim() === '')) {
          throw new Error('Customer number cannot be empty');
        }

        const serviceContainer = await getServices();
        const updatedCustomer = await serviceContainer.customerService.update(id, value);
        console.log(`Updated customer: ${id}`);
        return updatedCustomer;
      } catch (error) {
        console.error('Error updating customer in database:', error);
        throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle invoice data with TypeORM
    if (storeName === "invoiceData" && key === "invoiceData") {
      try {
        // Validate that we're not trying to clear required fields
        if (value.hasOwnProperty('invoiceNumber') && (!value.invoiceNumber || value.invoiceNumber.trim() === '')) {
          throw new Error('Invoice number cannot be empty');
        }
        if (value.hasOwnProperty('_customerId') && (!value._customerId || value._customerId.trim() === '')) {
          throw new Error('Customer ID cannot be empty');
        }

        const serviceContainer = await getServices();
        const updatedInvoice = await serviceContainer.invoiceService.update(id, value);
        console.log(`Updated invoice: ${id}`);
        return updatedInvoice;
      } catch (error) {
        console.error('Error updating invoice in database:', error);
        throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle project data with TypeORM
    if (storeName === "projectData" && key === "projectData") {
      try {
        // Validate that we're not trying to clear required fields
        if (value.hasOwnProperty('projectNumber') && (!value.projectNumber || value.projectNumber.trim() === '')) {
          throw new Error('Project number cannot be empty');
        }
        if (value.hasOwnProperty('title') && (!value.title || value.title.trim() === '')) {
          throw new Error('Project title cannot be empty');
        }
        if (value.hasOwnProperty('_customerId') && (!value._customerId || value._customerId.trim() === '')) {
          throw new Error('Customer ID cannot be empty');
        }

        const serviceContainer = await getServices();

        // Handle tasks separately if they're included in the update
        if (value.tasks && Array.isArray(value.tasks)) {
          const {tasks, ...projectDataWithoutTasks} = value;

          // Update project first
          await serviceContainer.projectService.update(id, projectDataWithoutTasks);

          // Handle tasks - create new ones or update existing ones
          for (const taskData of tasks) {
            if (!taskData._id) {
              // New task - create it
              console.log('Creating new task with data:', {...taskData, _projectId: id});

              // Remove taskNumber from taskData to force auto-generation
              const {taskNumber, ...taskDataWithoutNumber} = taskData;

              await serviceContainer.taskService.create({
                ...taskDataWithoutNumber,
                _projectId: id
              });
            } else {
              // Existing task - update it and handle work logs
              const {workLogs, ...taskDataWithoutWorkLogs} = taskData;

              await serviceContainer.taskService.update(taskData._id, {
                ...taskDataWithoutWorkLogs,
                _projectId: id
              });

              // Handle work logs if provided
              if (workLogs && Array.isArray(workLogs)) {
                // Get existing work logs for this task
                const existingWorkLogs = await serviceContainer.workLogService.findByTaskId(taskData._id);
                const existingWorkLogIds = existingWorkLogs.map(wl => wl._id);
                const incomingWorkLogIds = workLogs.filter(wl => wl._id).map(wl => wl._id);

                // Delete work logs that are no longer in the incoming array
                const workLogsToDelete = existingWorkLogIds.filter(id => !incomingWorkLogIds.includes(id));
                for (const workLogId of workLogsToDelete) {
                  await serviceContainer.workLogService.delete(workLogId);
                }

                // Create or update work logs
                for (const workLogData of workLogs) {
                  if (!workLogData._id) {
                    // New work log - create it
                    await serviceContainer.workLogService.create({
                      ...workLogData,
                      _taskId: taskData._id
                    });
                  } else {
                    // Existing work log - update it
                    await serviceContainer.workLogService.update(workLogData._id, {
                      ...workLogData,
                      _taskId: taskData._id
                    });
                  }
                }
              }
            }
          }

          // Return updated project with tasks
          const updatedProject = await serviceContainer.projectService.findById(id);
          console.log(`Updated project with tasks: ${id}`);
          return updatedProject;
        } else {
          const updatedProject = await serviceContainer.projectService.update(id, value);
          console.log(`Updated project: ${id}`);
          return updatedProject;
        }
      } catch (error) {
        console.error('Error updating project in database:', error);
        throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fall back to existing store for other data
    const targetStore = stores[storeName] || null;
    if (targetStore === null) {
      throw new Error(`Requested not existing store "${storeName}".`);
    }

    targetStore.update(key, id, value);
  });

  ipcMain.handle("storeRemoveSingle", async (_, storeName, key, id) => {
    // Validate input parameters
    if (!storeName || !key || !id) {
      throw new Error('Store name, key, and ID are required');
    }

    // Handle customer data with TypeORM
    if (storeName === "customerData" && key === "customerData") {
      try {
        const serviceContainer = await getServices();

        // Check if customer exists before deletion
        const existingCustomer = await serviceContainer.customerService.findById(id);
        if (!existingCustomer) {
          throw new Error(`Customer with ID ${id} not found`);
        }

        await serviceContainer.customerService.delete(id);
        console.log(`Deleted customer: ${id}`);
        return true;
      } catch (error) {
        console.error('Error removing customer from database:', error);
        throw new Error(`Failed to remove customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle invoice data with TypeORM
    if (storeName === "invoiceData" && key === "invoiceData") {
      try {
        const serviceContainer = await getServices();

        // Check if invoice exists before deletion
        const existingInvoice = await serviceContainer.invoiceService.findById(id);
        if (!existingInvoice) {
          throw new Error(`Invoice with ID ${id} not found`);
        }

        await serviceContainer.invoiceService.delete(id);
        console.log(`Deleted invoice: ${id}`);
        return true;
      } catch (error) {
        console.error('Error removing invoice from database:', error);
        throw new Error(`Failed to remove invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle project data with TypeORM
    if (storeName === "projectData" && key === "projectData") {
      try {
        const serviceContainer = await getServices();

        // Check if project exists before deletion
        const existingProject = await serviceContainer.projectService.findById(id);
        if (!existingProject) {
          throw new Error(`Project with ID ${id} not found`);
        }

        await serviceContainer.projectService.delete(id);
        console.log(`Deleted project: ${id}`);
        return true;
      } catch (error) {
        console.error('Error removing project from database:', error);
        throw new Error(`Failed to remove project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fall back to existing store for other data
    const targetStore = stores[storeName] || null;
    if (targetStore === null) {
      throw new Error(`Requested not existing store "${storeName}".`);
    }

    return targetStore.removeSingle(key, id);
  });

  ipcMain.handle("fileManagerGetInvoice", (_, fileName, isDraft) => {
    const userDataPath = app.getPath("userData");

    return fileManager.getFileBase64(
      path.join(
        userDataPath,
        "ease-pm-data",
        isDraft ? "invoices-draft" : "invoices"
      ),
      fileName
    );
  });

  ipcMain.handle("fileManagerGetFileBase64", (_, absoluteFilePtah) => {
    return fileManager.getAbsoluteFileBase64(absoluteFilePtah);
  });

  ipcMain.handle(
    "writeInvoiceDocument",
    async (_, invoiceId: string): Promise<string> => {
      const personalData: PersonalData =
        stores["personalData"].get("personalData");
      const invoiceSettings: InvoiceSettings =
        stores["invoiceData"].get("invoiceSettings");

      // Get invoice from database
      const serviceContainer = await getServices();
      const invoice: Invoice = await serviceContainer.invoiceService.findById(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice with ID ${invoiceId} not found`);
      }
      const customer: Customer = invoice.customer;
      if (!customer) {
        throw new Error(`Customer with ID ${invoice._customerId} not found`);
      }

      const exportDirectory = path.join(
        app.getPath("userData"),
        "ease-pm-data",
        invoice.draft ? "invoices-draft" : "invoices"
      );

      await createInvoicePdf(
        {
          font: {
            size: invoiceSettings.fontSize,
            default: invoiceSettings.defaultFont,
            bold: invoiceSettings.boldFont,
            sizeSmall: invoiceSettings.fontSizeSmall,
          },
          seller: {
            name: personalData.firstName + " " + personalData.lastName,
            address: personalData.address,
            zip: personalData.zip,
            city: personalData.city,
            country: personalData.country,
            taxNumber: personalData.taxNumber,
            email: personalData.email,
            banking: {
              bank: personalData.banking.bank,
              iban: personalData.banking.iban,
              bic: personalData.banking.bic,
            },
          },
          buyer: {
            company: customer.company,
            name: customer.firstName + " " + customer.lastName,
            address: customer.address,
            zip: customer.zip,
            city: customer.city,
            customerNumber: customer.customerNumber,
          },
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: formatUnixTimestampToGermanDate(invoice.invoiceDate),
          deliveryDate: formatUnixTimestampToGermanDate(invoice.deliveryDate),
          title: invoiceSettings.title,
          introText: invoiceSettings.introText,
          outroText: invoiceSettings.outroText,
          taxHint: invoiceSettings.taxHint,
          paymentNote: invoiceSettings.paymentNote,
          signature: invoiceSettings.signature,
          total: invoice.total,
          lineItems: invoice.lineItems.map((lineItem: InvoiceLineItem) => {
            return {
              qty: lineItem.quantity,
              description: lineItem.description,
              unit: lineItem.unit,
              unitPrice: lineItem.unitPrice,
              unitTotal: lineItem.unitTotal,
              title: lineItem.title,
            };
          }),
          logo: invoiceSettings.logo || "",
        },
        exportDirectory,
        invoice.draft
      );

      return path.join(exportDirectory, `${invoice.invoiceNumber}.pdf`);
    }
  );

  ipcMain.handle(
    "createTimeSheetReportCsvString",
    async (_, filter: TimesheetFilter) => {
      try {
        return await createTimeSheetReportCsvString(filter);
      } catch (error) {
        console.error('Error creating timesheet CSV:', error);
        throw new Error(`Failed to create timesheet CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );

  ipcMain.handle("createTimeSheetReportData", async (_, filter: TimesheetFilter) => {
    try {
      return await createTimeSheetReportData(filter);
    } catch (error) {
      console.error('Error creating timesheet data:', error);
      throw new Error(`Failed to create timesheet data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  ipcMain.handle("getAppVersion", () => {
    return app.getVersion();
  });

  ipcMain.handle("dialog:openFile", async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return null;
    }

    return await openFileDialog(win);
  });

  ipcMain.handle('readImage', async (_event, filePath: string) => {
    const buffer = await fs.readFile(filePath);
    const base64 = buffer.toString('base64');
    const mimeType = 'image/png'; // or determine from file extension
    return `data:${mimeType};base64,${base64}`;
  });

  ipcMain.handle('getMonthlyAnalytics', async (_event, year?: number) => {
    try {
      const targetYear = year || new Date().getFullYear();
      const serviceContainer = await getServices();
      const projects = await serviceContainer.projectService.findAll();
      const monthlyTotals = new Array(12).fill(0);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      projects.forEach((project) => {
        if (!project.tasks || !Array.isArray(project.tasks) || project.tasks.length === 0) {
          return;
        }
        project.tasks.forEach((task) => {
          if (!task.workLogs || !Array.isArray(task.workLogs)) {
            return;
          }
          task.workLogs.forEach((workLog) => {
            if (!workLog.displayDateTime || !workLog.trackedTime) {
              return;
            }
            const logDate = new Date(workLog.displayDateTime * 1000);
            const logYear = logDate.getFullYear();
            if (logYear === targetYear) {
              const monthIndex = logDate.getMonth(); // 0-11
              const hoursWorked = workLog.trackedTime / 3600; // Convert seconds to hours
              monthlyTotals[monthIndex] += hoursWorked;
            }
          });
        });
      });

      // Format and return response data
      return monthNames.map((month, index) => ({
        month: month,
        hours: Math.round(monthlyTotals[index] * 100) / 100 // Round to 2 decimal places
      }));
    } catch (error) {
      console.error('[Analytics] Error fetching monthly analytics:', error);
      throw new Error(`Failed to fetch analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Test database reset handler - only available in test environment
  ipcMain.handle('test:resetDatabase', async () => {
    if (!config.isTest) {
      throw new Error('Database reset is only available in test environment');
    }

    try {
      await resetTestDatabase();
      // Clear services to force re-initialization
      services = null;
      return {success: true, message: 'Test database reset successfully'};
    } catch (error) {
      console.error('Error resetting test database:', error);
      throw new Error(`Failed to reset test database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
