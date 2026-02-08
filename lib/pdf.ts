import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceWithRelations } from './types';

export function generateInvoicePdf(invoice: InvoiceWithRelations) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const margin = 40;
  const startY = 60;

  doc.setFontSize(18);
  doc.text('FACTURE', margin, startY);
  doc.setFontSize(12);
  doc.text(`N° ${invoice.number}`, margin, startY + 18);
  doc.text(`Date : ${formatDate(invoice.issue_date)}`, margin, startY + 34);
  if (invoice.due_date) doc.text(`Échéance : ${formatDate(invoice.due_date)}`, margin, startY + 50);

  const companyY = startY;
  doc.setFontSize(12);
  doc.text('Entreprise', 350, companyY);
  doc.setFontSize(10);
  if (invoice.company_name) doc.text(invoice.company_name, 350, companyY + 14);
  if (invoice.company_address) doc.text(invoice.company_address, 350, companyY + 28, { maxWidth: 180 });
  if (invoice.company_email) doc.text(invoice.company_email, 350, companyY + 42);
  if (invoice.company_phone) doc.text(invoice.company_phone, 350, companyY + 56);
  if (invoice.company_siret) doc.text(`SIRET: ${invoice.company_siret}`, 350, companyY + 70);

  const clientY = startY + 90;
  doc.setFontSize(12);
  doc.text('Client', margin, clientY);
  doc.setFontSize(10);
  doc.text(invoice.client.name, margin, clientY + 14);
  if (invoice.client.address) doc.text(invoice.client.address, margin, clientY + 28);
  if (invoice.client.email) doc.text(invoice.client.email, margin, clientY + 42);
  if (invoice.client.phone) doc.text(invoice.client.phone, margin, clientY + 56);

  const tableStart = clientY + 80;
  autoTable(doc, {
    startY: tableStart,
    head: [['Description', 'Qté', 'Unité', 'PU HT', 'Total HT']],
    body: invoice.lines.map((l) => [
      l.description,
      l.qty.toString(),
      l.unit,
      formatCurrency(l.unit_price),
      formatCurrency(l.line_total)
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;
  const subtotalTextY = finalY;
  doc.text(`Sous-total HT : ${formatCurrency(invoice.subtotal_ht)}`, margin, subtotalTextY);
  if (invoice.tva_enabled) {
    doc.text(`TVA (${invoice.tva_rate ?? 0}%) : ${formatCurrency(invoice.tva_amount ?? 0)}`, margin, subtotalTextY + 16);
    doc.text(`Total TTC : ${formatCurrency(invoice.total_ttc)}`, margin, subtotalTextY + 32);
  } else {
    doc.text(`Total HT : ${formatCurrency(invoice.total_ttc)}`, margin, subtotalTextY + 16);
  }

  if (invoice.notes) doc.text(`Notes : ${invoice.notes}`, margin, subtotalTextY + 60, { maxWidth: 500 });

  doc.save(`facture-${invoice.number}.pdf`);
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
}
