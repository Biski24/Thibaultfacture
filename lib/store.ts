'use client';
import { InvoiceFormLine, InvoiceStatus, InvoiceWithRelations } from './types';

type Client = {
  id: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at: string;
};

type Invoice = Omit<InvoiceWithRelations, 'client' | 'lines'>;

type InvoiceLine = {
  id: string;
  invoice_id: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  line_total: number;
};

type StoreData = {
  clients: Client[];
  invoices: Invoice[];
  lines: InvoiceLine[];
  counters: Record<string, number>; // per year
  seeded: boolean;
};

const STORAGE_KEY = 'facturation_mvp_store';

function load(): StoreData {
  if (typeof window === 'undefined') return { clients: [], invoices: [], lines: [], counters: {}, seeded: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clients: [], invoices: [], lines: [], counters: {}, seeded: false };
    const parsed = JSON.parse(raw);
    return { seeded: false, ...parsed };
  } catch {
    return { clients: [], invoices: [], lines: [], counters: {}, seeded: false };
  }
}

function save(data: StoreData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureSample() {
  const data = load();
  if (data.seeded) return;
  if (data.invoices.length > 0) {
    data.seeded = true;
    save(data);
    return;
  }
  const clientId = crypto.randomUUID();
  data.clients.push({
    id: clientId,
    name: 'Société Démo',
    address: '12 Rue des Chantiers\n75000 Paris',
    email: 'client@demo.fr',
    phone: '0600000000',
    created_at: new Date().toISOString()
  });
  const invoiceId = crypto.randomUUID();
  const year = new Date().getFullYear();
  data.counters[String(year)] = 1;
  data.invoices.push({
    id: invoiceId,
    number: `${year}-0001`,
    client_id: clientId,
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: null,
    reference: 'CHANTIER-001',
    notes: 'Merci de régler sous 30 jours.',
    company_name: 'Auto-entreprise BTP',
    company_address: '45 Avenue du Progrès\n69000 Lyon',
    company_phone: '0700000000',
    company_email: 'contact@btp.fr',
    company_siret: '12345678900011',
    company_logo_url: null,
    subtotal_ht: 300,
    tva_enabled: false,
    tva_rate: null,
    tva_amount: null,
    total_ttc: 300,
    status: 'pending',
    created_at: new Date().toISOString()
  });
  data.lines.push({
    id: crypto.randomUUID(),
    invoice_id: invoiceId,
    description: 'Carottage béton',
    qty: 2,
    unit: 'unité',
    unit_price: 150,
    line_total: 300
  });
  data.seeded = true;
  save(data);
}

export async function listInvoices(): Promise<InvoiceWithRelations[]> {
  ensureSample();
  const data = load();
  return data.invoices
    .sort((a, b) => (a.issue_date > b.issue_date ? -1 : 1))
    .map((inv) => toRelation(inv, data));
}

export async function getInvoice(id: string): Promise<InvoiceWithRelations | null> {
  ensureSample();
  const data = load();
  const inv = data.invoices.find((i) => i.id === id);
  if (!inv) return null;
  return toRelation(inv, data);
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  const data = load();
  const inv = data.invoices.find((i) => i.id === id);
  if (inv) {
    inv.status = status;
    save(data);
  }
}

export async function deleteInvoice(id: string) {
  const data = load();
  data.lines = data.lines.filter((l) => l.invoice_id !== id);
  data.invoices = data.invoices.filter((i) => i.id !== id);
  save(data);
}

export async function duplicateInvoice(id: string) {
  const data = load();
  const inv = data.invoices.find((i) => i.id === id);
  if (!inv) return null;
  const year = new Date().getFullYear();
  const number = nextNumber(data, year);
  const newId = crypto.randomUUID();
  data.invoices.push({ ...inv, id: newId, number, issue_date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString(), status: 'pending' });
  data.lines
    .filter((l) => l.invoice_id === id)
    .forEach((l) => data.lines.push({ ...l, id: crypto.randomUUID(), invoice_id: newId }));
  save(data);
  return newId;
}

export async function createInvoiceWithClient(params: {
  client: { name: string; address?: string; email?: string; phone?: string };
  company: { name?: string; address?: string; phone?: string; email?: string; siret?: string; logo_url?: string };
  invoice: { issue_date: string; due_date?: string; reference?: string; notes?: string; tva_enabled: boolean; tva_rate: number };
  lines: InvoiceFormLine[];
}) {
  const { client, company, invoice, lines } = params;
  const data = load();

  // find or create client by email if provided, else by name
  let clientId = data.clients.find((c) => (client.email && c.email?.toLowerCase() === client.email.toLowerCase()) || c.name === client.name)?.id;
  if (!clientId) {
    clientId = crypto.randomUUID();
    data.clients.push({
      id: clientId,
      name: client.name,
      address: client.address || null,
      email: client.email || null,
      phone: client.phone || null,
      created_at: new Date().toISOString()
    });
  }

  const year = new Date(invoice.issue_date || Date.now()).getFullYear();
  const number = nextNumber(data, year);
  const id = crypto.randomUUID();
  const subtotal = lines.reduce((acc, l) => acc + l.qty * l.unit_price, 0);
  const tvaAmount = invoice.tva_enabled ? (subtotal * invoice.tva_rate) / 100 : 0;
  const total = subtotal + tvaAmount;

  data.invoices.push({
    id,
    number,
    client_id: clientId,
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
    created_at: new Date().toISOString()
  });

  lines.forEach((l) => {
    data.lines.push({
      id: crypto.randomUUID(),
      invoice_id: id,
      description: l.description,
      qty: l.qty,
      unit: l.unit,
      unit_price: l.unit_price,
      line_total: l.qty * l.unit_price
    });
  });

  save(data);
  return id;
}

function nextNumber(data: StoreData, year: number) {
  const key = String(year);
  const next = (data.counters[key] || 0) + 1;
  data.counters[key] = next;
  return `${year}-${String(next).padStart(4, '0')}`;
}

function toRelation(inv: Invoice, data: StoreData): InvoiceWithRelations {
  const client = data.clients.find((c) => c.id === inv.client_id)!;
  const lines = data.lines.filter((l) => l.invoice_id === inv.id);
  return { ...inv, client, lines } as InvoiceWithRelations;
}
