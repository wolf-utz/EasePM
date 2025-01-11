export interface BankingInfo {
  iban: string;
  bic: string;
  bank: string;
}

export interface PersonalData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  email: string;
  banking: BankingInfo;
  taxId: string;
  taxNumber: string;
}

export interface LineItem {
  quantity: number;
  title: string;
  description: string;
  unit: string;
  unitPrice: number;
  unitTotal: number;
}

export interface Invoice {
  _id: string;
  _customerId: string;
  draft: boolean;
  canceled: boolean;
  billed: boolean;
  total: number;
  invoiceNumber: string;
  invoiceDate: number;
  deliveryDate: number;
  lineItems: LineItem[];
}

export interface InvoiceSettings {
  defaultFont: string;
  boldFont: string;
  fontSize: number;
  fontSizeSmall: number;
  title: string;
  introText: string;
  paymentNote: string;
  taxHint: string;
  outroText: string;
  signature: string;
  logo: string;
}

export interface Customer {
  _id: string;
  customerNumber: string;
  company: string | null;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

export interface TimesheetFilter {
  startDate: number;
  endDate: number;
  _customerId: string;
  _projectId: string;
}

export enum ProjectState {
  OPEN = "OPEN",
  IN_PROGESS = "IN PROGESS",
  DONE = "DONE",
}
export enum TaskState {
  OPEN = "OPEN",
  IN_PROGRESS = "IN PROGRESS",
  PAUSED = "PAUSED",
  QA = "QA",
  DONE = "DONE",
}

export interface WorkLog {
  creationDateTime: number;
  displayDateTime: number;
  message: string;
  trackedTime: number;
  billable: boolean;
}

export interface Task {
  taskNumber: string;
  title: string;
  description: string;
  state: string;
  creationDateTime: number;
  updatedDateTime: number;
  workLogs: WorkLog[];
}

export interface Project {
  _id: string;
  _customerId: string;
  title: string;
  projectNumber: string;
  description: string;
  state: string;
  creationDateTime: number;
  taskAutoIncrement: number;
  tasks: Task[];
}
