export function formatCurrency(cents: number): string {
  const euros: number = cents / 100;
  const formattedCurrency: string = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(euros);

  return formattedCurrency;
}
