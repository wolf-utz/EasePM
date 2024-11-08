import { Customer } from "../types/forms/customer-types";
import { Invoice } from "../types/invoice-types";

export default async function generateInvoiceNumber({
  _customerId,
}: Invoice): Promise<string> {
  // @ts-ignore
  const ipcRenderer: ElectronApi = window.ipcRenderer;

  const customer = await fetchCustomer(_customerId);
  const invoices = await fetchInvoices();

  const suffix =
    invoices.filter((i) => i._customerId === customer._id).length + 1;

  const prefix =
    `RE${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${prefix}${year}${month}${day}${suffix}`;
}

async function fetchCustomer(customerId: string): Promise<Customer> {
  // @ts-ignore
  const ipcRenderer: ElectronApi = window.ipcRenderer;
  return (await ipcRenderer.invoke(
    "storeGetSingle",
    "customerData",
    "customerData",
    customerId
  )) as Customer;
}

async function fetchInvoices(): Promise<Invoice[]> {
  // @ts-ignore
  const ipcRenderer: ElectronApi = window.ipcRenderer;
  return (await ipcRenderer.invoke(
    "storeGet",
    "invoiceData",
    "invoiceData"
  )) as Invoice[];
}
