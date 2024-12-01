import { Customer } from "../types/forms/customer-types";
import { Project } from "../types/project-types";

export default async function generateProjectNumber({
  _customerId,
}: Project): Promise<string> {
  const customer = await fetchCustomer(_customerId);
  const projects = await fetchProjects();
  const prefix =
    `PJ${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
  const suffix =
    projects.filter((p) => p._customerId === customer._id).length + 1;

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

async function fetchProjects(): Promise<Project[]> {
  // @ts-ignore
  const ipcRenderer: ElectronApi = window.ipcRenderer;
  return (await ipcRenderer.invoke(
    "storeGet",
    "projectData",
    "projectData"
  )) as Project[];
}
