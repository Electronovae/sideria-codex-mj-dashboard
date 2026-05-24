import { getMod, getSignedMod, STAT_LABELS } from '../../../utils/modifiers'
import '../CharacterSheet.css'

const STAT_SKILLS: Record<string, string[]> = {
  for: ['Athlétisme'],
  dex: ['Acrobaties', 'Escamotage', 'Discrétion'],
  con: [],
  int: ['Arcanes', 'Histoire', 'Investigation', 'Nature'],
  sag: ['Médecine', 'Perception', 'Perspicacité', 'Religion', 'Survie'],
  cha: ['Tromperie', 'Intimidation', 'Persuasion', 'Représentation'],
  ecl: [],
}

interface Props {
  stats: Record<string, number>
  skillProficiencies: Record<string, number>
  savingThrows: Record<string, number>
  proficiencyBonus: number
  updateJson: (field: string, key: string, value: any) => void
}

export default function CoreStats({ stats, skillProficiencies, savingThrows, proficiencyBonus, updateJson }: Props) {
  const cycleProficiency = (skillKey: string) => {
    const current = skillProficiencies[skillKey] ?? 0
    updateJson('skill_proficiencies', skillKey, (current + 1) % 3)
  }

  const toggleSave = (statKey: string) => {
    updateJson('saving_throw_proficiencies', statKey, savingThrows[statKey] ? 0 : 1)
  }

  return (
    <div className="box">
      <div className="bt">Caractéristiques</div>
      <div className="bb">
        <div className="stats-grid">
          {Object.entries(STAT_LABELS).map(([key, label]) => {
            const score = stats[key] ?? 10
            const mod = getMod(score)
            const saveVal = mod + (savingThrows[key] ? proficiencyBonus : 0)
            const skills = STAT_SKILLS[key] ?? []
            return (
              <div key={key} className="stat-block">
                <div className={`stat-name${key === 'ecl' ? ' ecl' : ''}`}>{label}</div>
                <div className="stat-mod">{getSignedMod(score)}</div>
                <div className="stat-score-wrap">
                  <input
                    type="number" min={1} max={30}
                    value={score}
                    onChange={e => updateJson('stats', key, parseInt(e.target.value) || 10)}
                    className="stat-score"
                  />
                </div>
                <div className="stat-skills">
                  {/* Jet de sauvegarde */}
                  <div className="skill-row save" onClick={() => toggleSave(key)} style={{ cursor: 'pointer' }}>
                    <span className={`circle${savingThrows[key] ? ' filled' : ''}${key === 'ecl' ? ' purple' : ''}`} />
                    <span className="skill-value">{saveVal >= 0 ? `+${saveVal}` : saveVal}</span>
                    <span className="skill-name">Sauv.</span>
                  </div>
                  {/* Compétences */}
                  {skills.map(skill => {
                    const sk = skill.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
                    const prof = skillProficiencies[sk] ?? 0
                    const val = mod + (prof === 2 ? proficiencyBonus * 2 : prof === 1 ? proficiencyBonus : 0)
                    return (
                      <div key={sk} className="skill-row" onClick={() => cycleProficiency(sk)} style={{ cursor: 'pointer' }}>
                        <span className={`circle${prof === 2 ? ' half-filled' : prof === 1 ? ' filled' : ''}`} />
                        <span className="skill-value">{val >= 0 ? `+${val}` : val}</span>
                        <span className="skill-name">{skill}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}