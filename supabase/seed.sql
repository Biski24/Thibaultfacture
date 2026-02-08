-- Sample client
insert into public.clients (id, name, address, email, phone)
values (
  uuid_generate_v4(),
  'Société Démo',
  '12 Rue des Chantiers\n75000 Paris',
  'client@demo.fr',
  '0600000000'
) on conflict do nothing;

-- Reuse the inserted client
with c as (
  select id from public.clients limit 1
)
insert into public.invoices (
  client_id, issue_date, due_date, reference, notes,
  company_name, company_address, company_phone, company_email, company_siret,
  subtotal_ht, tva_enabled, total_ttc, status
)
select
  c.id,
  current_date,
  current_date + interval '30 days',
  'CHANTIER-001',
  'Merci de régler sous 30 jours.',
  'Auto-entreprise BTP',
  '45 Avenue du Progrès\n69000 Lyon',
  '0700000000',
  'contact@btp.fr',
  '12345678900011',
  300.00,
  false,
  300.00,
  'pending'
from c;

-- Lines for the invoice just created (latest)
insert into public.invoice_lines (invoice_id, description, qty, unit, unit_price, line_total)
select i.id, 'Carottage béton', 2, 'unité', 150.00, 300.00
from public.invoices i
order by created_at desc
limit 1;
