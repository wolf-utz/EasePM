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
