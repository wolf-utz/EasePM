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
