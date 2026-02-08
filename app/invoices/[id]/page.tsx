'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InvoiceWithRelations } from '@/lib/types';
import { generateInvoicePdf } from '@/lib/pdf';
import { getInvoice } from '@/lib/store';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getInvoice(id);
      setInvoice(data);
    };
    if (id) load();
  }, [id]);

  if (!invoice) return <p>Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facture {invoice.number}</h1>
          <p className="text-slate-500">Émise le {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => router.push('/invoices')}>Retour</button>
          <button className="btn btn-primary" onClick={() => generateInvoicePdf(invoice)}>Télécharger PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Entreprise">
          <p className="font-medium">{invoice.company_name || '—'}</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.company_address}</p>
          <p className="text-sm text-slate-600">{invoice.company_email}</p>
          <p className="text-sm text-slate-600">{invoice.company_phone}</p>
          {invoice.company_siret && <p className="text-sm text-slate-600">SIRET: {invoice.company_siret}</p>}
        </InfoCard>
        <InfoCard title="Client">
          <p className="font-medium">{invoice.client.name}</p>
          <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.client.address}</p>
          <p className="text-sm text-slate-600">{invoice.client.email}</p>
          <p className="text-sm text-slate-600">{invoice.client.phone}</p>
        </InfoCard>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="table-header">Description</th>
              <th className="table-header">Qté</th>
              <th className="table-header">Unité</th>
              <th className="table-header">PU HT</th>
              <th className="table-header">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="py-3">{l.description}</td>
                <td>{l.qty}</td>
                <td>{l.unit}</td>
                <td>{formatCurrency(l.unit_price)}</td>
                <td>{formatCurrency(l.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span>Sous-total HT</span><span>{formatCurrency(invoice.subtotal_ht)}</span></div>
        {invoice.tva_enabled && (
          <div className="flex justify-between"><span>TVA ({invoice.tva_rate}%)</span><span>{formatCurrency(invoice.tva_amount || 0)}</span></div>
        )}
        <div className="flex justify-between font-semibold text-lg">
          <span>Total {invoice.tva_enabled ? 'TTC' : 'HT'}</span>
          <span>{formatCurrency(invoice.total_ttc)}</span>
        </div>
        {invoice.notes && <p className="text-slate-600 pt-2">{invoice.notes}</p>}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 space-y-1">
      <h2 className="text-sm font-semibold uppercase text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
}
