-- Migration: 20261101070000_coffee_features_and_bundles
-- Implements WS-D features: Bundles (D2), Harvest Calendar (D4), Editorial Picks (D5),
-- Smart Reminders (D6), Roastery Profiles & Multi-dim Reviews (D8), Brew Recipes (D3),
-- B2B Price Tiers & Green Bean Specs (D9).

-- 1. Listings kind & Bundle Items (D2)
ALTER TABLE "public"."listings" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'single';

CREATE TABLE IF NOT EXISTS "public"."bundle_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bundle_listing_id" TEXT NOT NULL,
    "child_listing_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bundle_items_bundle_listing_id_child_listing_id_key" UNIQUE ("bundle_listing_id", "child_listing_id"),
    CONSTRAINT "bundle_items_bundle_listing_id_fkey" FOREIGN KEY ("bundle_listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bundle_items_child_listing_id_fkey" FOREIGN KEY ("child_listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."bundle_items" ENABLE ROW LEVEL SECURITY;

-- 2. Coffee Origins harvest months (D4)
ALTER TABLE "public"."coffee_origins" ADD COLUMN IF NOT EXISTS "harvest_months" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "public"."coffee_origins" ADD COLUMN IF NOT EXISTS "main_harvest_months" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- 3. Editorial Picks (D5)
CREATE TABLE IF NOT EXISTS "public"."editorial_picks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" TEXT NOT NULL,
    "curator_user_id" TEXT,
    "note" TEXT,
    "cupped_on" DATE,
    "score" DECIMAL(4,2),
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editorial_picks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "editorial_picks_listing_id_key" UNIQUE ("listing_id"),
    CONSTRAINT "editorial_picks_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "editorial_picks_curator_user_id_fkey" FOREIGN KEY ("curator_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
ALTER TABLE "public"."editorial_picks" ENABLE ROW LEVEL SECURITY;

-- 4. Notification Preferences & Reminder Log (D6)
CREATE TABLE IF NOT EXISTS "public"."notification_prefs" (
    "user_id" TEXT NOT NULL,
    "reminders" BOOLEAN NOT NULL DEFAULT true,
    "email_reminders" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_prefs_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "notification_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."notification_prefs" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "public"."reminder_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_log_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reminder_log_order_id_kind_key" UNIQUE ("order_id", "kind"),
    CONSTRAINT "reminder_log_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."reminder_log" ENABLE ROW LEVEL SECURITY;

-- 5. Seller Profile enhancements (D8)
ALTER TABLE "public"."seller_profiles" ADD COLUMN IF NOT EXISTS "roastery_story" TEXT;
ALTER TABLE "public"."seller_profiles" ADD COLUMN IF NOT EXISTS "equipment" TEXT;
ALTER TABLE "public"."seller_profiles" ADD COLUMN IF NOT EXISTS "roast_philosophy" TEXT;
ALTER TABLE "public"."seller_profiles" ADD COLUMN IF NOT EXISTS "photo_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "public"."seller_profiles" ADD COLUMN IF NOT EXISTS "direct_trade_verified_at" TIMESTAMPTZ(3);

-- 6. Multi-dimensional Reviews & Review Votes (D8)
ALTER TABLE "public"."reviews" ADD COLUMN IF NOT EXISTS "aroma_score" INTEGER;
ALTER TABLE "public"."reviews" ADD COLUMN IF NOT EXISTS "flavor_score" INTEGER;
ALTER TABLE "public"."reviews" ADD COLUMN IF NOT EXISTS "value_score" INTEGER;
ALTER TABLE "public"."reviews" ADD COLUMN IF NOT EXISTS "brew_method" TEXT;

CREATE TABLE IF NOT EXISTS "public"."review_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_votes_review_id_user_id_key" UNIQUE ("review_id", "user_id"),
    CONSTRAINT "review_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."review_votes" ENABLE ROW LEVEL SECURITY;

-- 7. Community Brew Recipes & Recipe Votes (D3)
CREATE TABLE IF NOT EXISTS "public"."brew_recipes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "dose_grams" DECIMAL(5,2) NOT NULL,
    "water_ml" DECIMAL(6,2) NOT NULL,
    "temp_c" DECIMAL(4,1),
    "brew_time_seconds" INTEGER,
    "grind_size" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brew_recipes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "brew_recipes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "brew_recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."brew_recipes" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "public"."brew_recipe_votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brew_recipe_votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "brew_recipe_votes_recipe_id_user_id_key" UNIQUE ("recipe_id", "user_id"),
    CONSTRAINT "brew_recipe_votes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."brew_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "brew_recipe_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."brew_recipe_votes" ENABLE ROW LEVEL SECURITY;

-- 8. B2B Price Tiers, Green Bean Specs & Inquiries (D9)
CREATE TABLE IF NOT EXISTS "public"."price_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" TEXT NOT NULL,
    "min_qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "price_tiers_listing_id_min_qty_key" UNIQUE ("listing_id", "min_qty"),
    CONSTRAINT "price_tiers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."price_tiers" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "public"."green_bean_specs" (
    "listing_id" TEXT NOT NULL,
    "screen_size" TEXT,
    "moisture_pct" DECIMAL(4,2),
    "density_gl" DECIMAL(6,2),
    "water_activity" DECIMAL(4,3),
    "primary_defects" INTEGER,
    "secondary_defects" INTEGER,
    "coa_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "green_bean_specs_pkey" PRIMARY KEY ("listing_id"),
    CONSTRAINT "green_bean_specs_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "public"."green_bean_specs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."inquiries" ADD COLUMN IF NOT EXISTS "kind" TEXT DEFAULT 'inquiry';
ALTER TABLE "public"."inquiries" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending';
ALTER TABLE "public"."inquiries" ADD COLUMN IF NOT EXISTS "quoted_price" DECIMAL(14,2);
ALTER TABLE "public"."inquiries" ADD COLUMN IF NOT EXISTS "quote_valid_until" TIMESTAMPTZ(3);
