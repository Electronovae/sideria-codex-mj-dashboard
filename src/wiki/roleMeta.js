// Contenu curatorial du wiki joueurs, écrit à la main (pas de donnée de jeu, pas en base).
// Clé = nom exact de la classe tel que stocké dans classes_sideria.nom.
// couleur : une teinte parmi celles déjà utilisées ailleurs dans l'appli (factions, etc.),
// juste pour distinguer visuellement les archétypes dans la liste.

export const META_CLASSES = {
  "L'Affiné": {
    accroche: "Une énergie interne plutôt qu'un sort. Frappe, esquive, disparaît.",
    tags: ['Corps à corps', 'Mobilité', 'Sans sorts'],
    couleur: '#9c3a2e',
  },
  'Le Conduit': {
    accroche: "L'Éther le traverse sans filtre. Puissant, mais le risque de Cristallite guette.",
    tags: ['Lanceur de sorts', 'Puissance brute', 'Risqué'],
    couleur: '#1c2b45',
  },
  "L'Élémentaliste": {
    accroche: 'Feu, foudre, glace ou tempête : la magie la plus lisible de Sidéria.',
    tags: ['Lanceur de sorts', 'Dégâts de zone', 'Simple à lire'],
    couleur: '#9c3a2e',
  },
  "L'Érudit": {
    accroche: 'La magie comme système à maîtriser. Cinq domaines, beaucoup de flexibilité.',
    tags: ['Lanceur de sorts', 'Polyvalent', 'Technique'],
    couleur: '#1c2b45',
  },
  "L'Éveillé": {
    accroche: 'Il ne lance pas de sort, il brûle sa propre vitalité. Instinctif et dangereux.',
    tags: ['Lanceur de sorts', 'Magie instinctive', 'Risqué'],
    couleur: '#9c3a2e',
  },
  'Le Filateur': {
    accroche: 'Les mots font les choses. Information, manipulation, ou combat en duel.',
    tags: ['Soutien', 'Social', 'Polyvalent'],
    couleur: '#3f7d5c',
  },
  'Le Forgeur': {
    accroche: "L'ingénieur-mage. Infusions, canon de bataille, compagnon mécanique ou alchimie.",
    tags: ['Artisanat', 'Polyvalent', 'Technique'],
    couleur: '#c9a227',
  },
  'Le Fracturé': {
    accroche: 'Douleur, colère ou peur transformées en puissance brute. Simple et efficace.',
    tags: ['Corps à corps', 'Encaisse les dégâts', 'Simple à jouer'],
    couleur: '#9c3a2e',
  },
  'Le Juré': {
    accroche: "Lié par un serment plutôt qu'une divinité. Soigne, protège, châtie.",
    tags: ['Soutien', 'Soins', 'Résistant'],
    couleur: '#3f7d5c',
  },
  'Le Lié': {
    accroche: "Sa magie vient d'une connexion à quelque chose de plus grand. Le pilier du groupe.",
    tags: ['Soutien', 'Soins', 'Lanceur de sorts'],
    couleur: '#3f7d5c',
  },
  "L'Ombre": {
    accroche: "L'information vaut plus que la force. Traque, infiltre, frappe, disparaît.",
    tags: ['Discrétion', 'Dégâts ciblés', 'Investigation'],
    couleur: '#1c2b45',
  },
  'Le Résonant': {
    accroche: 'Relation symbiotique avec la nature. Métamorphose en bête ou en élémentaire.',
    tags: ['Métamorphose', 'Nature', 'Polyvalent'],
    couleur: '#3f7d5c',
  },
  'Le Scellé': {
    accroche: "Un pacte avec quelque chose d'incompris. Charges de Pacte, peu mais souvent.",
    tags: ['Lanceur de sorts', 'Pacte', 'Ressource rapide'],
    couleur: '#1c2b45',
  },
  'Le Traceur': {
    accroche: "Le mouvement et l'Éther se confondent. Téléportation courte et frappes précises.",
    tags: ['Corps à corps', 'Mobilité', 'Magie légère'],
    couleur: '#c9a227',
  },
  'Le Traqueur': {
    accroche: 'Traces, régularités, angles morts : le monde lui parle. Traque et survie.',
    tags: ['Corps à corps/distance', 'Traque', 'Survie'],
    couleur: '#3f7d5c',
  },
  'La Lame': {
    accroche: "Pas de magie, juste la discipline et l'acier. Force brute, tactique ou précision.",
    tags: ['Corps à corps', 'Simple à jouer', 'Tactique'],
    couleur: '#9c3a2e',
  },
}

export const metaClasse = (nom) => META_CLASSES[nom] || { accroche: '', tags: [], couleur: 'var(--gris)' }
