import {app, BrowserWindow, ipcMain} from "electron";
import path from "node:path";
import {Customer, Invoice, InvoiceSettings, LineItem, PersonalData, TimesheetFilter} from "./types";
import {createInvoicePdf} from "./pdf-invoice-generator";
import {formatUnixTimestampToGermanDate} from "./util/timestamp-date-util";
import {createTimeSheetReportCsvString, createTimeSheetReportData} from "./time-sheet";
import {openFileDialog} from "./io/file-dialog";
import fs from "fs/promises";
import Store from "./store";
import FileManager from "./file-manager";

const stores = {
    personalData: new Store({
        configName: "personal-data",
        defaults: { personalData: [] },
    }),
    customerData: new Store({
        configName: "customer-data",
        defaults: { customerData: [] },
    }),
    invoiceData: new Store({
        configName: "invoice-data",
        defaults: { invoiceData: [] },
    }),
    projectData: new Store({
        configName: "project-data",
        defaults: { projectData: [] },
    }),
};
const fileManager: FileManager = new FileManager();

export function registerIpcHandlers() {

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

    ipcMain.handle(
        "createTimeSheetReportCsvString",
        (_, filter: TimesheetFilter) => {
            return createTimeSheetReportCsvString(filter);
        }
    );

    ipcMain.handle("createTimeSheetReportData", (_, filter: TimesheetFilter) => {
        return createTimeSheetReportData(filter);
    });

    ipcMain.handle("getAppVersion", () => {
        return app.getVersion();
    });

    ipcMain.handle("dialog:openFile", async() => {
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
}
