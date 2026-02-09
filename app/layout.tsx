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
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:h-14 sm:flex-nowrap sm:py-0">
              <Link href="/dashboard" className="flex items-center gap-2 text-base font-semibold text-primary sm:text-lg">
                <span>Facture Thibaud</span>
              </Link>
              <nav className="flex w-full flex-wrap items-center gap-3 text-sm text-slate-600 sm:w-auto sm:justify-end sm:gap-4">
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
