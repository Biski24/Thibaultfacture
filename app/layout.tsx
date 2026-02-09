import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Facture Thibaud',
  description: 'Création et suivi de factures pour BARUCCHI Thibaud.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50">
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-3 sm:hidden">
              <Link href="/dashboard" className="mb-3 block text-base font-semibold text-primary">
                Facture Thibaud
              </Link>
              <nav className="flex items-center justify-between gap-3 text-sm text-slate-600">
                <Link href="/invoices" className="hover:text-primary">Historique</Link>
                <Link href="/invoices/new" className="hover:text-primary">Nouvelle facture</Link>
              </nav>
            </div>

            <div className="mx-auto hidden h-14 max-w-6xl items-center justify-between px-4 sm:flex">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
                <span>Facture Thibaud</span>
              </Link>
              <nav className="flex items-center gap-4 text-sm text-slate-600">
                <Link href="/invoices" className="hover:text-primary">Historique</Link>
                <Link href="/invoices/new" className="hover:text-primary">Nouvelle facture</Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
