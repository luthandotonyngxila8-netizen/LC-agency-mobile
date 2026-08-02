-- Finini Dashboard — initial schema
--
-- Single primary user, with per-task access for an occasional helper. That
-- model is baked into the policies below: every row hangs off `owner_id`, and
-- sharing is granted one task at a time.
--
-- IF THE ANSWER TO "WHO USES THIS" TURNS OUT TO BE SEVERAL ADMINISTRATORS,
-- THIS IS WHERE IT CHANGES. You would add an `accounts` table and an
-- `account_members` join table, replace `tasks.owner_id` with `account_id`,
-- and rewrite every policy below to check membership rather than ownership.
-- It is a rewrite of this file, not an addition to it — which is why the
-- question is worth settling before this runs anywhere real.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Supabase creates the auth.users row; this mirrors it into a table we can
-- join against and apply our own policies to.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  title text not null,
  description text not null default '',
  end_state text not null default '',
  start_date date not null,
  end_date date not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_owner_idx on public.tasks (owner_id);

alter table public.tasks enable row level security;

-- ---------------------------------------------------------------------------
-- sharing
--
-- Invitations are by email, because the helper may not have an account yet
-- when the task is shared. `shared_with` resolves to a profile once they sign
-- up; until then the row is an outstanding invitation.
-- ---------------------------------------------------------------------------

create table public.task_shares (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks on delete cascade,
  invitee_email text not null,
  permission text not null check (permission in ('view', 'comment', 'edit')),
  link_token text not null default encode(gen_random_bytes(9), 'hex'),
  invited_at timestamptz not null default now(),
  unique (task_id, invitee_email)
);

create index task_shares_email_idx on public.task_shares (lower(invitee_email));

alter table public.task_shares enable row level security;

-- The signed-in user's permission on a task: 'owner', one of the three share
-- tiers, or null. Written as a function so the policies below read as English
-- rather than repeating the same two subqueries eight times.
create function public.task_permission(target_task uuid)
returns text
language sql
stable
security definer set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.tasks t
      where t.id = target_task and t.owner_id = auth.uid()
    ) then 'owner'
    else (
      select s.permission
      from public.task_shares s
      join public.profiles p on lower(p.email) = lower(s.invitee_email)
      where s.task_id = target_task and p.id = auth.uid()
      limit 1
    )
  end;
$$;

create policy "owner manages own tasks"
  on public.tasks for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "shared users read a task"
  on public.tasks for select
  using (public.task_permission(id) is not null);

-- Only the 'edit' tier may change a task, and only the fields — never the
-- owner. Reassigning ownership is not a thing a helper can do.
create policy "editors update a shared task"
  on public.tasks for update
  using (public.task_permission(id) = 'edit')
  with check (public.task_permission(id) = 'edit' and owner_id = (
    select t.owner_id from public.tasks t where t.id = tasks.id
  ));

create policy "owner manages shares"
  on public.task_shares for all
  using (public.task_permission(task_id) = 'owner')
  with check (public.task_permission(task_id) = 'owner');

create policy "shared users see their own share"
  on public.task_shares for select
  using (public.task_permission(task_id) is not null);

-- ---------------------------------------------------------------------------
-- notes
--
-- Append-only by design: there is no update policy, so a note cannot be
-- rewritten after the fact. That is what makes the log worth summarising.
-- ---------------------------------------------------------------------------

create table public.task_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks on delete cascade,
  author_id uuid references public.profiles on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index task_notes_task_idx on public.task_notes (task_id, created_at desc);

alter table public.task_notes enable row level security;

create policy "anyone with access reads notes"
  on public.task_notes for select
  using (public.task_permission(task_id) is not null);

-- 'comment' is the tier that exists precisely so a helper can add notes
-- without being able to change the task itself.
create policy "commenters and above write notes"
  on public.task_notes for insert
  with check (
    public.task_permission(task_id) in ('owner', 'comment', 'edit')
    and author_id = auth.uid()
  );

create policy "authors delete their own notes"
  on public.task_notes for delete
  using (author_id = auth.uid() or public.task_permission(task_id) = 'owner');

-- ---------------------------------------------------------------------------
-- activity events
--
-- The TypeScript side models these as a discriminated union; flattened here
-- with from_status/to_status null except on a status change.
--
-- Written by triggers rather than by the client, so the log cannot drift if
-- anything else ever writes to this database. There is deliberately no insert
-- policy: nothing but the triggers below can add to it.
-- ---------------------------------------------------------------------------

create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks on delete cascade,
  type text not null
    check (type in ('created', 'status_changed', 'note_added', 'dates_changed')),
  from_status text,
  to_status text,
  at timestamptz not null default now()
);

create index task_events_task_idx on public.task_events (task_id, at desc);

alter table public.task_events enable row level security;

create policy "anyone with access reads events"
  on public.task_events for select
  using (public.task_permission(task_id) is not null);

create function public.log_task_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.task_events (task_id, type) values (new.id, 'created');
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.task_events (task_id, type, from_status, to_status)
    values (new.id, 'status_changed', old.status, new.status);
  end if;

  if new.start_date is distinct from old.start_date
     or new.end_date is distinct from old.end_date then
    insert into public.task_events (task_id, type) values (new.id, 'dates_changed');
  end if;

  -- Renaming or rewording is housekeeping, not movement, so it logs nothing —
  -- otherwise tidying a stalled task would make it look alive.
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_log_insert
  after insert on public.tasks
  for each row execute function public.log_task_change();

create trigger tasks_log_update
  before update on public.tasks
  for each row execute function public.log_task_change();

create function public.log_note_added()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.task_events (task_id, type) values (new.task_id, 'note_added');
  return new;
end;
$$;

-- Deleting a note is a correction, so only the insert is logged.
create trigger task_notes_log_insert
  after insert on public.task_notes
  for each row execute function public.log_note_added();
