import { versJour } from './calendrier.js'

export const uid = () => crypto.randomUUID()

// ── Gabarits d'entités ──────────────────────────────────────
export const nouveauPnj = () => ({
  id: uid('pnj'), nom: 'Nouveau PNJ', role: '', factionIds: [], rolesFactions: {},
  poste: '', superieurId: null, compteurs: [], image: '',
  description: '', secrets: '', repliques: [],
  arbre: null, // rempli par nouvelArbre() à la demande
})

export const nouveauCompteur = () => ({
  id: uid('cpt'), nom: 'Compteur', min: 0, max: 8, valeur: 0, description: '',
  seuils: [{ jusqua: 4, libelle: 'Calme', couleur: 'vert' }, { jusqua: 8, libelle: 'Rupture', couleur: 'rouge' }],
  evenements: [],   // { label, delta }
})

export const nouvelArbre = () => ({
  noeuds: [{ id: 'n0', type: 'etat', phase: 0, titre: 'État initial', description: '', x: 60, y: 40 }],
  transitions: [],
})

export const nouveauJoueur = () => ({
  id: uid('pj'), joueur: '', personnage: 'Nouveau personnage', classe: '', niveau: 1,
  faction: null, superieurId: null, notes: '', secrets: '', citations: [],
  reputations: {},      // factionId -> -4..+4
  historique: [],       // { id, type, date, pnjId, lieuId, resume, effet }
  characterId: null,    // uuid vers characters.id (fiche technique réelle) ; quand renseigné,
                         // personnage/joueur/classe/niveau sont synchronisés automatiquement depuis elle
})

export const TYPES_HISTORIQUE = ['interaction', 'combat', 'lieu', 'révélation', 'autre']

export const nouvelleEntreeHistorique = () => ({
  id: uid('his'), type: 'interaction', date: null, pnjId: null, lieuId: null, campagneId: null, sessionId: null, resume: '', effet: '',
})

export const nouveauLieu = () => ({
  id: uid('lieu'), nom: 'Nouveau lieu', type: 'quartier', factionId: null,
  parentId: null, description: '', secrets: '',
})

export const TYPES_LIEU = ['région', 'ville', 'quartier', 'bâtiment', 'site']

export const nouveauRapport = () => ({
  id: uid('rap'), titre: 'Nouveau rapport', type: 'rapport', date: null,
  auteurId: null, factionId: null, visibleJoueurs: false, contenu: '',
})

export const TYPES_RAPPORT = ['rapport', 'une de journal', 'lettre', 'note', 'décret', 'témoignage']

export const CARAS = ['for', 'dex', 'con', 'int', 'sag', 'cha', 'ecl']

export const nouvelleCreature = () => ({
  id: uid('crea'), code: '', nom: 'Nouvelle créature', rang: '', type: '', alignement: '',
  factionId: null, equilibre: false,
  ca: null, caDetail: '', pv: null, pvDetail: '', vitesse: '',
  stats: Object.fromEntries(CARAS.map(c => [c, { val: 10, mod: 0 }])),
  jetsSauvegarde: '', competences: '', immunites: '', resistances: '', sens: '', langues: '',
  facteurPuissance: null,
  equipement: { armure: '', armePrincipale: '', armeSecondaire: '', equipement: '' },
  actions: [], actionsBonus: [], reactions: [], capacites: [], // { nom, description }
  tactiqueMj: '', promptImage: '', lore: '', image: '',
})

export const nouvelleFaction = () => ({
  id: uid('fac'), nom: 'Nouvelle faction', couleur: '#a3512e', devise: '',
  histoire: '', description: '', objectifs: '', ressources: '', secrets: '', chefId: null,
})

export const nouvelEvenement = () => ({
  id: uid('evt'), titre: 'Nouvel événement', desc: '', debut: versJour(312), fin: null,
  participants: [], joueurIds: [], factionId: null, importance: 2, campagneId: null,
  arcId: null, symbole: 'losange', couleur: null, sessionId: null,
})

export const nouvelArc = () => ({
  id: uid('arc'), nom: 'Nouvel arc', couleur: '#6b5b95', description: '',
  debut: versJour(312), fin: versJour(314),
})

export const SYMBOLES = ['losange', 'cercle', 'carre', 'etoile', 'triangle']

