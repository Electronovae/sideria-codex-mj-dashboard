# Sidéria Studio

Studio de création pour l'univers **Sidéria : L'Ère de l'Éther**. Un seul outil pour créer et maintenir la méta-campagne, les campagnes, les PNJ (avec leurs arbres de décision), les personnages joueurs (réputations, interactions), les factions, le bestiaire et les événements, avec export vers Obsidian — plus les fiches de personnage des joueurs et le codex des classes, dans la même application.

Application disponible ici : **https://sideria.fr**

- `/studio` — MJ Dashboard (Sidéria Studio), réservé au MJ, protégé par connexion
- `/fiches` — fiches de personnage des joueurs, accès par magic link
- `/` — redirige vers `/fiches` pour l'instant (le futur wiki public des classes prendra cette place, voir feuille de route)

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produit dist/ (déployé sur Netlify)
```

Aucune configuration n'est nécessaire pour le module Studio en mode local (autosave navigateur). Les modules Fiches, Studio (auth) et Classes nécessitent Supabase configuré (voir plus bas).

## Sauvegarde du module Studio (3 niveaux)

1. **Autosave navigateur** : chaque modification est enregistrée localement (localStorage) après 800 ms. Confortable, mais lié au navigateur : ce n'est pas une sauvegarde de long terme.
2. **Export / Import JSON** : le bouton "Exporter JSON" produit `sideria_univers.json`, à ranger dans le vault Obsidian. C'est la sauvegarde de référence, versionnable dans Git avec le vault.
3. **Supabase** : copier `.env.example` en `.env`, renseigner l'URL et la clé anon du projet (`sharfzrgrjvbcdlentie`), exécuter `supabase/schema.sql` dans l'éditeur SQL de Supabase. Les boutons "Pousser / Tirer" apparaissent alors dans la barre.

### Choix de conception Supabase

Deux modèles cohabitent :

- **Univers du Studio** (factions, PNJ, campagnes, sessions, événements...) : une ligne JSONB dans la table `univers`. Simple, pas de conflits de fusion, pas de migration à chaque évolution du modèle. La normalisation complète (tables par entité, temps réel, multi-utilisateurs) reste sur la feuille de route.
- **Classes, sous-classes, features, personnages joueurs** : normalisé (`classes_sideria`, `subclasses_sideria`, `features_sideria`, `character_features_debloquees`, `Player`, `characters`, `spells`). Ces tables sont co-gérées avec Romain (branche `romain` du dépôt) — `Player`, `characters`, `classes`, `spells` lui appartiennent et ne doivent jamais être modifiées côté MJ.

## Authentification

- **`/studio`** : Supabase Auth (email + mot de passe), restreint à un seul compte via allowlist dans `src/studio/StudioGate.jsx`. Le compte se crée depuis le dashboard Supabase (Authentication → Users → Add user), pas depuis l'app — aucune inscription publique n'existe pour cette route.
- **`/fiches`** : Supabase Auth par magic link (OTP email) envoyé via Brevo, avec possibilité de définir un mot de passe ensuite. Le domaine `sideria.fr` est authentifié côté Brevo (SPF/DKIM/code de vérification) pour éviter que les liens tombent en spam Gmail.

⚠️ Ce login protège l'accès à l'**interface**, pas encore les requêtes directes à l'API Supabase : les politiques RLS des tables MJ (`pnjs`, `sessions`, etc.) sont encore en `using (true)` pour la clé anonyme. Verrouillage plus strict (RLS liée à `auth.uid()`) à prévoir si l'URL `/studio` devenait publique.

## Fusion avec Obsidian

Le bouton **Export Obsidian (.zip)** génère un fragment de vault :

```
Sideria Studio Export/
├── PNJ/               un .md par PNJ (fiche + arbre en tableau + secrets)
├── Factions/          un .md par faction (membres, direction, événements)
├── PJ/                un .md par personnage (réputations, journal d'interactions)
├── Campagnes/         un .md par campagne (actes, pivots, issues)
├── Chronologie des evenements.md
└── Meta-campagne.md
```

Les fichiers utilisent des wikilinks et des noms ASCII : ils se fusionnent dans le vault existant. Le flux recommandé : **créer dans le Studio, exporter vers Obsidian, jouer depuis Obsidian.**

## Compatibilité avec les outils de session

Le modèle de données reprend les schémas des outils autonomes déjà en usage :

- `arbres_narratifs_sideria.html` : même schéma d'arbre (compteur, seuils, nœuds typés, transitions sombres).
- `chroniques_sideria.html` : même calendrier sidérien (année de 350 jours, 5 saisons de 70 jours, dates en index de jour).

## Structure du code

```
src/
├── main.jsx                routage (/fiches, /studio, redirection racine)
├── App.jsx                 Sidéria Studio : store global (Context + autosave), navigation, barre d'outils
├── styles.css               design system du Studio (variables CSS, thèmes clair/sombre)
├── lib/
│   ├── calendrier.js        calendrier sidérien
│   ├── modele.js             gabarits d'entités + univers de départ
│   ├── storage.js            local / fichier / Supabase (univers JSONB)
│   ├── supabase.js           client Supabase (null si non configuré)
│   └── obsidian.js           génération Markdown + zip
├── modules/                 modules du Studio (onglets)
│   ├── Tableau.jsx           tableau de bord
│   ├── Campagnes.jsx         méta-campagne (thèse, saisons) + campagnes (actes, pivots)
│   ├── Pnjs.jsx               PNJ + éditeur d'arbre + aperçu SVG
│   ├── Joueurs.jsx            PJ, réputations par faction, journal d'interactions
│   ├── Factions.jsx           factions, direction, membres, événements liés
│   ├── Evenements.jsx         événements datés au calendrier sidérien
│   ├── Lieux.jsx               lieux
│   ├── Bestiaire.jsx           créatures et stat blocks
│   ├── Wiki.jsx                 codex des classes (lecture seule, coté MJ)
│   └── communs.jsx             composants partagés (ListeFiche, Texte, Champ...)
├── studio/
│   └── StudioGate.jsx          portail de connexion + allowlist pour /studio
└── fiches/                    module joueurs
    ├── FichesApp.jsx            racine du module fiches
    ├── Login.jsx / authClient.js  auth (magic link + mot de passe)
    ├── Selection.jsx             sélection du personnage
    ├── FeuilleDePersonnage.jsx    fiche complète
    ├── SectionClasse.jsx         classe/sous-classe/features débloquées
    ├── useClasses.js              hook Supabase (classes_sideria/subclasses_sideria/features_sideria)
    ├── useFiche.js                 hook Supabase (character)
    └── fiches.css                 design system des fiches
```

## Pré-remplissage depuis Obsidian

Un fichier `sideria_univers_prerempli.json` peut être généré depuis le vault (factions, PNJ, PJ, sessions datées, campagnes) et chargé via "Importer JSON". L'import direct du vault dans l'appli est sur la feuille de route.

## Feuille de route (à prioriser ensemble)

- [ ] **Horloge de la Déchirure** : module dédié (jalons M0-M24, saisons, avancement par table)
- [x] **Frises intégrées** : module Frise chronologique (lignes PJ/PNJ, zoom multi-échelles, interactions PJ en losanges creux)
- [ ] **Éditeur d'arbre graphique** : glisser-déposer des nœuds plutôt que le tableau
- [ ] **Supabase normalisé** : étendre la normalisation au reste de l'univers (factions, PNJ, sessions), temps réel, comptes joueurs en lecture seule
- [ ] **Import Obsidian** : lire le vault existant pour amorcer la base (parsing des fiches)
- [x] **Codex des classes côté MJ** : module `Wiki.jsx`, 16 classes du manuel complet en base (texte intégral, sous-classes, capacités légendaires, multiclassage)
- [ ] **Wiki joueurs** : version publique du codex des classes, accessible sans connexion, mise en page mobile-first, sur la route `/`
- [ ] **Affichage mobile** : passage CSS dédié (drill-down liste → fiche) pour Studio, Fiches et Wiki
- [ ] **RLS renforcée** : politiques liées à `auth.uid()` sur les tables MJ, au-delà du login `/studio`
- [ ] **Sorts (Partie VI du manuel)** : même pipeline JSON→SQL que les classes
- [ ] **Compteurs en session** : mode "table" tactile pour manipuler les compteurs d'arbres en direct
