export function nouvelleFiche(nom) {
  return {
    name: nom || 'Sans nom',
    origin: '',
    level: 1,
    xp: 0,
    stats: { for: 10, dex: 10, con: 10, int: 10, sag: 10, cha: 10 },
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
  int: 'Intelligence', sag: 'Sagesse', cha: 'Charisme',
}

export const LIBELLES_FACTIONS = {
  academie: 'Académie', kessavar: 'Kessavar', flotte_drax: 'Flotte Drax',
  inquisition: 'Inquisition', conseil_sept: 'Conseil des Sept',
  dragon_blanc: 'Dragon Blanc', vouivre_jais: 'Vouivre Jais',
  serment_ether: "Serment d'Éther", culte_sans_nom: 'Culte sans Nom',
}

export function modificateur(valeur) {
  return Math.floor((Number(valeur ?? 10) - 10) / 2)
}
