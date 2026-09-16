# Changements apportés à Sidéria Studio

Dossier basé sur la branche `electronovae` du repo `Electronovae/sideria-codex-mj-dashboard`.
Pas de `.git` ni `node_modules` dans ce dossier : à copier par-dessus ton clone local,
puis `npm install` et `git diff` pour vérifier avant de commit.

## 1. Saisons : "question" → "enjeux" + "résumé"
- `src/lib/modele.js` : migration douce (`normaliser()`) qui renomme `question` en `enjeux`
  et ajoute `resume` sur les saisons existantes. Seed initial mis à jour.
- `src/modules/Campagnes.jsx` : le formulaire de saison a maintenant deux zones de texte
  (Enjeux, Résumé) avec aperçu markdown, au lieu d'un simple champ "Question dramatique".
- `src/lib/obsidian.js` : export Obsidian mis à jour en conséquence.

## 2. Sessions liées aux joueurs présents
- `src/lib/modele.js` : `nouvelleSession()` a un champ `joueurIds: []`, migration douce
  pour les sessions existantes.
- `src/modules/Campagnes.jsx` : section "Joueurs présents" dans l'éditeur de session
  (réutilise le composant `PucesJoueurs` existant), affiché aussi en Mode Session et
  dans la carte résumé de chaque session.
- `src/modules/Frise.jsx` : une pastille "🎲 présent à la session" apparaît sur la ligne
  du joueur concerné, à la date de la session.
- `src/modules/Joueurs.jsx` : nouvelle section "Sessions jouées" dans la fiche du
  personnage, calculée automatiquement à partir des sessions cochées.
- `src/modules/Graphe.jsx` : lien PJ ↔ session ajouté dans le graphe global.
- `src/lib/obsidian.js` : export Markdown du PJ liste désormais ses sessions jouées.

## 3. Markdown fonctionnel dans les zones de texte
- `src/modules/communs.jsx` : le composant `Texte` (déjà utilisé partout pour les
  wikilinks) gère maintenant `# ## ###` (titres), `**gras**`, `*italique*` et les listes
  `- item`, en plus des `[[wikilinks]]`. Pas de dépendance ajoutée (parseur maison léger).
  Ça s'applique automatiquement partout où `<Texte>` est déjà utilisé (Codex, Mode
  Session, Rapports, Saisons, Lignes de force...).
- Ajustement : comme `Texte` produit désormais des blocs (`<p>`, `<h4>`, `<ul>`...), les
  `<p>` qui l'entouraient ont été changés en `<div>` pour rester du HTML valide
  (`Campagnes.jsx`, `Codex.jsx`).

## 4. Factions : joueurs dans l'organigramme
- `src/lib/modele.js` : nouveau champ `superieurId` sur les joueurs (contact/supérieur
  PNJ dans la faction, optionnel), migration douce.
- `src/modules/Joueurs.jsx` : sélecteur "Contact / supérieur dans la faction".
- `src/modules/Factions.jsx` : l'organigramme intègre maintenant les PJ, soit rattachés
  à leur contact PNJ (bordure en tirets pour les distinguer des PNJ), soit affichés à la
  racine s'ils n'ont pas de contact précisé. L'ancienne liste séparée "Personnages
  joueurs affiliés" a été retirée (redondante).

## 5. Lieux : refonte + interconnexion
- `src/modules/communs.jsx` : nouvelle fonction transverse `trouverBacklinks(univers,
  cible)` qui scanne les champs texte de toutes les entités (PNJ, PJ, factions, lieux,
  campagnes, événements, arcs) à la recherche de `[[wikilinks]]` pointant vers une
  entité donnée. Réutilisable au-delà des lieux si besoin plus tard.
- `src/modules/Graphe.jsx` : nouveau composant exporté `MiniGraphe`, une version statique
  et légère (disposition en cercle, pas de simulation physique complète) du graphe
  Obsidian, centrée sur une seule entité et ses voisins directs.
- `src/modules/Lieux.jsx` : refonte de la fiche lieu avec :
  - fil d'ariane hiérarchique cliquable (parent / contient),
  - section "Liens" listant tous les rattachements directs et liens retour,
  - section "Graphe local" avec le mini-graphe embarqué,
  - liste des lieux groupée par type dans la colonne de gauche,
  - aperçu markdown de la description.

## 6. Icônes de statut pour les sessions
- `src/lib/modele.js` : nouveau champ `statut` sur la session (`'ecriture' | 'ecrite' |
  'realisee'`), avec la constante exportée `STATUTS_SESSION` (valeur, libellé, icône).
  Migration douce : les sessions déjà présentes reçoivent un statut déduit par
  heuristique (jouée si des joueurs sont cochés présents, écrite si résumé/prépa déjà
  remplis, sinon en cours d'écriture) — à corriger à la main si l'heuristique se trompe.
  - ✏️ en cours d'écriture
  - 📗 écrite
  - ✅ réalisée
- L'icône apparaît partout où une session est listée : sidebar, carte session dans la
  fiche campagne, en-tête de l'éditeur de session, fiche Codex de la campagne.
- Dans l'éditeur de session, un menu déroulant "Statut" permet de le changer.

## 7. Plein écran pour les arbres narratifs
- `src/modules/ArbreEditeur.jsx` : bouton "⛶ Plein écran" (et touche Échap pour sortir).
  Le canevas passe en overlay occupant tout le viewport ; la hauteur, auparavant codée
  en dur à 480px à plusieurs endroits, est désormais mesurée dynamiquement.

## 8. Écran scindé (deux panneaux indépendants)
- `src/App.jsx` : bouton "◨ Écran scindé" dans l'en-tête. Coupe la zone principale en
  deux colonnes côte à côte (adapté aux écrans larges type 21:9), chacune avec son
  propre sélecteur d'onglet. Les deux panneaux partagent les mêmes données (`univers`),
  mais ont chacun leur propre navigation : cliquer un `[[wikilink]]` ou un lien du Codex
  dans un panneau l'ouvre dans ce même panneau, jamais dans l'autre.
- Pas de persistance du choix (ni l'activation, ni les deux onglets sélectionnés) :
  chaque session repart sur l'affichage simple, un seul panneau, comme avant.
- `src/styles.css` : styles `.scinde` / `.panneau` / `.barre-panneau` / `.contenu-panneau`.

## Points d'attention avant de merger
- Le modèle `evenement` n'a pas de champ `lieuId` : je n'ai donc pas ajouté de section
  "Événements ici" dans la fiche Lieu pour ne pas afficher une fonctionnalité fantôme.
  Si tu veux relier des événements à des lieux, c'est un chantier à part (ajout d'un
  champ `lieuId` au modèle événement + UI de sélection).
- Le build (`npm run build`) passe sans erreur avec ces changements.
