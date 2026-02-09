'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InvoiceWithRelations } from '@/lib/types';
import { generateInvoicePdf } from '@/lib/pdf';
import { listInvoices, updateInvoiceStatus, deleteInvoice, duplicateInvoice } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const session = typeof window !== 'undefined' ? localStorage.getItem('session_user') : null;
    if (!session) {
      router.replace('/login');
      return;
    }
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Historique des factures</h1>
        <Link className="btn btn-primary w-full sm:w-auto" href="/invoices/new">Nouvelle facture</Link>
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
                <td className="py-3 font-medium whitespace-nowrap">{inv.number}</td>
                <td className="whitespace-nowrap">{inv.client.name}</td>
                <td className="whitespace-nowrap">{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</td>
                <td className="whitespace-nowrap">{formatCurrency(inv.total_ttc)}</td>
                <td>
                  <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {inv.status === 'paid' ? 'Payée' : 'En attente'}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex min-w-[18rem] flex-wrap gap-x-3 gap-y-1 text-sm">
                    <Link className="text-accent" href={`/invoices/${inv.id}`}>Voir</Link>
                    <button className="text-accent" onClick={() => generateInvoicePdf(inv)}>PDF</button>
                    <button className="text-accent" onClick={() => duplicate(inv)}>Dupliquer</button>
                    <button className="text-accent" onClick={() => updateStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')}>
                      {inv.status === 'paid' ? 'Marquer impayée' : 'Marquer payée'}
                    </button>
                    <button className="text-red-600" onClick={() => remove(inv.id)}>Supprimer</button>
                  </div>
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
