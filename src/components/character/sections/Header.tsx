interface Props {
  character: any
  update: (field: string, value: any) => void
}

export default function Header({ character, update }: Props) {
  return (
    <div className="box">
      <div className="bt">Identité</div>
      <div className="bb">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div className="field">
              <label>Nom :</label>
              <input className="field-input" style={{ fontSize: '12pt', fontWeight: 600 }}
                value={character.name || ''}
                onChange={e => update('name', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Classe :</label>
                <input className="field-input"
                  value={character.class_primary?.name || ''}
                  readOnly
                  style={{ color: 'var(--blue)', fontWeight: 600 }} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Subclasse :</label>
                <input className="field-input"
                  value={character.subclass_primary_id || ''}
                  onChange={e => update('subclass_primary_id', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Origine :</label>
                <input className="field-input"
                  value={character.origin || ''}
                  onChange={e => update('origin', e.target.value)} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {[
              { label: 'NIV. SID.', value: character.level, field: 'level' },
              { label: 'XP', value: character.xp, field: 'xp' },
              { label: 'INIT.', value: character.initiative_bonus >= 0 ? `+${character.initiative_bonus}` : character.initiative_bonus, field: null },
              { label: 'DR', value: `+${character.proficiency_bonus}`, field: null },
            ].map(({ label, value, field }) => (
              <div key={label} className="identity-stat">
                <span className="identity-stat-label">{label}</span>
                {field ? (
                  <input
                    className="field-input sm"
                    style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '10pt', color: 'var(--blue)', border: '1px solid var(--blue)', borderRadius: '2px', background: 'var(--parch-mid)', textAlign: 'center', width: '36px', padding: '1px 0' }}
                    type="number"
                    value={character[field] ?? 0}
                    onChange={e => update(field, parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <span className="identity-stat-value">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
