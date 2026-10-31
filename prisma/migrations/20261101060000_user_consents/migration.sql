-- CreateTable
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    document TEXT NOT NULL,
    version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash TEXT
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_consents_user_id_fkey') THEN
    ALTER TABLE public.user_consents
      ADD CONSTRAINT user_consents_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_consents_doc') THEN
    ALTER TABLE public.user_consents
      ADD CONSTRAINT chk_user_consents_doc
      CHECK (document IN ('terms','privacy','seller_agreement'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_consents_user_id_document_version_key
  ON public.user_consents (user_id, document, version);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
