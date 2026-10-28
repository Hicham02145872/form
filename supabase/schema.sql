-- À exécuter une fois dans le SQL Editor du projet Supabase.
begin;
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;
create policy "An admin can verify their membership" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('Études & pédagogie','Vie sur le campus','Bien-être & santé','Administration','Finances & logement','Autre')),
  title text not null check (char_length(trim(title)) between 5 and 120),
  problem text not null check (char_length(trim(problem)) between 20 and 2000),
  solution text not null default '' check (char_length(solution) <= 2000),
  impact text not null check (impact in ('Faible','Modéré','Important')),
  status text not null default 'Nouveau' check (status in ('Nouveau','En cours','Résolu')),
  created_at timestamptz not null default now()
);
create index feedback_created_at_idx on public.feedback(created_at desc);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
-- Le public ne peut pas fournir un statut, une date ou un identifiant.
grant insert (category, title, problem, solution, impact) on public.feedback to anon, authenticated;
grant select on public.feedback to authenticated;
grant update (status) on public.feedback to authenticated;
create policy "Submit without identifying the student" on public.feedback
  for insert to anon, authenticated with check (status = 'Nouveau');
create policy "Admins read contributions" on public.feedback
  for select to authenticated using (exists (select 1 from public.admins where user_id = (select auth.uid())));
create policy "Admins update status" on public.feedback
  for update to authenticated
  using (exists (select 1 from public.admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins where user_id = (select auth.uid())));
commit;
-- Créer un utilisateur dans Authentication > Users puis autoriser son UUID :
-- insert into public.admins (user_id) values ('UUID-DU-COMPTE-ADMIN');
