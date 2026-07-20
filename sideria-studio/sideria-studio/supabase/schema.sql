-- Sidéria Studio : schéma v0.1 (premier jet, volontairement simple).
-- Un univers = un document JSONB complet. La normalisation (tables pnj,
-- factions, evenements...) est la prochaine étape, voir README > Feuille de route.

create table if not exists univers (
  id uuid primary key default gen_random_uuid(),
  nom text not null default 'Sidéria',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table univers enable row level security;

-- Premier jet : accès complet aux utilisateurs authentifiés.
-- À restreindre par propriétaire (colonne owner uuid references auth.users)
-- dès que l'authentification est branchée côté appli.
create policy "acces authentifie" on univers
  for all using (auth.role() = 'authenticated');
