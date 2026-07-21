# Sidéria Studio

Studio de création pour l'univers **Sidéria : L'Ère de l'Éther**. Un seul outil pour créer et maintenir la méta-campagne, les campagnes, les PNJ (avec leurs arbres de décision), les personnages joueurs (réputations, interactions), les factions et les événements, avec export vers Obsidian.

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # produit dist/ (déployable sur GitHub Pages, Netlify, Vercel...)
```

Aucune configuration n'est nécessaire pour commencer : l'appli tourne en mode local.

## Sauvegarde (3 niveaux)

1. **Autosave navigateur** : chaque modification est enregistrée localement (localStorage) après 800 ms. Confortable, mais lié au navigateur : ce n'est pas une sauvegarde de long terme.
2. **Export / Import JSON** : le bouton "Exporter JSON" produit `sideria_univers.json`, à ranger dans le vault Obsidian. C'est la sauvegarde de référence, versionnable dans Git avec le vault.
3. **Supabase (optionnel)** : copier `.env.example` en `.env`, renseigner l'URL et la clé anon du projet, exécuter `supabase/schema.sql` dans l'éditeur SQL de Supabase. Les boutons "Pousser / Tirer" apparaissent alors dans la barre.

### Choix de conception Supabase v0.1

Un univers = **une ligne JSONB** dans la table `univers`. C'est volontairement simple pour un premier jet : pas de conflits de fusion, pas de migrations à chaque évolution du modèle. La normalisation (tables `pnj`, `factions`, `evenements` avec clés étrangères, temps réel, multi-utilisateurs MJ + joueurs) est l'étape 2, voir la feuille de route.

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
├── App.jsx                store global (Context + autosave), navigation, barre d'outils
├── lib/
│   ├── calendrier.js      calendrier sidérien
│   ├── modele.js          gabarits d'entités + univers de départ
│   ├── storage.js         local / fichier / Supabase
│   ├── supabase.js        client (null si non configuré)
│   └── obsidian.js        génération Markdown + zip
└── modules/
    ├── Tableau.jsx        tableau de bord
    ├── Campagnes.jsx      méta-campagne (thèse, saisons) + campagnes (actes, pivots)
    ├── Pnjs.jsx           PNJ + éditeur d'arbre + aperçu SVG
    ├── Joueurs.jsx        PJ, réputations par faction, journal d'interactions
    ├── Factions.jsx       factions, direction, membres, événements liés
    ├── Evenements.jsx     événements datés au calendrier sidérien
    └── communs.jsx        composants partagés
```

## Pré-remplissage depuis Obsidian

Un fichier `sideria_univers_prerempli.json` peut être généré depuis le vault (factions, PNJ, PJ, sessions datées, campagnes) et chargé via "Importer JSON". L'import direct du vault dans l'appli est sur la feuille de route.

## Feuille de route (à prioriser ensemble)

- [ ] **Horloge de la Déchirure** : module dédié (jalons M0-M24, saisons, avancement par table)
- [x] **Frises intégrées** : module Frise chronologique (lignes PJ/PNJ, zoom multi-échelles, interactions PJ en losanges creux)
- [ ] **Éditeur d'arbre graphique** : glisser-déposer des nœuds plutôt que le tableau
- [ ] **Supabase normalisé** : tables par entité, temps réel, comptes joueurs en lecture seule
- [ ] **Import Obsidian** : lire le vault existant pour amorcer la base (parsing des fiches)
- [ ] **Wiki joueurs** : vue publique filtrée (sans les champs Secrets Maître)
- [ ] **Compteurs en session** : mode "table" tactile pour manipuler les compteurs d'arbres en direct
