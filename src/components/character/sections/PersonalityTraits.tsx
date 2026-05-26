interface Props {
  character: any
  update:    (field: string, value: any) => void
}

const TRAITS = [
  { key: 'personality_trait', label: 'TRAIT DE CARACTÈRE' },
  { key: 'ideal',             label: 'IDÉAL' },
  { key: 'bond',              label: 'LIEN' },
  { key: 'flaw',              label: 'DÉFAUT / PEUR' },
]

export default function PersonalityTraits({ character, update }: Props) {
  return (
    <div className="box" style={{ flex: 1 }}>
      <div className="bt gold">Traits et roleplay</div>
      <div className="bb">
        {TRAITS.map(({ key, label }) => (
          <div key={key} className="trait-block">
            <div className="trait-label">{label}</div>
            <textarea
              className="trait-input"
              value={character[key] || ''}
              onChange={e => update(key, e.target.value)}
              rows={2}
            />
          </div>
        ))}
        <div className="trait-block" style={{ marginTop: '4px' }}>
          <div className="trait-label">NOTES LIBRES</div>
          <textarea
            className="trait-input"
            value={character.notes || ''}
            onChange={e => update('notes', e.target.value)}
            rows={4}
            style={{ borderBottom: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
