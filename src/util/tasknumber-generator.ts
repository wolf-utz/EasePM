import { Customer } from "../types/forms/customer-types";
import { Project } from "../types/project-types";

export default async function generateTaskNumber({
  _customerId,
  taskAutoIncrement,
}: Project): Promise<string> {
  const customer = await fetchCustomer(_customerId);
  const prefix =
    `T${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
  const suffix = taskAutoIncrement.toString();

  return `${prefix}${suffix}`;
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
