import { supabase } from './supabaseClient';
import { InvoiceFormLine, InvoiceStatus, InvoiceWithRelations } from './types';

function db() {
  if (!supabase) {
    throw new Error(
      'Supabase non configuré. Renseigne NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local puis relance npm run dev.'
    );
  }
  return supabase as any;
}

// Liste les factures avec client + lignes
export async function listInvoices(): Promise<InvoiceWithRelations[]> {
  const { data, error } = await db()
    .from('invoices')
    .select('*, client:clients(*), lines:invoice_lines(*)')
    .order('issue_date', { ascending: false });
  if (error || !data) throw error;
  return data as unknown as InvoiceWithRelations[];
}

export async function getInvoice(id: string): Promise<InvoiceWithRelations | null> {
  const { data, error } = await db()
    .from('invoices')
    .select('*, client:clients(*), lines:invoice_lines(*)')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as unknown as InvoiceWithRelations;
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const { error } = await db().from('invoices').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteInvoice(id: string) {
  // cascade handle lines
  const { error } = await db().from('invoices').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateInvoice(id: string) {
  const original = await getInvoice(id);
  if (!original) return null;
  const { data, error } = await db()
    .from('invoices')
    .insert({
      client_id: original.client_id,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: original.due_date,
      reference: original.reference,
      notes: original.notes,
      company_name: original.company_name,
      company_address: original.company_address,
      company_phone: original.company_phone,
      company_email: original.company_email,
      company_siret: original.company_siret,
      company_logo_url: original.company_logo_url,
      subtotal_ht: original.subtotal_ht,
      tva_enabled: original.tva_enabled,
      tva_rate: original.tva_rate,
      tva_amount: original.tva_amount,
      total_ttc: original.total_ttc,
      status: 'pending',
    })
    .select()
    .single();
  if (error || !data) throw error;
  const lines = original.lines.map((l) => ({
    invoice_id: data.id,
    description: l.description,
    qty: l.qty,
    unit: l.unit,
    unit_price: l.unit_price,
    line_total: l.line_total,
  }));
  await db().from('invoice_lines').insert(lines);
  return data.id;
}

export async function createInvoiceWithClient(params: {
  client: { name: string; address?: string; email?: string; phone?: string };
  company: { name?: string; address?: string; phone?: string; email?: string; siret?: string; logo_url?: string };
  invoice: {
    number?: string;
    issue_date: string;
    due_date?: string;
    reference?: string;
    notes?: string;
    tva_enabled: boolean;
    tva_rate: number;
  };
  lines: InvoiceFormLine[];
}) {
  const { client, company, invoice, lines } = params;
  // client
  const { data: cData, error: cErr } = await db()
    .from('clients')
    .insert({
      name: client.name,
      address: client.address,
      email: client.email,
      phone: client.phone,
    })
    .select()
    .single();
  if (cErr || !cData) throw cErr;

  const subtotal = lines.reduce((acc, l) => acc + l.qty * l.unit_price, 0);
  const tvaAmount = invoice.tva_enabled ? (subtotal * invoice.tva_rate) / 100 : 0;
  const total = subtotal + tvaAmount;

  const { data: inv, error: invErr } = await db()
    .from('invoices')
    .insert({
      number: invoice.number?.trim() || null,
      client_id: cData.id,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date || null,
      reference: invoice.reference || null,
      notes: invoice.notes || null,
      company_name: company.name || null,
      company_address: company.address || null,
      company_phone: company.phone || null,
      company_email: company.email || null,
      company_siret: company.siret || null,
      company_logo_url: company.logo_url || null,
      subtotal_ht: subtotal,
      tva_enabled: invoice.tva_enabled,
      tva_rate: invoice.tva_enabled ? invoice.tva_rate : null,
      tva_amount: invoice.tva_enabled ? tvaAmount : null,
      total_ttc: total,
      status: 'pending',
    })
    .select()
    .single();
  if (invErr || !inv) throw invErr;

  const linesPayload = lines.map((l) => ({
    invoice_id: inv.id,
    description: l.description,
    qty: l.qty,
    unit: l.unit,
    unit_price: l.unit_price,
    line_total: l.qty * l.unit_price,
  }));
  const { error: lErr } = await db().from('invoice_lines').insert(linesPayload);
  if (lErr) throw lErr;

  return inv.id;
}

export async function updateInvoiceFull(params: {
  invoiceId: string;
  client: { id: string; name: string; address?: string; email?: string; phone?: string };
  company: { name?: string; address?: string; phone?: string; email?: string; siret?: string; logo_url?: string };
  invoice: { issue_date: string; due_date?: string; reference?: string; notes?: string; tva_enabled: boolean; tva_rate: number };
  lines: InvoiceFormLine[];
}) {
  const { invoiceId, client, company, invoice, lines } = params;
  const subtotal = lines.reduce((acc, l) => acc + l.qty * l.unit_price, 0);
  const tvaAmount = invoice.tva_enabled ? (subtotal * invoice.tva_rate) / 100 : 0;
  const total = subtotal + tvaAmount;

  await db().from('clients').update({
    name: client.name,
    address: client.address,
    email: client.email,
    phone: client.phone,
  }).eq('id', client.id);

  await db().from('invoices').update({
    issue_date: invoice.issue_date,
    due_date: invoice.due_date || null,
    reference: invoice.reference || null,
    notes: invoice.notes || null,
    company_name: company.name || null,
    company_address: company.address || null,
    company_phone: company.phone || null,
    company_email: company.email || null,
    company_siret: company.siret || null,
    company_logo_url: company.logo_url || null,
    subtotal_ht: subtotal,
    tva_enabled: invoice.tva_enabled,
    tva_rate: invoice.tva_enabled ? invoice.tva_rate : null,
    tva_amount: invoice.tva_enabled ? tvaAmount : null,
    total_ttc: total,
  }).eq('id', invoiceId);

  await db().from('invoice_lines').delete().eq('invoice_id', invoiceId);
  const linesPayload = lines.map((l) => ({
    invoice_id: invoiceId,
    description: l.description,
    qty: l.qty,
    unit: l.unit,
    unit_price: l.unit_price,
    line_total: l.qty * l.unit_price,
  }));
  await db().from('invoice_lines').insert(linesPayload);
}
