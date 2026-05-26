import { getMod, getSignedMod, STAT_LABELS } from '../../../utils/modifiers'

interface Props {
  stats: Record<string, number>
  savingThrows: Record<string, number>
  proficiencyBonus: number
  updateJson: (field: string, key: string, value: any) => void
}

export default function SavingThrows({ stats, savingThrows, proficiencyBonus, updateJson }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '12px', color: '#aaa', textTransform: 'uppercase' }}>
        Jets de sauvegarde
      </h3>
      {Object.entries(STAT_LABELS).map(([key, label]) => {
        const proficient = !!savingThrows[key]
        const value = getMod(stats[key] ?? 10) + (proficient ? proficiencyBonus : 0)
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={proficient}
              onChange={e => updateJson('saving_throw_proficiencies', key, e.target.checked ? 1 : 0)}
            />
            <span style={{ width: '28px', fontSize: '13px', fontWeight: 'bold' }}>
              {value >= 0 ? `+${value}` : value}
            </span>
            <span style={{ fontSize: '12px', color: '#ccc' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}