'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InvoiceFormLine, InvoiceWithRelations } from '@/lib/types';
import { generateInvoicePdf } from '@/lib/pdf';
import { getInvoice, updateInvoiceFull } from '@/lib/store';
import { computeTotals } from '@/lib/calc';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null);
  const [edit, setEdit] = useState(false);
  const [client, setClient] = useState({ name: '', address: '', email: '', phone: '' });
  const [company, setCompany] = useState({ name: '', address: '', phone: '', email: '', siret: '', logo_url: '' });
  const [form, setForm] = useState({ issue_date: '', due_date: '', reference: '', notes: '', tva_enabled: false, tva_rate: 20 });
  const [lines, setLines] = useState<InvoiceFormLine[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => computeTotals(lines, form.tva_enabled, form.tva_rate), [lines, form]);

  useEffect(() => {
    const load = async () => {
      const data = await getInvoice(id);
      setInvoice(data);
      if (data) {
        setClient({
          name: data.client.name,
          address: data.client.address || '',
          email: data.client.email || '',
          phone: data.client.phone || ''
        });
        setCompany({
          name: data.company_name || '',
          address: data.company_address || '',
          phone: data.company_phone || '',
          email: data.company_email || '',
          siret: data.company_siret || '',
          logo_url: data.company_logo_url || ''
        });
        setForm({
          issue_date: data.issue_date,
          due_date: data.due_date || '',
          reference: data.reference || '',
          notes: data.notes || '',
          tva_enabled: data.tva_enabled,
          tva_rate: data.tva_rate || 20
        });
        setLines(
          data.lines.map((l) => ({
            description: l.description,
            qty: l.qty,
            unit: l.unit,
            unit_price: l.unit_price
          }))
        );
      }
    };
    if (id) load();
  }, [id]);

  if (!invoice) return <p>Chargement...</p>;

  const updateLine = (index: number, payload: Partial<InvoiceFormLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...payload } : l)));
  };

  const handleSave = async () => {
    setError('');
    if (!client.name) return setError('Client requis');
    if (lines.length === 0 || lines.some((l) => !l.description || l.qty <= 0 || l.unit_price < 0)) {
      return setError('Ajoute au moins une ligne valide (quantité > 0, prix >= 0).');
    }
    setSaving(true);
    await updateInvoiceFull({
      invoiceId: invoice.id,
      client: { ...client, id: invoice.client.id },
      company,
      invoice: form,
      lines
    });
    const fresh = await getInvoice(id);
    setInvoice(fresh);
    setEdit(false);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facture {invoice.number}</h1>
          <p className="text-slate-500">Émise le {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => router.push('/invoices')}>Retour</button>
          <button className="btn btn-secondary" onClick={() => setEdit((v) => !v)}>{edit ? 'Annuler' : 'Modifier'}</button>
          <button className="btn btn-primary" onClick={() => generateInvoicePdf(invoice)}>Télécharger PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Entreprise">
          {edit ? (
            <div className="space-y-2">
              <Input label="Nom" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
              <Input label="Adresse" value={company.address} onChange={(v) => setCompany({ ...company, address: v })} />
              <Input label="Téléphone" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
              <Input label="Email" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
              <Input label="Siret" value={company.siret} onChange={(v) => setCompany({ ...company, siret: v })} />
            </div>
          ) : (
            <>
              <p className="font-medium break-words">{invoice.company_name || '—'}</p>
              <p className="text-sm text-slate-600 whitespace-pre-line break-words">{invoice.company_address}</p>
              <p className="text-sm text-slate-600 break-words">{invoice.company_email}</p>
              <p className="text-sm text-slate-600 break-words">{invoice.company_phone}</p>
              {invoice.company_siret && <p className="text-sm text-slate-600 break-words">SIRET: {invoice.company_siret}</p>}
            </>
          )}
        </InfoCard>
        <InfoCard title="Client">
          {edit ? (
            <div className="space-y-2">
              <Input label="Nom" value={client.name} onChange={(v) => setClient({ ...client, name: v })} />
              <Input label="Adresse" value={client.address} onChange={(v) => setClient({ ...client, address: v })} />
              <Input label="Email" value={client.email} onChange={(v) => setClient({ ...client, email: v })} />
              <Input label="Téléphone" value={client.phone} onChange={(v) => setClient({ ...client, phone: v })} />
            </div>
          ) : (
            <>
              <p className="font-medium break-words">{invoice.client.name}</p>
              <p className="text-sm text-slate-600 whitespace-pre-line break-words">{invoice.client.address}</p>
              <p className="text-sm text-slate-600 break-words">{invoice.client.email}</p>
              <p className="text-sm text-slate-600 break-words">{invoice.client.phone}</p>
            </>
          )}
        </InfoCard>
      </div>

      <div className="card p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="table-header">Désignation</th>
              <th className="table-header">Quantité</th>
              <th className="table-header">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {(edit ? lines : invoice.lines).map((l, idx) => (
              <tr key={edit ? idx : (l as any).id ?? idx} className="border-b last:border-0">
                <td className="py-3 break-words">
                  {edit ? (
                    <input
                      className="input"
                      value={l.description}
                      onChange={(e) => updateLine(idx, { description: e.target.value })}
                    />
                  ) : (
                    l.description
                  )}
                </td>
                <td className="break-words">
                  {edit ? (
                    <input
                      className="input"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={l.qty}
                      onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })}
                    />
                  ) : (
                    l.qty
                  )}
                </td>
                <td className="break-words">
                  {edit ? (
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step={0.01}
                      value={l.unit_price}
                      onChange={(e) => updateLine(idx, { unit_price: Number(e.target.value) })}
                    />
                  ) : (
                    formatCurrency((l as any).line_total ?? l.qty * l.unit_price)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span>Sous-total HT</span><span>{formatCurrency(edit ? totals.subtotal : invoice.subtotal_ht)}</span></div>
        {edit ? (
          <></>
        ) : null}
        <div className="flex justify-between font-semibold text-lg">
          <span>Total HT</span>
          <span>{formatCurrency(edit ? totals.total : invoice.total_ttc)}</span>
        </div>
        <p className="text-sm text-slate-600 pt-2">TVA non applicable, art. 293 B du CGI</p>
        {edit ? (
          <textarea
            className="input h-20"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notes"
          />
        ) : (
          invoice.notes && <p className="text-slate-600 pt-2">{invoice.notes}</p>
        )}
      </div>

      {edit && (
        <div className="flex gap-3 justify-end">
          <button className="btn btn-secondary" onClick={() => setEdit(false)}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
        </div>
      )}
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

type InputProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
};

function Input({ label, value, onChange, type = 'text', className = '' }: InputProps) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="label">{label}</span>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
