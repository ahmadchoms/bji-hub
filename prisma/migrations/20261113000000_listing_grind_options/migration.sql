-- AlterTable
ALTER TABLE "public"."listings" ADD COLUMN IF NOT EXISTS "grind_options" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
