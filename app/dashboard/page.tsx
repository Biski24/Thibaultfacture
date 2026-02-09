'use client';
import { useEffect, useState } from 'react';
import { InvoiceWithRelations } from '@/lib/types';
import Link from 'next/link';
import { listInvoices } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [totals, setTotals] = useState({ count: 0, pending: 0, paid: 0, revenue: 0 });
  const [latest, setLatest] = useState<InvoiceWithRelations[]>([]);

  useEffect(() => {
    const session = typeof window !== 'undefined' ? localStorage.getItem('session_user') : null;
    if (!session) {
      router.replace('/login');
      return;
    }
    const load = async () => {
      const invoices = await listInvoices();
      const revenue = invoices.reduce((acc, i) => acc + i.total_ttc, 0);
      const pending = invoices.filter((i) => i.status === 'pending').length;
      const paid = invoices.filter((i) => i.status === 'paid').length;
      setTotals({ count: invoices.length, pending, paid, revenue });
      setLatest(invoices.slice(0, 5));
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <StatCard label="Factures" value={totals.count} />
        <StatCard label="En attente" value={totals.pending} />
        <StatCard label="Payées" value={totals.paid} />
        <StatCard label="CA" value={formatCurrency(totals.revenue)} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Dernières factures</h2>
          <Link className="btn btn-primary" href="/invoices/new">Créer</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="table-header">Numéro</th>
                <th className="table-header">Client</th>
                <th className="table-header">Date</th>
                <th className="table-header">Total</th>
                <th className="table-header">Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {latest.map((inv) => (
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
                  <td className="text-right">
                    <Link className="text-accent" href={`/invoices/${inv.id}`}>
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
              {latest.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    Aucune facture pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4 w-64">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
}
