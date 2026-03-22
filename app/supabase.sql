-- SentinelAI Users Table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Example: Incidents Table (if you want to store incidents in Supabase)
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  attack_type text,
  severity text,
  source text,
  ip text,
  timestamp timestamp with time zone default timezone('utc', now()),
  ai_explanation text,
  root_cause text,
  recommended_action text,
  status text
);

-- Enable Row Level Security (RLS) for users table
alter table users enable row level security;

-- Enable RLS for incidents table
alter table incidents enable row level security;
