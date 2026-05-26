interface Props {
  character: any
  update: (field: string, value: any) => void
}

export default function DeathSaves({ character, update }: Props) {
  const toggleSuccess = (i: number) => {
    const current = character.death_saves_success ?? 0
    update('death_saves_success', i < current ? i : i + 1)
  }
  const toggleFailure = (i: number) => {
    const current = character.death_saves_failure ?? 0
    update('death_saves_failure', i < current ? i : i + 1)
  }

  return (
    <div className="box box-red">
      <div className="bt red">Jets de mort</div>
      <div className="bb">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '7pt', color: 'var(--green)', fontWeight: 600, width: '50px' }}>Succès</span>
            <div className="death-circles">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`death-circle success${i < (character.death_saves_success ?? 0) ? ' filled' : ''}`}
                  onClick={() => toggleSuccess(i)}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '7pt', color: 'var(--red)', fontWeight: 600, width: '50px' }}>Échecs</span>
            <div className="death-circles">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`death-circle${i < (character.death_saves_failure ?? 0) ? ' filled' : ''}`}
                  onClick={() => toggleFailure(i)}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <input
              type="checkbox"
              checked={character.is_stable ?? false}
              onChange={e => update('is_stable', e.target.checked)}
            />
            <span style={{ fontSize: '7.5pt', color: 'var(--gray)', fontStyle: 'italic' }}>Stabilisé</span>
          </div>
        </div>
      </div>
    </div>
  )
}
