-- Extensions
create extension if not exists "uuid-ossp";

-- Clients table
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  number text unique,
  client_id uuid not null references public.clients(id) on delete cascade,
  issue_date date not null,
  due_date date,
  reference text,
  notes text,
  company_name text,
  company_address text,
  company_phone text,
  company_email text,
  company_siret text,
  company_logo_url text,
  subtotal_ht numeric(12,2) not null,
  tva_enabled boolean not null default false,
  tva_rate numeric(5,2),
  tva_amount numeric(12,2),
  total_ttc numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now()
);

-- Invoice lines
create table if not exists public.invoice_lines (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  qty numeric(12,2) not null,
  unit text not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null
);

-- Invoice counters per year
create table if not exists public.invoice_counters (
  year int primary key,
  last_value int not null default 0
);

-- Trigger to auto-generate number in format YYYY-0001
create or replace function public.set_invoice_number()
returns trigger as $$
declare
  yr int := extract(year from coalesce(new.issue_date, now()))::int;
  next_val int;
begin
  if new.number is not null then
    return new;
  end if;

  loop
    insert into public.invoice_counters(year, last_value) values (yr, 1)
      on conflict (year) do update set last_value = public.invoice_counters.last_value + 1
      returning last_value into next_val;
    exit;
  end loop;

  new.number := to_char(yr, 'FM0000') || '-' || to_char(next_val, 'FM0000');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_invoice_number on public.invoices;
create trigger trg_set_invoice_number
before insert on public.invoices
for each row execute procedure public.set_invoice_number();

-- Recommended: disable RLS for MVP (only admin uses anon key)
alter table public.clients disable row level security;
alter table public.invoices disable row level security;
alter table public.invoice_lines disable row level security;
