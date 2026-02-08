'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InvoiceWithRelations } from '@/lib/types';
import { generateInvoicePdf } from '@/lib/pdf';
import { listInvoices, updateInvoiceStatus, deleteInvoice, duplicateInvoice } from '@/lib/store';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await listInvoices();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: 'paid' | 'pending') => {
    await updateInvoiceStatus(id, status);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer la facture ?')) return;
    await deleteInvoice(id);
    load();
  };

  const duplicate = async (invoice: InvoiceWithRelations) => {
    await duplicateInvoice(invoice.id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Historique des factures</h1>
        <Link className="btn btn-primary" href="/invoices/new">Nouvelle facture</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="table-header">Numéro</th>
              <th className="table-header">Client</th>
              <th className="table-header">Date</th>
              <th className="table-header">Total</th>
              <th className="table-header">Statut</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="p-4 text-center">Chargement...</td></tr>
            )}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Aucune facture</td></tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{inv.number}</td>
                <td>{inv.client.name}</td>
                <td>{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</td>
                <td>{formatCurrency(inv.total_ttc)}</td>
                <td>
                  <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {inv.status === 'paid' ? 'Payée' : 'En attente'}
                  </span>
                </td>
                <td className="space-x-2 text-sm">
                  <Link className="text-accent" href={`/invoices/${inv.id}`}>Voir</Link>
                  <button className="text-accent" onClick={() => generateInvoicePdf(inv)}>PDF</button>
                  <button className="text-accent" onClick={() => duplicate(inv)}>Dupliquer</button>
                  <button className="text-accent" onClick={() => updateStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')}>
                    {inv.status === 'paid' ? 'Marquer impayée' : 'Marquer payée'}
                  </button>
                  <button className="text-red-600" onClick={() => remove(inv.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
}
