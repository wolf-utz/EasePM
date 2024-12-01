import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import Store from "./store.js";
import FileManager from "./file-manager.js";
import { createInvoicePdf } from "./pdf-invoice-generator.js";
import {
  Customer,
  Invoice,
  InvoiceSettings,
  LineItem,
  PersonalData,
} from "./types.js";
import { formatUnixTimestampToGermanDate } from "./util/timestamp-date-util.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stores = {
  personalData: new Store({ configName: "personal-data", defaults: {} }),
  customerData: new Store({ configName: "customer-data", defaults: {} }),
  invoiceData: new Store({ configName: "invoice-data", defaults: {} }),
  projectData: new Store({ configName: "project-data", defaults: {} }),
};
const fileManager: FileManager = new FileManager();

ipcMain.handle("storeSet", (_, storeName, key, value) => {
  const targetStore = stores[storeName] || null;
  if (targetStore === null) {
    throw new Error(`Requested not existing store "${storeName}".`);
  }

  targetStore.set(key, value);
});

ipcMain.handle("storeGet", (_, storeName, key) => {
  const targetStore = stores[storeName] || null;
  if (targetStore === null) {
    throw new Error(`Requested not existing store "${storeName}".`);
  }

  return targetStore.get(key);
});

ipcMain.handle("storeGetSingle", (_, storeName, key, id) => {
  const targetStore = stores[storeName] || null;
  if (targetStore === null) {
    throw new Error(`Requested not existing store "${storeName}".`);
  }

  return targetStore.getSingle(key, id);
});

ipcMain.handle("storeAdd", (_, storeName, key, value) => {
  const targetStore = stores[storeName] || null;
  if (targetStore === null) {
    throw new Error(`Requested not existing store "${storeName}".`);
  }

  targetStore.add(key, value);
});

ipcMain.handle("storeUpdate", (_, storeName, key, id, value) => {
  const targetStore = stores[storeName] || null;
  if (targetStore === null) {
    throw new Error(`Requested not existing store "${storeName}".`);
  }

  targetStore.update(key, id, value);
});

ipcMain.handle("storeRemoveSingle", (_, storeName, key, id) => {
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

ipcMain.handle(
  "writeInvoiceDocument",
  async (_, invoiceId: string): Promise<string> => {
    const personalData: PersonalData =
      stores["personalData"].get("personalData");
    const invoiceSettings: InvoiceSettings =
      stores["invoiceData"].get("invoiceSettings");
    const invoice: Invoice = stores["invoiceData"].getSingle(
      "invoiceData",
      invoiceId
    );
    const customer: Customer = stores["customerData"].getSingle(
      "customerData",
      invoice._customerId
    );
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
        lineItems: invoice.lineItems.map((lineItem: LineItem) => {
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

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
    width: 1024,
    height: 940,
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
  // win.removeMenu();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
