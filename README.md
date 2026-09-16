# Sidéria Studio

Application web de l'univers **Sidéria : L'Ère de l'Éther**, un JDR steampunk-fantasy homebrew. Une seule application React réunit trois pôles : le Codex public pour les joueurs, les fiches de personnage et le tableau de bord du MJ.

Application en ligne : **https://sideria.fr**

| Route | Pôle | Accès |
|---|---|---|
| `/` | Codex de Sidéria, wiki public du manuel des joueurs | libre, sans connexion |
| `/fiches` | Fiches de personnage et assistant de création | joueurs connectés (magic link ou mot de passe) |
| `/studio` | Sidéria Studio, tableau de bord du MJ | MJ uniquement (email + mot de passe, allowlist) |

## Démarrage

```bash
npm install
cp .env.example .env   # renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
npm run build          # produit dist/
```

Sans `.env`, seul le Studio fonctionne, en mode local (autosave navigateur). Le Codex, les fiches et l'authentification demandent Supabase.

## Déploiement

- Hébergement **Netlify**. La production est déployée depuis la branche `main` du dépôt `Electronovae/sideria-codex-mj-dashboard` : tout push sur `main` part en ligne sur sideria.fr.
- La branche `electronovae` sert de branche de test (déploiement de prévisualisation Netlify si les *Branch deploys* sont activés). La branche `romain` n'est pas à modifier.
- En upload via l'interface GitHub, vérifier que `main` est bien sélectionnée avant de déposer les fichiers.
- Variables d'environnement Netlify : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- `public/_redirects` contient `/* /index.html 200`, indispensable pour que les URLs du routeur (`/classes/:id`, `/fiches/:id`...) fonctionnent au rechargement. Attention : un fichier statique placé dans `public/` passe avant les routes de l'application.
- `public/_headers` désactive le cache de `index.html` pour que chaque déploiement soit pris immédiatement.

## Base de données (Supabase)

