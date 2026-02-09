import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceWithRelations } from './types';

// Couleurs sobres : noir + vert pour la ligne Total HT (demande explicite)
const BLACK: [number, number, number] = [20, 20, 20];
const GREY: [number, number, number] = [90, 90, 90];
const GREEN: [number, number, number] = [34, 139, 34];

export function generateInvoicePdf(invoice: InvoiceWithRelations) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFont('helvetica', 'normal'); // Arial-like
  const margin = 55;
  let y = 70;

  // Émetteur (haut gauche)
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  textBlock(doc, invoice.company_name || '—', margin, y, 260);
  y += 14;
  textBlock(doc, invoice.company_address || '—', margin, y, 260);
  y += 14;
  if (invoice.company_phone) {
    doc.text(`Tel : ${invoice.company_phone}`, margin, y);
    y += 14;
  }
  if (invoice.company_siret) {
    doc.text(`SIRET : ${invoice.company_siret}`, margin, y);
    y += 14;
  }

  // Client (haut droit)
  const rightX = 360;
  let yClient = 70;
  textBlock(doc, invoice.client.name, rightX, yClient, 220);
  yClient += 14;
  if (invoice.client.address) {
    textBlock(doc, invoice.client.address, rightX, yClient, 220);
    yClient += 14;
  }

  // Date + numéro
  y = Math.max(y, yClient) + 24;
  doc.text(`Le ${formatDate(invoice.issue_date)}`, margin, y);
  y += 16;
  doc.setFontSize(12);
  const title = `FACTURE N° ${invoice.number}`;
  doc.text(title, margin, y);
  const titleWidth = doc.getTextWidth(title);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 2, margin + titleWidth, y + 2);

  // Tableau
  const tableStart = y + 28;
  const rows = invoice.lines.map((l) => [l.description, l.qty.toString(), formatCurrency(l.line_total)]);
  while (rows.length < 8) rows.push(['', '', '']);
  const totalRow = ['', 'Total HT', formatCurrency(invoice.total_ttc)];

  autoTable(doc, {
    startY: tableStart,
    head: [['DESIGNATION', 'QUANTITÉ', 'MONTANT HT']],
    body: rows,
    foot: [totalRow],
    styles: { fontSize: 10, textColor: BLACK, lineWidth: 0.5, lineColor: BLACK },
    headStyles: { fillColor: [255, 255, 255], textColor: BLACK, fontStyle: 'bold', lineWidth: 0.8, lineColor: BLACK },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    footStyles: { fontStyle: 'bold', lineWidth: 0.8, lineColor: BLACK, fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 260 },
      1: { cellWidth: 100, halign: 'center' },
      2: { cellWidth: 100, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    theme: 'grid'
  });

  // Totaux et mentions
  const finalY = (doc as any).lastAutoTable.finalY + 24;
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('TVA non applicable – article 293B du CGI', margin, finalY);
  doc.setTextColor(...GREEN);
  doc.text(`Total HT : ${formatCurrency(invoice.total_ttc)}`, margin + 360, finalY);
  doc.setTextColor(...BLACK);
  doc.text(`Total à payer HT : ${formatCurrency(invoice.total_ttc)}`, margin, finalY + 16);

  // Notes
  if (invoice.notes) {
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(`Notes : ${invoice.notes}`, margin, finalY + 34, { maxWidth: 500, lineHeightFactor: 1.4 });
  }

  doc.save(`facture-${invoice.number}.pdf`);
}

function formatCurrency(value: number | string) {
  const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
  return formatted.replace(/[\u00A0\u202F]/g, ' ');
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
}

function textBlock(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  doc.text(text, x, y, { maxWidth });
}
