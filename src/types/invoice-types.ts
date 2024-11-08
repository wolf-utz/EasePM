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
