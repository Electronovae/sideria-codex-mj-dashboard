# Sidéria Studio

Studio de création pour l'univers **Sidéria : L'Ère de l'Éther**. Un seul outil pour créer et maintenir la méta-campagne, les campagnes, les PNJ (avec leurs arbres de décision), les personnages joueurs (réputations, interactions), les factions, le bestiaire et les événements, avec export vers Obsidian — plus le Codex public (wiki des joueurs) et les fiches de personnage, dans la même application.

Application disponible ici : **https://sideria.fr**

- `/` — Codex de Sidéria, wiki public du manuel des joueurs, sans connexion requise (voir ci-dessous)
- `/studio` — MJ Dashboard (Sidéria Studio), réservé au MJ, protégé par connexion
- `/fiches` — fiches de personnage des joueurs, accès par magic link

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produit dist/ (déployé sur Netlify)
```

Aucune configuration n'est nécessaire pour le module Studio en mode local (autosave navigateur). Les modules Fiches, Studio (auth) et Codex nécessitent Supabase configuré (voir plus bas).

## Sauvegarde du module Studio (3 niveaux)

1. **Autosave navigateur** : chaque modification est enregistrée localement (localStorage) après 800 ms. Confortable, mais lié au navigateur : ce n'est pas une sauvegarde de long terme.
2. **Export / Import JSON** : le bouton "Exporter JSON" produit `sideria_univers.json`, à ranger dans le vault Obsidian. C'est la sauvegarde de référence, versionnable dans Git avec le vault.
3. **Supabase** : copier `.env.example` en `.env`, renseigner l'URL et la clé anon du projet (`sharfzrgrjvbcdlentie`), exécuter `supabase/schema.sql` dans l'éditeur SQL de Supabase. Les boutons "Pousser / Tirer" apparaissent alors dans la barre.

### Choix de conception Supabase

Deux modèles cohabitent :

- **Univers du Studio** (factions, PNJ, campagnes, sessions, événements...) : une ligne JSONB dans la table `univers`. Simple, pas de conflits de fusion, pas de migration à chaque évolution du modèle. La normalisation complète (tables par entité, temps réel, multi-utilisateurs) reste sur la feuille de route.
- **Contenu du manuel (Codex + fiches)** : normalisé, une table par domaine — `classes_sideria`, `subclasses_sideria`, `features_sideria`, `peuples_sideria`, `historiques_sideria`, `dons_sideria`, `objets_sideria`, `services_sideria`, `regles_sideria` (progression, multiclassage, règles de jeu de la partie « Jouer à Sidéria »), et `character_features_debloquees`. Toutes en lecture publique (RLS `using (true)`), écriture MJ.
- **Comptes et fiches joueurs** : `Player`, `characters`. Ce schéma a été initié par Romain (ancien collaborateur, parti avant que le projet n'avance) ; il a depuis été repris entièrement côté MJ. Les tables `classes` et `spells` qu'il avait créées, restées vides et orphelines, ont été supprimées (RLS désactivé dessus, plus de raison de les garder).

## Authentification

- **`/studio`** : Supabase Auth (email + mot de passe), restreint à un seul compte via allowlist dans `src/studio/StudioGate.jsx`. Le compte se crée depuis le dashboard Supabase (Authentication → Users → Add user), pas depuis l'app — aucune inscription publique n'existe pour cette route.
- **`/fiches`** : Supabase Auth par magic link (OTP email) envoyé via Brevo, avec possibilité de définir un mot de passe ensuite. Le domaine `sideria.fr` est authentifié côté Brevo (SPF/DKIM/code de vérification) pour éviter que les liens tombent en spam Gmail.
- **`/`** : aucune connexion requise. Un bouton « Se connecter » sur l'accueil du Codex renvoie vers `/fiches`.

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
├── wiki/                       Codex public (route /), sans connexion
│   ├── WikiApp.jsx              racine du module wiki + routage interne par onglet
│   ├── Accueil.jsx               page d'accueil : intro, rectangles de navigation, étapes de création
│   ├── ListeClasses.jsx / FicheClasse.jsx   liste des 16 classes + fiche complète
│   ├── PageCaracteristiques.jsx  méthode de répartition des caractéristiques
│   ├── Origines.jsx               peuples & historiques (liste + fiche détaillée)
│   ├── Dons.jsx                    dons génériques / maîtrise / classe, filtrables
│   ├── Equipement.jsx              objets par catégorie + services & train de vie
│   ├── Progression.jsx             XP, PV, Fragments, Indice de Discipline, multiclassage
│   ├── JouerASideria.jsx           règles de base (partie VIII) : caractéristiques, compétences, combat, aventure, montures, marchandises
│   ├── useWikiData.js               hooks Supabase (peuples, historiques, dons, objets, services, regles)
│   ├── roleMeta.js / texteLeger.jsx  utilitaires d'affichage partagés
│   └── wiki.css                     design system du Codex (distinct du Studio et des Fiches)
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
- [x] **Wiki joueurs public** : route `/`, sans connexion, mobile-first — Classes, Origines (peuples & historiques), Dons, Équipement (+ services), Progression & multiclassage, Jouer à Sidéria (règles de base)
- [ ] **Sorts (Partie VI du manuel)** : 86 sorts, 11 disciplines — même pipeline JSON→SQL que les classes et l'équipement
- [ ] **Assistant de création guidé** : parcours pas-à-pas (classe → origine → dons) sur le Codex public, connecté à `/fiches`, qui remplit une vraie fiche en base au fil des choix
- [ ] **Affichage mobile** : passage CSS dédié (drill-down liste → fiche) pour Studio et Fiches (fait pour le Wiki)
- [ ] **RLS renforcée** : politiques liées à `auth.uid()` sur les tables MJ, au-delà du login `/studio`
- [ ] **Compteurs en session** : mode "table" tactile pour manipuler les compteurs d'arbres en direct
- [ ] **Vie visuelle du Codex** : thème dynamique et/ou images d'illustration (à traiter un point à la fois)
