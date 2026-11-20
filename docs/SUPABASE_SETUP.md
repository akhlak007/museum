# Supabase Setup

1. Create a hosted Supabase project.
2. Run migrations in `supabase/migrations` followed by `supabase/seed.sql` through the Supabase CLI or SQL editor.
3. Enable email/password authentication and create test users through Supabase Auth.
4. Insert matching `profiles` rows. Assign `security_agent` by default; assign `admin` only through a trusted administrative process.
5. Copy `.env.example` to `.env.local` and provide only the project URL and public anonymous key.
6. Restart Vite and confirm the login screen reports “Supabase connected”.

Never place the service-role key in browser configuration, source files, screenshots, logs, or commits. The public anonymous key is suitable for frontend use only with correctly tested Row Level Security policies.
