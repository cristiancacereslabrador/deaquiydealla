/**
 * Formatea centimos de euro a moneda localizada.
 *
 * @param cents - Importe en céntimos (entero).
 * @param locale - Código BCP 47 (`es`, `en`, …).
 * @returns Cadena tipo `12,50 €` o `€12.50` según locale.
 */
export function formatCentsToCurrency(cents: number, locale: string): string {
  const amount = Math.round(cents) / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
