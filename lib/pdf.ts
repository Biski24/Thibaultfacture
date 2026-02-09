import jsPDF from 'jspdf';
import autoTable, { CellDef } from 'jspdf-autotable';
import { InvoiceWithRelations } from './types';

// Palette de couleurs professionnelle
const COLORS = {
  primary: [41, 128, 185] as [number, number, number],      // Bleu professionnel
  secondary: [52, 73, 94] as [number, number, number],      // Gris foncé élégant
  accent: [46, 204, 113] as [number, number, number],       // Vert moderne
  text: [44, 62, 80] as [number, number, number],           // Texte principal
  textLight: [127, 140, 141] as [number, number, number],   // Texte secondaire
  border: [189, 195, 199] as [number, number, number],      // Bordures subtiles
  background: [236, 240, 241] as [number, number, number],  // Fond léger
};

export function generateInvoicePdf(invoice: InvoiceWithRelations) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;

  // HEADER AVEC BANDEAU DE COULEUR
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 120, 'F');

  // Logo/Nom de l'entreprise en blanc
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.company_name || 'ENTREPRISE', margin, 50);

  // Numéro de facture stylisé
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const invoiceLabel = `FACTURE N° ${invoice.number}`;
  const labelWidth = doc.getTextWidth(invoiceLabel);
  doc.text(invoiceLabel, pageWidth - margin - labelWidth, 50);

  // Date
  doc.setFontSize(10);
  const dateText = `Date: ${formatDate(invoice.issue_date)}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, pageWidth - margin - dateWidth, 70);

  // INFORMATIONS ÉMETTEUR ET CLIENT
  let y = 140;

  // Carte émetteur (gauche)
  drawInfoCard(doc, {
    title: 'ÉMETTEUR',
    x: margin,
    y: y,
    width: 240,
    lines: [
      invoice.company_name || '',
      invoice.company_address || '',
      invoice.company_phone ? `Tél: ${invoice.company_phone}` : '',
      invoice.company_siret ? `SIRET: ${invoice.company_siret}` : '',
    ].filter(Boolean),
  });

  // Carte client (droite)
  drawInfoCard(doc, {
    title: 'CLIENT',
    x: pageWidth - margin - 240,
    y: y,
    width: 240,
    lines: [
      invoice.client.name,
      invoice.client.address || '',
    ].filter(Boolean),
  });

  // TABLEAU DES LIGNES
  const tableY = y + 140;

  const rows = invoice.lines.map((line) => [
    line.description,
    line.qty.toString(),
    formatCurrency(line.line_total),
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [['DÉSIGNATION', 'QTÉ', 'MONTANT HT']],
    body: rows,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 12,
      lineColor: COLORS.border,
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: COLORS.background,
      textColor: COLORS.secondary,
      fontStyle: 'bold',
      fontSize: 11,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 300 },
      1: { cellWidth: 80, halign: 'center' as const },
      2: { cellWidth: 110, halign: 'right' as const },
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      // Ligne de séparation après l'en-tête
      if (data.section === 'head' && data.row.index === 0) {
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(2);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
  });

  // TOTAUX SIMPLIFIÉS
  const finalY = (doc as any).lastAutoTable.finalY + 24;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.text(`Total HT : ${formatCurrency(invoice.total_ttc)}`, margin, finalY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text(`TOTAL À PAYER : ${formatCurrency(invoice.total_ttc)}`, margin, finalY + 18);
  doc.setFont('helvetica', 'normal');

  // MENTIONS LÉGALES ET NOTES
  let mentionsY = finalY + 40;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.textLight);
  doc.text('TVA non applicable – article 293B du CGI', margin, mentionsY);

  if (invoice.notes) {
    mentionsY += 25;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Notes:', margin, mentionsY);
    mentionsY += 12;
    doc.setTextColor(...COLORS.text);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(splitNotes, margin, mentionsY);
  }

  // FOOTER
  const footerY = pageHeight - 30;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textLight);
  doc.setFont('helvetica', 'normal');
  const footerText = `${invoice.company_name || ''} | ${invoice.company_siret ? 'SIRET: ' + invoice.company_siret : ''}`;
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, (pageWidth - footerWidth) / 2, footerY);

  // Sauvegarde
  doc.save(`facture-${invoice.number}.pdf`);
}

// UTILITAIRES

function drawInfoCard(
  doc: jsPDF,
  config: { title: string; x: number; y: number; width: number; lines: string[] }
) {
  const { title, x, y, width, lines } = config;
  const lineHeight = 14;
  const padding = 12;
  // Calculer la hauteur totale en tenant compte des retours à la ligne
  let totalLines = 1; // Pour le titre
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  lines.forEach((line) => {
    if (line) {
      const splitLine = doc.splitTextToSize(line, width - padding * 2);
      totalLines += splitLine.length;
    }
  });

  const height = padding * 2 + lineHeight * totalLines;

  // Fond de la carte
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(x, y, width, height, 3, 3, 'F');

  // Bordure gauche colorée
  doc.setFillColor(...COLORS.primary);
  doc.rect(x, y, 4, height, 'F');

  // Titre
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.secondary);
  doc.text(title, x + padding, y + padding + 10);

  // Contenu
  let lineY = y + padding + 10 + lineHeight;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  lines.forEach((line) => {
    if (line) {
      const splitLine = doc.splitTextToSize(line, width - padding * 2);
      doc.text(splitLine, x + padding, lineY);
      lineY += lineHeight * splitLine.length;
    }
  });
}

function formatCurrency(value: number | string): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value) || 0);
  return formatted.replace(/[\u00A0\u202F]/g, ' ');
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
}
