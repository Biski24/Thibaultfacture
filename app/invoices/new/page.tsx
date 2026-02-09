'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState, ChangeEvent } from 'react';
import { InvoiceFormLine } from '@/lib/types';
import { computeTotals } from '@/lib/calc';
import { createInvoiceWithClient } from '@/lib/store';
import { COMPANY } from '@/lib/company';

const emptyLine: InvoiceFormLine = { description: 'Prestation de services', qty: 1, unit: 'unité', unit_price: 0 };

export default function NewInvoicePage() {
  const router = useRouter();
  const [client, setClient] = useState({ name: '', address: '', email: '', phone: '' });
  const [company, setCompany] = useState({ ...COMPANY });
  const [invoice, setInvoice] = useState({
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    reference: '',
    notes: '',
    tva_enabled: false,
    tva_rate: 20
  });
  const [lines, setLines] = useState<InvoiceFormLine[]>([{ ...emptyLine, description: 'Prestation de services' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => computeTotals(lines, invoice.tva_enabled, invoice.tva_rate), [lines, invoice]);

  const updateLine = (index: number, payload: Partial<InvoiceFormLine>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...payload } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const session = typeof window !== 'undefined' ? localStorage.getItem('session_user') : null;
    if (!session) {
      router.replace('/login');
      return;
    }

    if (!client.name) return setError('Client requis');
    if (lines.length === 0 || lines.some((l) => !l.description || l.qty <= 0 || l.unit_price < 0)) {
      return setError('Ajoute au moins une ligne valide (quantité > 0, prix >= 0).');
    }

    setLoading(true);

    try {
      const id = await createInvoiceWithClient({ client, company, invoice, lines });
      router.push(`/invoices/${id}`);
    } catch (err: any) {
      setError(err?.message || 'Enregistrement impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Créer une facture</h1>
      </div>

      <form id="invoice-form" className="space-y-6" onSubmit={handleSubmit}>
        <Section title="Entreprise">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nom / Raison sociale" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} required />
            <Input label="SIRET" value={company.siret} onChange={(v) => setCompany({ ...company, siret: v })} />
            <Input label="Téléphone" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
            <Input label="Email" type="email" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
            <Input label="Adresse" value={company.address} onChange={(v) => setCompany({ ...company, address: v })} className="md:col-span-2" />
            <Input label="Logo (URL)" value={company.logo_url} onChange={(v) => setCompany({ ...company, logo_url: v })} className="md:col-span-2" />
          </div>
        </Section>

        <Section title="Client">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nom / Raison sociale" value={client.name} onChange={(v) => setClient({ ...client, name: v })} required />
            <Input label="Email" type="email" value={client.email} onChange={(v) => setClient({ ...client, email: v })} />
            <Input label="Téléphone" value={client.phone} onChange={(v) => setClient({ ...client, phone: v })} />
            <Input label="Adresse" value={client.address} onChange={(v) => setClient({ ...client, address: v })} className="md:col-span-2" />
          </div>
        </Section>

        <Section title="Facture">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Date" type="date" value={invoice.issue_date} onChange={(v) => setInvoice({ ...invoice, issue_date: v })} required />
            <Input label="Échéance" type="date" value={invoice.due_date} onChange={(v) => setInvoice({ ...invoice, due_date: v })} />
            <Input label="Référence chantier" value={invoice.reference} onChange={(v) => setInvoice({ ...invoice, reference: v })} />
          </div>
        </Section>

        <Section title="Lignes">
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <Input
                    label="Désignation"
                    value={line.description}
                    onChange={(v) => updateLine(idx, { description: v })}
                    placeholder="Carottage / perçage"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Quantité"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={line.qty}
                    onChange={(v) => updateLine(idx, { qty: Number(v) })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Input label="Unité" value={line.unit} onChange={(v) => updateLine(idx, { unit: v })} />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Prix unitaire"
                    type="number"
                    min={0}
                    step={0.01}
                    value={line.unit_price}
                    onChange={(v) => updateLine(idx, { unit_price: Number(v) })}
                    required
                  />
                </div>
                <div className="md:col-span-1 flex items-center justify-end pb-2">
                  {lines.length > 1 && (
                    <button type="button" className="text-red-600 text-sm" onClick={() => removeLine(idx)}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              + Ajouter une ligne
            </button>
          </div>
        </Section>

        <Section title="Notes">
          <textarea
            className="input h-24"
            placeholder="Conditions de paiement, notes..."
            value={invoice.notes}
            onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
          />
        </Section>

        <Section title="Récapitulatif">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Sous-total HT</span><span>{formatCurrency(totals.subtotal)}</span></div>
            {invoice.tva_enabled && (
              <div className="flex justify-between">
                <span>TVA ({invoice.tva_rate}%)</span>
                <span>{formatCurrency(totals.tvaAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg">
              <span>Total {invoice.tva_enabled ? 'TTC' : 'HT'}</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
            {!invoice.tva_enabled && (
              <p className="text-xs text-slate-600 pt-1">TVA non applicable, art. 293 B du CGI</p>
            )}
          </div>
        </Section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end pt-2">
          <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer & générer'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  className = '',
  onChange,
  ...rest
}: {
  label: string;
  className?: string;
  onChange?: (value: string) => void;
  [key: string]: any;
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value);
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="label">{label}</span>
      <input className="input" onChange={handleChange} {...rest} />
    </label>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);
}
