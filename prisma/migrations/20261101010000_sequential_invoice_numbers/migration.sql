-- CreateTable
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
    period TEXT PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

-- AlterTable
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS orders_invoice_number_uq
    ON public.orders (invoice_number)
    WHERE invoice_number IS NOT NULL;
