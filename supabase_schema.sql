-- ===================================================
-- WEEKEND QUEST — SUPABASE DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (supabase.com)
-- ===================================================

-- 1. Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  initials text not null,
  avatar_color text default '#FF6A5B',
  city text default 'Seattle, WA',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger to auto-create profile on auth.user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, initials, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'initials', upper(substring(split_part(new.email, '@', 1), 1, 2))),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#FF6A5B')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Groups Table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  tagline text default 'Weekend circle',
  emoji text default '🌮',
  accent text default '#FF6A5B',
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.groups enable row level security;
create policy "Groups are viewable by all members" on public.groups for select using (true);
create policy "Authenticated users can create groups" on public.groups for insert with check (auth.role() = 'authenticated');

-- 3. Group Members
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;
create policy "Group members are viewable by authenticated users" on public.group_members for select using (true);
create policy "Users can join groups" on public.group_members for insert with check (auth.role() = 'authenticated');

-- 4. Quest Ideas (Idea Board)
create table if not exists public.quest_ideas (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null check (category in ('food', 'outdoor', 'games', 'culture', 'adventure')),
  time_slot text not null,
  suggested_by text not null,
  suggested_by_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quest_ideas enable row level security;
create policy "Ideas are viewable by everyone" on public.quest_ideas for select using (true);
create policy "Authenticated users can create ideas" on public.quest_ideas for insert with check (auth.role() = 'authenticated');
create policy "Users can delete their ideas" on public.quest_ideas for delete using (auth.uid() = suggested_by_id);

-- 5. Idea Votes
create table if not exists public.idea_votes (
  id uuid default gen_random_uuid() primary key,
  idea_id uuid references public.quest_ideas(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(idea_id, user_id)
);

alter table public.idea_votes enable row level security;
create policy "Votes are viewable by all" on public.idea_votes for select using (true);
create policy "Authenticated users can vote" on public.idea_votes for insert with check (auth.role() = 'authenticated');
create policy "Users can remove their vote" on public.idea_votes for delete using (auth.uid() = user_id);

-- 6. Idea Comments
create table if not exists public.idea_comments (
  id uuid default gen_random_uuid() primary key,
  idea_id uuid references public.quest_ideas(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.idea_comments enable row level security;
create policy "Comments are viewable by all" on public.idea_comments for select using (true);
create policy "Authenticated users can post comments" on public.idea_comments for insert with check (auth.role() = 'authenticated');

-- 7. Upcoming Confirmed Quests
create table if not exists public.upcoming_quests (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  title text not null,
  date text not null,
  time text not null,
  location text not null,
  address text,
  notes text,
  emoji text default '🎯',
  attending_users jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.upcoming_quests enable row level security;
create policy "Upcoming quests are viewable by all" on public.upcoming_quests for select using (true);
create policy "Authenticated users can update quests" on public.upcoming_quests for all using (auth.role() = 'authenticated');

-- 8. Checklist Items
create table if not exists public.quest_checklist (
  id uuid default gen_random_uuid() primary key,
  quest_id uuid references public.upcoming_quests(id) on delete cascade not null,
  text text not null,
  done boolean default false,
  assigned_to text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quest_checklist enable row level security;
create policy "Checklist items viewable by all" on public.quest_checklist for select using (true);
create policy "Authenticated users can manage checklist" on public.quest_checklist for all using (auth.role() = 'authenticated');

-- 9. Expenses
create table if not exists public.quest_expenses (
  id uuid default gen_random_uuid() primary key,
  quest_id uuid references public.upcoming_quests(id) on delete cascade not null,
  title text not null,
  amount numeric(10, 2) not null,
  paid_by text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.quest_expenses enable row level security;
create policy "Expenses viewable by all" on public.quest_expenses for select using (true);
create policy "Authenticated users can manage expenses" on public.quest_expenses for all using (auth.role() = 'authenticated');

-- Enable Realtime on core collaborative tables!
alter publication supabase_realtime add table public.quest_ideas;
alter publication supabase_realtime add table public.idea_votes;
alter publication supabase_realtime add table public.idea_comments;
alter publication supabase_realtime add table public.upcoming_quests;
