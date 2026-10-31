-- CreateTable
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    order_id TEXT,
    listing_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_buyer_id_fkey') THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_buyer_id_fkey
      FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_seller_id_fkey') THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES public.seller_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_messages_body_len') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT chk_messages_body_len
      CHECK (char_length(body) BETWEEN 1 AND 2000);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_ctx_uq
  ON public.conversations (buyer_id, seller_id, COALESCE(order_id, ''), COALESCE(listing_id, ''));

CREATE INDEX IF NOT EXISTS messages_conv_created
  ON public.messages (conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
