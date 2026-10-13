import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_SEED_PASSWORD = "password123";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!url || !serviceKey || !dbUrl) {
    throw new Error("Missing Supabase URL, Service Key, or Database URL");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const pool = new Pool({ connectionString: dbUrl });
  const { rows: users } = await pool.query(
    'SELECT id, email, role FROM public.users;'
  );
  await pool.end();

  console.log(`Found ${users.length} users in public.users`);

  const { data: existingAuth } = await supabase.auth.admin.listUsers({
    perPage: 100,
  });
  const existingMap = new Map(
    existingAuth?.users?.map((u) => [u.email?.toLowerCase(), u])
  );

  for (const u of users) {
    const emailLower = u.email.toLowerCase();
    const existing = existingMap.get(emailLower);

    if (existing) {
      console.log(`User ${u.email} already in Supabase Auth (${existing.id})`);
      // Ensure password is password123 and email is confirmed
      await supabase.auth.admin.updateUserById(existing.id, {
        password: DEFAULT_SEED_PASSWORD,
        email_confirm: true,
        user_metadata: { role: u.role.toLowerCase(), sub: existing.id },
      });
      console.log(`Updated password and confirmed email for ${u.email}`);
    } else {
      console.log(`Creating user ${u.email} with id ${u.id} in Supabase Auth...`);
      const { data, error } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password: DEFAULT_SEED_PASSWORD,
        email_confirm: true,
        user_metadata: { role: u.role.toLowerCase(), sub: u.id },
      });
      if (error) {
        console.error(`Failed to create ${u.email}:`, error);
      } else {
        console.log(`Created ${u.email} successfully (${data.user.id})`);
      }
    }
  }

  console.log("All seed users synced successfully to Supabase Auth!");
}

main().catch(console.error);
