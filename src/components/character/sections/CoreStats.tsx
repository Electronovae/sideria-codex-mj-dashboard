import { getMod, getSignedMod, STAT_LABELS } from '../../../utils/modifiers'

const STAT_SKILLS: Record<string, Array<{ label: string; key: string }>> = {
  for: [{ label: 'Athlétisme', key: 'athletisme' }],
  dex: [
    { label: 'Acrobaties',  key: 'acrobaties' },
    { label: 'Escamotage',  key: 'escamotage' },
    { label: 'Discrétion',  key: 'discretion' },
  ],
  con: [],
  int: [
    { label: 'Arcanes',     key: 'arcanes' },
    { label: 'Histoire',    key: 'histoire' },
    { label: 'Investig.',   key: 'investigation' },
    { label: 'Nature',      key: 'nature' },
  ],
  sag: [
    { label: 'Médecine',    key: 'medecine' },
    { label: 'Perception',  key: 'perception' },
    { label: 'Perspicac.',  key: 'perspicacite' },
    { label: 'Religion',    key: 'religion' },
    { label: 'Survie',      key: 'survie' },
  ],
  cha: [
    { label: 'Tromperie',   key: 'tromperie' },
    { label: 'Intimidat.',  key: 'intimidation' },
    { label: 'Persuasion',  key: 'persuasion' },
    { label: 'Représent.',  key: 'representation' },
  ],
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
  const cycleProficiency = (key: string) => {
    const cur = skillProficiencies[key] ?? 0
    updateJson('skill_proficiencies', key, (cur + 1) % 3)
  }
  const toggleSave = (stat: string) => {
    updateJson('saving_throw_proficiencies', stat, savingThrows[stat] ? 0 : 1)
  }

  return (
    <div className="box" style={{ flex: 1, overflow: 'hidden' }}>
      <div className="bt">Caractéristiques</div>
      <div className="bb" style={{ padding: '2px 4px' }}>
        {Object.entries(STAT_LABELS).map(([key, label]) => {
          const score = stats[key] ?? 10
          const mod   = getMod(score)
          const isEcl = key === 'ecl'
          const saveVal = mod + (savingThrows[key] ? proficiencyBonus : 0)
          const skills  = STAT_SKILLS[key] ?? []

          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              borderBottom: '1px solid #d4c9a0', paddingBottom: '2px', marginBottom: '2px'
            }}>
              {/* Nom stat */}
              <div style={{
                width: '28px', flexShrink: 0,
                fontFamily: 'Cinzel, serif', fontSize: '6.5pt', fontWeight: 700,
                color: isEcl ? 'var(--purple)' : 'var(--blue)',
              }}>{label}</div>

              {/* Modificateur */}
              <div style={{
                width: '26px', flexShrink: 0, textAlign: 'center',
                fontFamily: 'Cinzel, serif', fontSize: '12pt', fontWeight: 700,
                color: isEcl ? 'var(--purple)' : 'var(--blue)',
                lineHeight: 1,
              }}>{getSignedMod(score)}</div>

              {/* Score éditable */}
              <input
                type="number" min={1} max={30} value={score}
                onChange={e => updateJson('stats', key, parseInt(e.target.value) || 10)}
                style={{
                  width: '30px', flexShrink: 0, textAlign: 'center',
                  border: '1px solid #bbb', borderRadius: '2px',
                  background: 'var(--parch-mid)', fontSize: '8.5pt',
                  color: 'var(--ink)', fontFamily: 'Crimson Pro, serif', outline: 'none',
                  padding: '1px 0',
                }}
              />

              {/* Jet de sauvegarde */}
              <div
                onClick={() => toggleSave(key)}
                style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer', flexShrink: 0 }}
              >
                <span className={`circle sm${isEcl ? ' ecl' : ''}${savingThrows[key] ? ' filled' : ''}`} />
                <span style={{
                  fontSize: '6.5pt', fontWeight: 700, width: '16px', textAlign: 'right',
                  color: 'var(--gray)',
                }}>
                  {saveVal >= 0 ? `+${saveVal}` : saveVal}
                </span>
              </div>

              {/* Compétences */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {isEcl && (
                  <div style={{ fontSize: '6pt', color: 'var(--purple)', fontStyle: 'italic' }}>
                    Cristallite · Conduit · Traceur
                  </div>
                )}
                {skills.map(({ label: sl, key: sk }) => {
                  const prof = skillProficiencies[sk] ?? 0
                  const val  = mod + (prof === 2 ? proficiencyBonus * 2 : prof === 1 ? proficiencyBonus : 0)
                  return (
                    <div key={sk}
                      onClick={() => cycleProficiency(sk)}
                      style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                    >
                      <span className={`circle sm${prof === 2 ? ' expertise' : prof === 1 ? ' filled' : ''}`} />
                      <span style={{ fontSize: '6.5pt', fontWeight: 700, width: '16px', textAlign: 'right' }}>
                        {val >= 0 ? `+${val}` : val}
                      </span>
                      <span style={{ fontSize: '6pt', color: 'var(--gray)' }}>{sl}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
