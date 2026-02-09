'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { InvoiceWithRelations } from '@/lib/types';
import { generateInvoicePdf } from '@/lib/pdf';
import { listInvoices, updateInvoiceStatus, deleteInvoice, duplicateInvoice } from '@/lib/store';
import { useRouter } from 'next/navigation';

type YearGroup = {
  year: string;
  invoices: InvoiceWithRelations[];
  total: number;
  paid: number;
  pending: number;
};

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

  const groupedByYear = useMemo<YearGroup[]>(() => {
    const map = new Map<string, YearGroup>();

    for (const inv of invoices) {
      const year = new Date(inv.issue_date).getFullYear().toString();
      const current = map.get(year) || { year, invoices: [], total: 0, paid: 0, pending: 0 };
      current.invoices.push(inv);
      current.total += Number(inv.total_ttc) || 0;
      if (inv.status === 'paid') current.paid += 1;
      else current.pending += 1;
      map.set(year, current);
    }

    return Array.from(map.values()).sort((a, b) => Number(b.year) - Number(a.year));
  }, [invoices]);

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
      <div className="space-y-3 sm:hidden">
        <h1 className="text-2xl font-semibold">Historique des factures</h1>
        <Link className="btn btn-primary w-full" href="/invoices/new">Nouvelle facture</Link>
      </div>

      <div className="hidden items-center justify-between sm:flex">
        <h1 className="text-2xl font-semibold">Historique des factures</h1>
        <Link className="btn btn-primary" href="/invoices/new">Nouvelle facture</Link>
      </div>

      <div className="card p-4 sm:hidden">
        {loading && <p className="py-4 text-center">Chargement...</p>}
        {!loading && invoices.length === 0 && <p className="py-4 text-center text-slate-500">Aucune facture</p>}

        <div className="space-y-3">
          {!loading && invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{inv.number}</p>
                <span className={`badge ${inv.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                  {inv.status === 'paid' ? 'Payée' : 'En attente'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{inv.client.name}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</span>
                <span className="font-medium">{formatCurrency(inv.total_ttc)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <Link className="text-accent" href={`/invoices/${inv.id}`}>Voir</Link>
                <button className="text-accent" onClick={() => generateInvoicePdf(inv)}>PDF</button>
                <button className="text-accent" onClick={() => duplicate(inv)}>Dupliquer</button>
                <button className="text-accent" onClick={() => updateStatus(inv.id, inv.status === 'paid' ? 'pending' : 'paid')}>
                  {inv.status === 'paid' ? 'Marquer impayée' : 'Marquer payée'}
                </button>
                <button className="text-red-600" onClick={() => remove(inv.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden card overflow-x-auto sm:block">
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

      <div className="card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">Historique par année</h2>
        <p className="mt-1 text-sm text-slate-600">Regroupement automatique des factures et du CA par année civile.</p>

        {loading && <p className="pt-4 text-sm text-slate-600">Chargement...</p>}
        {!loading && groupedByYear.length === 0 && <p className="pt-4 text-sm text-slate-600">Aucune donnée annuelle.</p>}

        <div className="mt-4 space-y-3">
          {!loading && groupedByYear.map((group, index) => (
            <details key={group.year} className="rounded-lg border border-slate-200 p-3" open={index === 0}>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold">{group.year}</p>
                  <p className="text-sm font-medium">CA: {formatCurrency(group.total)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {group.invoices.length} facture(s) • {group.paid} payée(s) • {group.pending} en attente
                </p>
              </summary>

              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {group.invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <div className="min-w-[12rem]">
                      <p className="font-medium">{inv.number}</p>
                      <p className="text-slate-600">{inv.client.name}</p>
                    </div>
                    <p className="text-slate-600">{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</p>
                    <p className="font-medium">{formatCurrency(inv.total_ttc)}</p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
}
