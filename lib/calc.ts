import { InvoiceFormLine } from './types';

export function computeTotals(lines: InvoiceFormLine[], tvaEnabled: boolean, tvaRate: number) {
  const subtotal = lines.reduce((acc, line) => acc + line.qty * line.unit_price, 0);
  const tvaAmount = tvaEnabled ? (subtotal * tvaRate) / 100 : 0;
  const total = subtotal + tvaAmount;
  return { subtotal, tvaAmount, total };
}
