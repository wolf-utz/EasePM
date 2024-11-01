import { Customer } from "../types/forms/customer-types";

export default function generateCustomer({
  firstName,
  lastName,
}: Customer): string {
  const prefix = `${firstName[0]}${lastName[0]}`.toUpperCase();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${prefix}${year}${month}${day}`;
}
