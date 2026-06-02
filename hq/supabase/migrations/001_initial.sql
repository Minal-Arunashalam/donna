-- Goals
create table goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  why text,
  success_metric text,
  deadline date,
  progress int default 0 check (progress between 0 and 100),
  color text default '#c8f060',
  active boolean default true,
  created_at timestamptz default now()
);

-- Goal Actions
create table goal_actions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade,
  action text not null,
  done boolean default false,
  week_of date default current_date,
  created_at timestamptz default now()
);

-- COO Message History
create table coo_messages (
  id uuid primary key default gen_random_uuid(),
  role text check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- People / Relationship Manager
create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  notes text,
  checkin_frequency_days int default 30,
  last_contact timestamptz default now(),
  avatar_color text default '#60d0f0',
  created_at timestamptz default now()
);

-- Interaction Log
create table interactions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  note text not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_goal_actions_goal_id on goal_actions(goal_id);
create index idx_goal_actions_week_of on goal_actions(week_of);
create index idx_interactions_person_id on interactions(person_id);
create index idx_interactions_created_at on interactions(created_at desc);
create index idx_people_last_contact on people(last_contact);
create index idx_coo_messages_created_at on coo_messages(created_at desc);

-- Auto-trim coo_messages to last 30 rows
create or replace function trim_coo_messages()
returns trigger language plpgsql as $$
begin
  delete from coo_messages
  where id in (
    select id from coo_messages
    order by created_at desc
    offset 30
  );
  return new;
end;
$$;

create trigger after_coo_message_insert
after insert on coo_messages
for each row execute function trim_coo_messages();
