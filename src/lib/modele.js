import { versJour } from './calendrier.js'

export const uid = (p = 'x') => p + '_' + Math.random().toString(36).slice(2, 9)

// ── Gabarits d'entités ──────────────────────────────────────
export const nouveauPnj = () => ({
  id: uid('pnj'), nom: 'Nouveau PNJ', role: '', faction: null,
  description: '', secrets: '', repliques: [],
  arbre: null, // rempli par nouvelArbre() à la demande
})

export const nouvelArbre = () => ({
  compteur: { nom: 'Compteur', min: 0, max: 8, initial: 0, description: '',
    seuils: [{ jusqua: 4, libelle: 'Calme', couleur: 'vert' }, { jusqua: 8, libelle: 'Rupture', couleur: 'rouge' }],
    evenements: [] },
  noeuds: [{ id: 'n0', type: 'etat', phase: 0, titre: 'État initial', description: '', replique: '', condition: '' }],
  transitions: [],
})

export const nouveauJoueur = () => ({
  id: uid('pj'), joueur: '', personnage: 'Nouveau personnage', classe: '', niveau: 1,
  faction: null, notes: '',
  reputations: {},      // factionId -> -4..+4
  interactions: [],     // { id, date (jour sidérien|null), pnjId, resume, effet }
})

export const nouvelleFaction = () => ({
  id: uid('fac'), nom: 'Nouvelle faction', couleur: '#a3512e', devise: '',
  description: '', objectifs: '', ressources: '', chefIds: [],
})

export const nouvelEvenement = () => ({
  id: uid('evt'), titre: 'Nouvel événement', desc: '', debut: versJour(312), fin: null,
  participants: [], factionId: null, importance: 2, campagneId: null,
  arcId: null, symbole: 'losange', couleur: null,
})

export const nouvelArc = () => ({
  id: uid('arc'), nom: 'Nouvel arc', couleur: '#6b5b95', description: '',
  debut: versJour(312), fin: versJour(314),
})

export const SYMBOLES = ['losange', 'cercle', 'carre', 'etoile', 'triangle']

// Migration douce : garantit les champs ajoutés au fil des versions.
export const normaliser = (u) => {
  u.arcs ||= []
  u.evenements.forEach(e => { e.arcId ??= null; e.symbole ??= 'losange'; e.couleur ??= null })
  return u
}

export const nouvelleCampagne = () => ({
  id: uid('cmp'), code: '', titre: 'Nouvelle campagne', factionId: null, saison: 1,
  pitch: '', ton: '', depart: 'M0', duree: '', niveaux: '',
  actes: [],            // { id, titre, resume, pivot }
  pnjIds: [], issues: '',
})

// ── Univers de départ (seed minimal, tout est éditable) ─────
export const universInitial = () => ({
  meta: {
    nom: 'Sidéria : L\'Ère de l\'Éther', version: 1,
    these: 'Sidéria est la cause de sa propre fin. L\'histoire est de décider ce qui mérite d\'être sauvé, et à quel prix.',
    saisons: [
      { num: 1, titre: 'La Ville qui Gronde', question: 'À qui appartient ta colère ?', horloge: 'M0-M8', niveaux: '8-18' },
      { num: 2, titre: 'Les Fils Coupés', question: 'À qui appartient ta loyauté ?', horloge: 'M9-M15', niveaux: '16-28' },
      { num: 3, titre: 'La Déchirure', question: 'Qu\'est-ce qui mérite de survivre ?', horloge: 'M16-M24', niveaux: '26-40' },
    ],
  },
  factions: [
    { id: 'vouivre', nom: 'Vouivre de Jaïs', couleur: '#2f2f3a', devise: '', description: 'Guilde des Bas-Fonds.', objectifs: '', ressources: '', chefIds: ['ossel'] },
    { id: 'dragon', nom: 'Dragon Blanc', couleur: '#5b7fa6', devise: '', description: 'Guilde-hospice.', objectifs: '', ressources: '', chefIds: ['ryn'] },
    { id: 'conseil', nom: 'Conseil des Sept', couleur: '#c9a227', devise: '', description: '', objectifs: '', ressources: '', chefIds: [] },
    { id: 'inquisition', nom: 'Inquisition', couleur: '#5a3a6e', devise: '', description: '', objectifs: '', ressources: '', chefIds: ['vane'] },
    { id: 'mouvement', nom: 'Mouvement des Engrenages', couleur: '#a3512e', devise: '', description: '', objectifs: '', ressources: '', chefIds: [] },
    { id: 'monde', nom: 'Monde', couleur: '#8a8272', devise: '', description: 'Entités hors faction.', objectifs: '', ressources: '', chefIds: [] },
  ],
  pnjs: [
    { id: 'silas', nom: 'Maître Silas', role: 'Le commanditaire', faction: 'conseil', description: '', secrets: 'Contrôle secrètement les deux guildes.', repliques: [], arbre: null },
    { id: 'ossel', nom: 'Ossel', role: 'Chef de la Vouivre', faction: 'vouivre', description: '', secrets: '', repliques: [], arbre: null },
    { id: 'ryn', nom: 'Ryn Pale', role: 'Cheffe du Dragon Blanc', faction: 'dragon', description: '', secrets: '', repliques: [], arbre: null },
    { id: 'vane', nom: 'Inquisitrice Vane', role: 'Cheffe de l\'Inquisition', faction: 'inquisition', description: '', secrets: '', repliques: [], arbre: null },
    { id: 'kael', nom: 'Kaël', role: 'Officier de terrain', faction: 'monde', description: '', secrets: '', repliques: [], arbre: null },
    { id: 'maret', nom: 'Maret', role: 'Organisatrice, Aile du Piston', faction: 'mouvement', description: '', secrets: '', repliques: [], arbre: null },
  ],
  joueurs: [],
  arcs: [],
  evenements: [
    { id: 'evt_s0', titre: 'Saison 0 : Convergence', desc: 'La table ouverte au Dragon Blanc.', debut: versJour(312, 0, 16), fin: null, participants: ['silas', 'ryn', 'maret'], factionId: 'dragon', importance: 3, campagneId: null },
  ],
  campagnes: [],
})