// Migration douce : garantit les champs ajoutés au fil des versions.
export const normaliser = (u) => {
  u.arcs ||= []
  u.lieux ||= []
  u.rapports ||= []
  u.creatures ||= []
  u.creatures.forEach(c => {
    c.code ??= ''; c.rang ??= ''; c.type ??= ''; c.alignement ??= ''
    c.factionId ??= null; c.equilibre ??= false
    c.ca ??= null; c.caDetail ??= ''; c.pv ??= null; c.pvDetail ??= ''; c.vitesse ??= ''
    c.stats ??= Object.fromEntries(CARAS.map(k => [k, { val: 10, mod: 0 }]))
    CARAS.forEach(k => { c.stats[k] ??= { val: 10, mod: 0 } })
    c.jetsSauvegarde ??= ''; c.competences ??= ''; c.immunites ??= ''; c.resistances ??= ''
    c.sens ??= ''; c.langues ??= ''; c.facteurPuissance ??= null
    c.equipement ??= { armure: '', armePrincipale: '', armeSecondaire: '', equipement: '' }
    c.actions ||= []; c.actionsBonus ||= []; c.reactions ||= []; c.capacites ||= []
    c.tactiqueMj ??= ''; c.promptImage ??= ''; c.lore ??= ''; c.image ??= ''
  })
  u.meta.lignesForce ||= []      // { id, titre, description }
  u.meta.arbitrages ||= []       // { id, date, titre, decision }
  u.evenements.forEach(e => { e.arcId ??= null; e.symbole ??= 'losange'; e.sessionId ??= null; e.joueurIds ||= []; delete e.couleur })
  u.campagnes.forEach(c => {
    c.sessions ||= []
    c.arcId ??= null
    delete c.depart
    c.sessions.forEach(s => {
      s.sections ||= []
      s.joueurIds ||= []
      s.sections.forEach(sec => {
        if (sec.description === undefined) sec.description = sec.contenu || ''
        sec.notesMJ ??= ''
        delete sec.contenu
      })
      // Heuristique pour les sessions déjà créées : à ajuster manuellement au besoin.
      s.statut ??= (s.joueurIds.length > 0 ? 'realisee' : (s.resume || s.sections.length ? 'ecrite' : 'ecriture'))
    })
  })
  u.meta.saisons.forEach(s => {
    if (s.enjeux === undefined) s.enjeux = s.question || ''
    s.resume ??= ''
    delete s.question
  })
  u.factions.forEach(f => {
    if (f.chefId === undefined) f.chefId = (f.chefIds && f.chefIds[0]) || null
    delete f.chefIds
    f.histoire ??= ''
    f.secrets ??= ''
  })
  u.pnjs.forEach(p => {
    p.poste ??= ''; p.superieurId ??= null; p.compteurs ||= []; p.image ??= ''
    if (p.factionIds === undefined) p.factionIds = (p.faction != null ? [p.faction] : [])
    delete p.faction
    p.rolesFactions ??= {}
    p.compteurs.forEach(c => { c.valeur ??= c.min ?? 0; c.seuils ||= []; c.evenements ||= [] })
    if (p.arbre) {
      // migration : le compteur intégré à l'arbre devient un compteur personnalisé du PNJ
      if (p.arbre.compteur) {
        const c = p.arbre.compteur
        p.compteurs.push({
          id: uid('cpt'), nom: c.nom || 'Compteur', min: c.min ?? 0, max: c.max ?? 8,
          valeur: c.valeur ?? c.initial ?? c.min ?? 0, description: c.description || '',
          seuils: c.seuils || [], evenements: c.evenements || [],
        })
        delete p.arbre.compteur
      }
      const parPhase = {}
      p.arbre.noeuds.forEach(n => {
        if (n.x == null || n.y == null) {
          const ph = n.phase || 0
          parPhase[ph] = (parPhase[ph] || 0) + 1
          n.x = 60 + ph * 240
          n.y = 40 + (parPhase[ph] - 1) * 100
        }
      })
    }
  })
  u.joueurs.forEach(j => {
    j.citations ||= []
    j.secrets ??= ''
    j.superieurId ??= null
    if (!j.historique) {
      j.historique = (j.interactions || []).map(i => ({
        id: i.id || uid('his'), type: 'interaction', date: i.date ?? null,
        pnjId: i.pnjId || null, lieuId: null, campagneId: null, sessionId: null, resume: i.resume || '', effet: i.effet || '',
      }))
    }
    j.historique.forEach(it => { it.campagneId ??= null; it.sessionId ??= null })
    delete j.interactions
  })
  return u
}

export const nouvelleCampagne = () => ({
  id: uid('cmp'), code: '', titre: 'Nouvelle campagne', factionId: null, saison: 1,
  arcId: null, pitch: '', ton: '', duree: '', niveaux: '',
  actes: [],            // { id, titre, resume, pivot }
  sessions: [],         // { id, code, titre, date, resume }
  pnjIds: [], issues: '',
})

// Statuts de session, utilisés partout où une session est affichée (liste, éditeur, frise).
export const STATUTS_SESSION = [
  { val: 'ecriture', label: "en cours d'écriture", icone: '✏️' },
  { val: 'ecrite', label: 'écrite', icone: '📗' },
  { val: 'realisee', label: 'réalisée', icone: '✅' },
]

export const nouvelleSession = () => ({
  id: uid('ses'), code: '', titre: 'Nouvelle session', date: null, resume: '',
  statut: 'ecriture',  // voir STATUTS_SESSION : 'ecriture' | 'ecrite' | 'realisee'
  joueurIds: [],  // présents à la table pour cette session
  sections: [],   // { id, titre, description, notesMJ } : une "scène" — description lue aux joueurs, notesMJ gardées pour soi
})

// ── Univers de départ (seed minimal, tout est éditable) ─────
export const universInitial = () => ({
  meta: {
    nom: 'Sidéria : L\'Ère de l\'Éther', version: 1,
    these: 'Sidéria est la cause de sa propre fin. L\'histoire est de décider ce qui mérite d\'être sauvé, et à quel prix.',
    saisons: [
      { num: 1, titre: 'La Ville qui Gronde', enjeux: 'À qui appartient ta colère ?', resume: '', horloge: 'M0-M8', niveaux: '8-18' },
      { num: 2, titre: 'Les Fils Coupés', enjeux: 'À qui appartient ta loyauté ?', resume: '', horloge: 'M9-M15', niveaux: '16-28' },
      { num: 3, titre: 'La Déchirure', enjeux: 'Qu\'est-ce qui mérite de survivre ?', resume: '', horloge: 'M16-M24', niveaux: '26-40' },
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
