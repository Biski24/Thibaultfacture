export type InvoiceStatus = 'pending' | 'paid';

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          number: string;
          client_id: string;
          issue_date: string;
          due_date: string | null;
          notes: string | null;
          company_name: string | null;
          company_address: string | null;
          company_phone: string | null;
          company_email: string | null;
          company_siret: string | null;
          company_logo_url: string | null;
          subtotal_ht: number;
          tva_enabled: boolean;
          tva_rate: number | null;
          tva_amount: number | null;
          total_ttc: number;
          status: InvoiceStatus;
          reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          number?: string;
          client_id: string;
          issue_date: string;
          due_date?: string | null;
          notes?: string | null;
          company_name?: string | null;
          company_address?: string | null;
          company_phone?: string | null;
          company_email?: string | null;
          company_siret?: string | null;
          company_logo_url?: string | null;
          subtotal_ht: number;
          tva_enabled: boolean;
          tva_rate?: number | null;
          tva_amount?: number | null;
          total_ttc: number;
          status?: InvoiceStatus;
          reference?: string | null;
          created_at?: string;
        };
      };
      invoice_lines: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          qty: number;
          unit: string;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          qty: number;
          unit: string;
          unit_price: number;
          line_total: number;
        };
      };
    };
  };
}

export type InvoiceWithRelations = Database['public']['Tables']['invoices']['Row'] & {
  client: Database['public']['Tables']['clients']['Row'];
  lines: Database['public']['Tables']['invoice_lines']['Row'][];
};

export interface InvoiceFormLine {
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
}
