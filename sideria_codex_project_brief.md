# The Sideria Codex — Application JDR · Project Brief

> Document de référence pour toute session de travail avec Claude ou un développeur.
> Toutes les décisions de conception sont verrouillées. Prêt à coder.
> Dernière mise à jour : mai 2026

---

## Contexte du projet

**Auteur** : MJ d'une campagne JDR homebrew, univers "The Sideria Codex — L'Ère de l'Éther"
**Profil technique** : Physicien, Python/C intermédiaire, débutant en dev web
**Collaborateur** : Un ami avec expérience dev web (React, backend)
**Ambition** : Application utilisable en session + vitrine CV + potentiellement commercialisable

**Système de jeu** : Adaptation D&D 5e en cours de migration vers système maison
**Volume de données** :
- 10–15 joueurs (pas simultanés, plusieurs campagnes en parallèle)
- ~100 PNJ nommés
- Dizaines de lieux, bestiaire complet
- Fiches perso format propre (LaTeX → PDF)

---

## Stack technique — DÉCIDÉE ET VERROUILLÉE

| Couche | Technologie | Notes |
|---|---|---|
| Frontend | React + Vite | Standard moderne, CV-friendly |
| État global | Zustand | Simple, suffisant |
| Backend / BDD | Supabase (PostgreSQL) | Gratuit, auth + storage inclus |
| Storage images | Supabase Storage | 1 Go gratuit, séparé de la BDD |
| Hébergement | Netlify ou Vercel | Déploiement en 1 clic, gratuit |
| Export fiches | react-pdf (navigateur) | PDF côté client, pas de serveur LaTeX |
| Format d'échange | JSON | Export brut toujours disponible |

---

## Décisions de conception — TOUTES VERROUILLÉES

### Comptes utilisateurs
**Hybride magic link** : le MJ a un compte admin classique. Les joueurs reçoivent un lien magique par email (sans mot de passe) qui leur donne accès en lecture à leur fiche uniquement.

### Multi-campagnes
**Dès le départ.** Chaque entité est rattachée à une `campaign_id`. Le MJ voit toutes ses campagnes. Un joueur ne voit que la campagne où il est membre.

### Audio / ambiance
**Embed YouTube + Spotify.** Playlist par session en JSON `[{label, type, url}]`, affichée dans le dashboard MJ.

### Export fiches
**Les deux** : export JSON brut + génération PDF via `react-pdf` côté navigateur.

### Site lore public
**Validation manuelle.** `is_public = false` par défaut. Les champs `tactics_mj` et `notes_mj` ne sont jamais exposés, même si l'entité est publiée.

---

## Modules — ordre de développement recommandé

### Phase 1 — Fondations
1. Mise en place environnement (Node, Vite, Supabase)
2. Authentification (compte MJ + magic link joueur)
3. Gestion des campagnes

### Phase 2 — Données
4. Fiches PJ — saisie, lecture, édition
5. Fiches PNJ / bestiaire
6. Lieux et factions

### Phase 3 — Session
7. Dashboard MJ (porter le prototype HTML/JS en React)
8. Tracker d'initiative + combat
9. Player ambiance YouTube/Spotify

### Phase 4 — Export et publication
10. Export JSON
11. Export PDF (react-pdf)
12. Site lore public

### Phase 5 — Lore avancé
13. Graphe de relations (vue "Obsidian")
14. Chronologie des lieux

---

## Structure des dossiers

```
sideria-codex/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── lib/
│   │   └── supabase.js             # Client Supabase (3 lignes)
│   ├── store/
│   │   ├── useSessionStore.js      # État combat (Zustand)
│   │   └── useCampaignStore.js     # Campagne active (Zustand)
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Characters.jsx / CharacterSheet.jsx
│   │   ├── Npcs.jsx / NpcSheet.jsx
│   │   ├── Locations.jsx
│   │   ├── Lore.jsx
│   │   └── PublicLore.jsx
│   ├── components/
│   │   ├── dashboard/              # InitiativeTracker, DiceRoller, AmbiancePlayer...
│   │   ├── character/              # StatsBlock, FactionsGrid, FeaturesList...
│   │   ├── npc/                    # StatBlock, TacticsMJ
│   │   └── shared/                 # PortraitUpload, HpBar, PublishToggle
│   └── hooks/
│       ├── useCharacters.js
│       ├── useNpcs.js
│       ├── useLocations.js
│       └── useSessions.js
├── supabase/
│   └── schema.sql                  # Schéma complet — coller dans Supabase
├── .env.local                      # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── package.json
└── vite.config.js
```

---

## Tables de la base de données

| Table | Rôle |
|---|---|
| `campaigns` | Campagnes, appartiennent à un MJ |
| `campaign_members` | Joueurs invités (email + magic link) |
| `characters` | Fiches PJ complètes |
| `npcs` | PNJ et monstres (tactics_mj privé) |
| `locations` | Lieux |
| `location_states` | Un lieu à différents moments |
| `factions` | Les 9 factions + custom |
| `sessions` | Sessions + snapshot combat + playlist |
| `items` | Objets pour le site public |
| `relations` | Graphe générique entre entités |

**RLS (sécurité)** :
- MJ → accès total à sa campagne
- Joueur → sa fiche PJ + entités `is_public = true`
- Anonyme → uniquement `is_public = true`

---

## Ce qui existe déjà

| Élément | État |
|---|---|
| Fiche perso joueur | Template LaTeX + PDF vierge ✓ |
| Fiche PNJ / Bestiaire | Template LaTeX + exemple Gardien de Pierre ✓ |
| Dashboard MJ | Prototype HTML/JS fonctionnel ✓ |
| Schéma SQL | Complet (`schema.sql`) ✓ |
| Structure dossiers | Définie ✓ |

---

## Comment démarrer avec une nouvelle instance de Claude

Donne-lui **ce fichier + `schema.sql` + les deux PDFs** et dis-lui sur quoi travailler :

- **Environnement** : "Aide-moi à initialiser React + Vite et connecter Supabase"
- **Dashboard** : "Porte le dashboard MJ prototype en React" (joins le HTML du prototype)
- **Fiches PJ** : "Crée CharacterSheet.jsx qui lit et édite un PJ depuis Supabase"
- **Auth** : "Implémente l'auth : compte MJ + magic link joueurs"
- **Export PDF** : "Implémente l'export PDF d'une fiche PJ avec react-pdf"

---

*Généré lors d'une session de conception avec Claude — The Sideria Codex, mai 2026*
*Toutes les décisions sont finalisées. Prêt pour la phase de développement.*
