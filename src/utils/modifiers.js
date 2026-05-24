// Calcul du modificateur à partir du score brut
export const getMod = (score) => Math.floor((score - 10) / 2)

// Modificateur avec signe (+2, -1, etc.)
export const getSignedMod = (score) => {
  const mod = getMod(score)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

// Bonus de maîtrise selon le niveau total
export const getProficiencyBonus = (level) => Math.ceil(level / 4) + 1

// Valeur d'une compétence (mod stat + maîtrise éventuelle)
export const getSkillValue = (score, proficiency, proficiencyBonus) => {
  const mod = getMod(score)
  if (proficiency === 2) return mod + proficiencyBonus * 2  // expertise
  if (proficiency === 1) return mod + proficiencyBonus       // maîtrise
  return mod
}

// Liste des compétences avec leur stat associée
export const SKILLS = [
  { key: 'acrobaties',     stat: 'dex', label: 'Acrobaties' },
  { key: 'arcanes',        stat: 'int', label: 'Arcanes' },
  { key: 'athletisme',     stat: 'for', label: 'Athlétisme' },
  { key: 'discretion',     stat: 'dex', label: 'Discrétion' },
  { key: 'dressage',       stat: 'sag', label: 'Dressage' },
  { key: 'escamotage',     stat: 'dex', label: 'Escamotage' },
  { key: 'histoire',       stat: 'int', label: 'Histoire' },
  { key: 'intimidation',   stat: 'cha', label: 'Intimidation' },
  { key: 'investigation',  stat: 'int', label: 'Investigation' },
  { key: 'medecine',       stat: 'sag', label: 'Médecine' },
  { key: 'nature',         stat: 'int', label: 'Nature' },
  { key: 'perception',     stat: 'sag', label: 'Perception' },
  { key: 'perspicacite',   stat: 'sag', label: 'Perspicacité' },
  { key: 'persuasion',     stat: 'cha', label: 'Persuasion' },
  { key: 'religion',       stat: 'int', label: 'Religion' },
  { key: 'representation', stat: 'cha', label: 'Représentation' },
  { key: 'survie',         stat: 'sag', label: 'Survie' },
  { key: 'tromperie',      stat: 'cha', label: 'Tromperie' },
  { key: 'ether',          stat: 'int', label: 'Éther' },
]

// Noms affichés des stats
export const STAT_LABELS = {
  for: 'FOR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  sag: 'SAG',
  cha: 'CHA',
  ecl: 'ECL',
}