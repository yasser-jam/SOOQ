/**
 * Currency formatter for SOOQ.
 *
 * Currency is a tenant-level setting (SRS DSN-010 / CUR module). Blocks must
 * NEVER hardcode "USD". Default to SYP per SRS §1.4 (Syria-first market).
 * The web/mobile renderer should pass `currency` from store_config theme.
 */
export function formatPrice(
  amount: number,
  currency: string = "SYP",
  locale: string = "ar-SY"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "SYP" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}
