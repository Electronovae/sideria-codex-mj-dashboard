export function nouvelleFiche(nom) {
  return {
    name: nom || 'Sans nom',
    origin: '',
    level: 1,
    xp: 0,
    stats: { for: 10, dex: 10, con: 10, int: 10, sag: 10, cha: 10, ecl: 10 },
    skill_proficiencies: {},
    saving_throw_proficiencies: {},
    hp_max: 0, hp_current: 0, hp_temp: 0,
    armor_class: 10, indice_defense: 10, initiative_bonus: 0, speed: 9,
    perception_passive: 10, sr_sort: 10,
    hit_dice_type: 8, hit_dice_remaining: 1,
    mana_max: 0, mana_current: 0, convertisseur_type: '',
    fragments_max: 0, fragments_current: 0, ressource_speciale_type: '',
    cristallite: 0,
    montees_caracteristique: [false, false, false, false, false, false, false, false, false, false],
    factions: {
      academie: 0, kessavar: 0, flotte_drax: 0, inquisition: 0, conseil_sept: 0,
      dragon_blanc: 0, vouivre_jais: 0, serment_ether: 0, culte_sans_nom: 0,
    },
    attacks: [],
    armor_name: '', shield_name: '', resistances: '',
    equipment: {},
    inventory: [],
    currency: { le: 0, pp: 0, po: 0, pa: 0, pc: 0, cristaux: 0 },
    personality_trait: '', ideal: '', bond: '', flaw: '', fear_redline: '',
    notes: '',
    death_saves_success: 0, death_saves_failure: 0, is_stable: false,
    conditions: [],
    languages: '', other_proficiencies: '',
    spark: { die: '1d8', current: 0, max: 3 },
    oath: { faction: '', statut: '', termes: '' },
    relations: { allies: [], enemies: [], debts: [] },
    peuple_id: null,
    historique_id: null,
    dons: [],
    sorts_connus: [],
  }
}

export const PALIERS_MONTEE = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39]

// Placeholder : liste à compléter avec les vrais peuples/origines de Sidéria.
// (le menu garde toujours la valeur existante d'un personnage même si elle n'est pas dans cette liste)
export const ORIGINES = [
  'Humain', 'Autre',
]

// Compétences liées à chaque caractéristique, pour l'affichage de la fiche.
export const COMPETENCES_PAR_CARAC = {
  for: ['athletisme'],
  dex: ['acrobaties', 'discretion', 'escamotage'],
  con: [],
  int: ['arcanes', 'histoire', 'investigation', 'nature'],
  sag: ['medecine', 'perception', 'perspicacite', 'religion', 'survie'],
  cha: ['tromperie', 'intimidation', 'persuasion', 'representation'],
  ecl: [],
}

export const LIBELLES_COMPETENCES = {
  athletisme: 'Athlétisme', acrobaties: 'Acrobaties', discretion: 'Discrétion',
  escamotage: 'Escamotage', arcanes: 'Arcanes', histoire: 'Histoire',
  investigation: 'Investigation', nature: 'Nature', medecine: 'Médecine',
  perception: 'Perception', perspicacite: 'Perspicacité', religion: 'Religion',
  survie: 'Survie', tromperie: 'Tromperie', intimidation: 'Intimidation',
  persuasion: 'Persuasion', representation: 'Représentation',
}

export const LIBELLES_CARAC = {
  for: 'Force', dex: 'Dextérité', con: 'Constitution',
  int: 'Intelligence', sag: 'Sagesse', cha: 'Charisme', ecl: 'Éclat',
}

export function modificateur(valeur) {
  return Math.floor((Number(valeur ?? 10) - 10) / 2)
}

// ---------------------------------------------------------------------------
// Progression : points de vie, sorts connus, montée de niveau
// ---------------------------------------------------------------------------

// PV au niveau 1 : 6 × (dé de vie de la classe + mod. CON), minimum 6.
export function pvNiveau1(deVie, con) {
  return Math.max(6, 6 * ((Number(deVie) || 8) + modificateur(con)))
}

// Gain de PV à la montée de niveau : 1 dé de vie + mod. CON, minimum 1.
export function lancerPvNiveau(deVie, con) {
  const de = 1 + Math.floor(Math.random() * (Number(deVie) || 8))
  return { de, total: Math.max(1, de + modificateur(con)) }
}

// Fragments gagnés à la montée de niveau : lit « 1d4/niveau » dans fragments_cadence (1d4 par défaut).
export function deFragments(classe) {
  const m = /(\d+)d(\d+)/i.exec(classe?.fragments_cadence || '')
  return m ? { nb: Number(m[1]), faces: Number(m[2]) } : { nb: 1, faces: 4 }
}
export function lancerFragments(classe) {
  const { nb, faces } = deFragments(classe)
  let total = 0
  for (let i = 0; i < nb; i++) total += 1 + Math.floor(Math.random() * faces)
  return total
}

export function estLanceurDeSorts(classe) {
  return !!classe && ((classe.sorts_max_depart ?? 0) > 0 || (classe.sorts_intervalle_niveaux ?? 0) > 0)
}

// Nombre de sorts qu'un personnage peut connaître :
// sorts de départ de sa classe + 1 sort tous les N niveaux au-delà du niveau 1 + bonus accordés par le MJ.
export function quotaSorts(classe, fiche) {
  if (!classe) return Math.max(0, fiche?.sorts_bonus ?? 0)
  const depart = classe.sorts_max_depart ?? 0
  const intervalle = classe.sorts_intervalle_niveaux ?? 0
  const niveau = Math.max(1, Number(fiche?.level) || 1)
  const gagnes = intervalle > 0 ? Math.floor((niveau - 1) / intervalle) : 0
  return Math.max(0, depart + gagnes + (fiche?.sorts_bonus ?? 0))
}

export function libelleIntervalle(intervalle) {
  if (!intervalle) return 'aucun sort gagné en montant de niveau'
  if (intervalle === 1) return '1 sort par niveau'
  return `1 sort tous les ${intervalle} niveaux`
}

export function nomCourtClasse(nomComplet) {
  return (nomComplet || '').replace(/^(Le |La |L')/, '')
}

// Sorts accessibles à une classe : tronc commun + sorts exclusifs mentionnant la classe.
export function sortsAccessibles(sorts, classes) {
  const noms = (Array.isArray(classes) ? classes : [classes]).filter(Boolean).map(c => nomCourtClasse(c.nom))
  return sorts.filter(s => {
    const st = s.sous_type || ''
    if (/tronc commun/i.test(st)) return true
    return noms.some(n => n && st.includes(n))
  })
}