Projet Supabase : `sharfzrgrjvbcdlentie`. La base est la source canonique du contenu (le vault Obsidian n'est plus à jour).

### Univers du Studio (12 tables normalisées)

`meta`, `factions`, `pnjs`, `pnj_factions`, `lieux`, `joueurs`, `joueurs_historique`, `campagnes`, `sessions`, `session_scenes`, `evenements`, `rapports`, plus `creatures` pour le bestiaire.

`src/lib/storage.js` synchronise l'univers en mémoire avec ces tables : « Pousser vers Supabase » fait un upsert table par table et supprime les lignes absentes (en deux passes pour les clés étrangères circulaires : chef de faction, supérieur de PNJ, lieu parent), « Tirer depuis Supabase » relit tout et reconstruit l'objet univers. Les identifiants sont des UUID (`crypto.randomUUID()`).

### Contenu du manuel (Codex)

Parsé depuis le manuel LaTeX avec des scripts Python maison (macros `\feat`, `\sortbox`, `\sortchamp`, `\flavour`, `\lorebox`, `\mechbox`, `\subbox`, `\objetcourant`).

| Table | Contenu |
|---|---|
| `classes_sideria` | 16 classes (texte complet, kit de départ, réglages de sorts) |
| `subclasses_sideria`, `features_sideria` | sous-classes et techniques débloquables par Fragments |
| `peuples_sideria`, `historiques_sideria` | 12 peuples, 11 historiques |
| `dons_sideria` | 79 dons |
| `objets_sideria`, `services_sideria` | 103 objets, 40 services et train de vie |
| `disciplines_sorts_sideria`, `sorts_sideria` | 11 disciplines, 339 sorts |
| `regles_sideria` | progression, multiclassage, règles de « Jouer à Sidéria » |

### Comptes et fiches joueurs

- `Player` : un profil par compte Supabase Auth, avec un `role` (`player`, `mj`, `admin`). La fonction SQL `is_staff()` renvoie vrai pour `mj` et `admin`.
- `characters` : les fiches. Chaque joueur voit et modifie les siennes, le staff voit tout.
- `character_features_debloquees` : techniques de classe débloquées par personnage.

Ce schéma a été initié par Romain. Toutes les migrations sur ces tables restent additives (`ADD COLUMN IF NOT EXISTS`).

## Règles de jeu implémentées

### Points de vie

- Au niveau 1 : **6 × (dé de vie de la classe + mod. CON)**, calculé par l'assistant de création.
- À chaque montée de niveau : 1 dé de vie + mod. CON, minimum 1.

### Sorts

Chaque classe a deux réglages, éditables dans Studio > Classes > « Sorts : départ et progression » :

- `sorts_max_depart` : sorts connus au niveau 1, de 0 à 5 ;
- `sorts_intervalle_niveaux` : 0 (aucun gain), 1 (un sort par niveau), 2 ou 3 (un sort tous les 2 ou 3 niveaux).

Quota de sorts connus = `sorts_max_depart` + `floor((niveau - 1) / intervalle)` + `sorts_bonus` accordés par le MJ.

Le MJ peut aussi imposer un set de départ (`sorts_depart`), verrouillé dans l'assistant. Une classe accède au **tronc commun** et aux sorts **exclusifs** qui la mentionnent.

### Fragments

Gagnés à chaque niveau selon `fragments_cadence` de la classe (1d4 par défaut), plus les fragments donnés ponctuellement par le MJ. Ils servent à débloquer les techniques de classe.

### Montée de niveau

Gérée uniquement par le MJ depuis Studio > Joueurs, sur une fiche reliée :

- PV et fragments lancés automatiquement, relançables ou modifiables avant validation ;
- +1 dé de résistance, rappel des nouveaux sorts et des paliers de montée de caractéristique ;
- annulation de la dernière montée, don ou retrait de fragments avec motif, sorts bonus ;
- tout est tracé dans `characters.historique_niveaux`.

Un trigger SQL (`proteger_progression_personnage`) empêche un joueur de modifier `level`, `sorts_bonus` et `historique_niveaux` : ses sauvegardes conservent les valeurs en base.

## Authentification et sécurité

- **`/studio`** : Supabase Auth email + mot de passe, limité aux adresses de `src/studio/StudioGate.jsx`. Le compte se crée depuis le dashboard Supabase (Authentication > Users), il n'existe pas d'inscription publique.
- **`/fiches`** : magic link envoyé via Brevo (domaine `sideria.fr` authentifié SPF/DKIM), puis mot de passe facultatif.
- **`/`** : aucune connexion. Un bouton « Se connecter » mène à `/fiches`.

⚠️ Les RLS ne sont pas encore durcies partout. `characters`, `Player`, `character_features_debloquees`, `classes_sideria`, `subclasses_sideria` et `features_sideria` sont protégées par `auth.uid()` / `is_staff()`. En revanche, les tables de l'univers du Studio **et** plusieurs tables du manuel (sorts, dons, peuples, historiques, objets, services, règles, disciplines) acceptent encore l'écriture via la clé anonyme (`using (true)`). À remplacer par `is_staff()` pour l'écriture.

## Structure du code

```
src/
├── main.jsx                  routage racine : /fiches, /studio, / (wiki)
├── App.jsx                   Sidéria Studio : store global, autosave, navigation, écran scindé
├── styles.css                design system du Studio (thèmes clair et sombre)
├── lib/
│   ├── calendrier.js         calendrier sidérien (350 jours, 5 saisons de 70 jours)
│   ├── modele.js             gabarits d'entités, normalisation, uid()
│   ├── storage.js            autosave local, import JSON, synchronisation Supabase
│   ├── supabase.js           client Supabase (null si non configuré)
│   └── obsidian.js           génération Markdown + zip (plus exposé dans l'interface)
├── studio/
│   └── StudioGate.jsx        connexion et allowlist du Studio
├── modules/                  onglets du Studio
│   ├── Tableau.jsx           tableau de bord
│   ├── Codex.jsx             fiches de lecture de l'univers
│   ├── Graphe.jsx            graphe des relations (+ MiniGraphe)
│   ├── Factions.jsx          factions et organigramme (PNJ et PJ)
│   ├── Lieux.jsx             lieux, hiérarchie, liens retour
│   ├── Pnjs.jsx              PNJ
│   ├── ArbreEditeur.jsx      arbres narratifs (plein écran)
│   ├── Bestiaire.jsx         créatures, stat blocks, flag d'équilibre
│   ├── Wiki.jsx              classes du manuel + réglages de sorts par classe
│   ├── Campagnes.jsx         méta-campagne, saisons, campagnes, sessions
│   ├── Evenements.jsx        événements datés
│   ├── Joueurs.jsx           PJ, lien vers la fiche technique, panneau de progression
│   ├── Frise.jsx             frise chronologique multi-échelles
│   ├── Rapports.jsx          rapports
│   ├── Recherche.jsx         recherche globale
│   └── communs.jsx           composants partagés (ListeFiche, Texte markdown, Champ...)
├── wiki/                     Codex public
│   ├── WikiApp.jsx           routes : /classes, /classes/:id, /caracteristiques, /origines,
│   │                         /dons, /equipement, /progression, /jouer, /sorts
│   ├── Accueil.jsx           accueil et parcours de création
│   ├── ListeClasses.jsx, FicheClasse.jsx
│   ├── PageCaracteristiques.jsx, Origines.jsx, Dons.jsx, Equipement.jsx
│   ├── Progression.jsx, JouerASideria.jsx
│   ├── Sorts.jsx             339 sorts filtrables, ajout à sa fiche dans la limite du quota
│   ├── useWikiData.js        hooks Supabase du contenu du manuel
│   ├── roleMeta.js, texteLeger.jsx
│   └── wiki.css
└── fiches/                   module joueurs
    ├── FichesApp.jsx         racine, profil Player, détection MJ
    ├── Login.jsx, authClient.js, BanniereMotDePasse.jsx
    ├── Selection.jsx         choix du personnage
    ├── CreationGuidee.jsx    assistant en 8 étapes : nom, classe, peuple, historique,
    │                         caractéristiques et or, dons, sorts, récapitulatif
    ├── FeuilleDePersonnage.jsx  fiche à onglets : identité, caractéristiques, combat,
    │                            sorts, rôle-play, inventaire, notes
    ├── SectionClasse.jsx     classe, sous-classe, techniques débloquées
    ├── SectionSorts.jsx      grimoire : sorts connus, quota, catalogue d'apprentissage
    ├── modeleFiche.js        fiche vierge, modificateurs, calculs PV / sorts / fragments
    ├── useClasses.js, useFiche.js
    └── fiches.css
```

## Conventions de travail

- Migrations Supabase toujours additives (`ADD COLUMN IF NOT EXISTS`), vérifiées ensuite via `information_schema.columns`.
- En SQL, apostrophes doublées (`''`), pas d'échappement par `\`. Après chaque `replace()` de nettoyage, vérifier avec un `SELECT ... ILIKE '%motif%'` : les remplacements ratés ne lèvent aucune erreur.
- Les factions viennent de la table `factions` (filtrer `nom != 'Monde'`), jamais codées en dur.
- Surveiller les politiques RLS en double : une politique permissive en trop annule une politique stricte.

## Feuille de route

- [x] Codex des classes côté MJ
- [x] Wiki joueurs public avec vraies URLs par page
- [x] Sorts : 339 sorts, 11 disciplines, page wiki filtrable
- [x] Assistant de création guidé connecté à `/fiches`
- [x] Frise chronologique
- [x] Univers du Studio normalisé en 12 tables
- [x] Grimoire sur la fiche, quotas de sorts par classe, montée de niveau côté MJ
- [ ] Lien wiki vers la fiche de classe depuis l'assistant (bug à diagnostiquer)
- [ ] Module Sessions : comptes-rendus écrits par le MJ, lecture côté joueurs
- [ ] RLS durcies : `is_staff()` en écriture sur toutes les tables MJ et du manuel
- [ ] Affichage mobile de Studio et Fiches (fait pour le Wiki)
- [ ] Rafraîchissement de la fiche joueur après une montée de niveau faite par le MJ
- [ ] Horloge de la Déchirure (jalons M0-M24)
- [ ] Éditeur d'arbre graphique en glisser-déposer
- [ ] Import direct du vault Obsidian
- [ ] Mode table tactile pour les compteurs en session
- [ ] Thème dynamique et illustrations du Codex
