export interface BankingInfo {
  iban: string;
  bic: string;
  bank: string;
}

export interface PersonalFormData {
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
