interface Props {
  factions:   Record<string, number>
  serment:    { faction: string; statut: string; termes: string }
  updateJson: (field: string, key: string, value: any) => void
  update:     (field: string, value: any) => void
}

const FACTION_LIST = [
  { key: 'dragon_blanc',   label: 'Dragon Blanc' },
  { key: 'vouivre_jais',   label: 'Vouivre de Jaïs' },
  { key: 'academie',       label: 'Académie' },
  { key: 'inquisition',    label: 'Inquisition' },
  { key: 'flotte_drax',    label: 'Flotte Drax' },
  { key: 'conseil_sept',   label: 'Conseil des Sept' },
  { key: 'culte_sans_nom', label: 'Culte Sans Nom' },
  { key: 'kessavar',       label: 'Kessavar' },
  { key: 'serment_ether',  label: "Serment de l'Éther" },
]

export default function Factions({ factions, updateJson }: Props) {
  const change = (key: string, delta: number) => {
    const next = Math.max(-5, Math.min(4, (factions[key] ?? 0) + delta))
    updateJson('factions', key, next)
  }

  return (
    <div className="box" style={{ flex: 1 }}>
      <div className="bt">Réputation des Factions</div>
      <div className="bb" style={{ padding: '2px 4px', height: '100%' }}>
        <div className="hint" style={{ marginBottom: '3px' }}>
          −5 · −4 · −3 · −2 · −1 · 0 · +1 · +2 · +3 · +4
        </div>
        <table className="factions-table">
          <thead>
            <tr>
              <th style={{ width: '55%' }}>Faction</th>
              <th style={{ textAlign: 'center' }}>Réputation</th>
            </tr>
          </thead>
          <tbody>
            {FACTION_LIST.map(({ key, label }) => {
              const val = factions[key] ?? 0
              return (
                <tr key={key}>
                  <td style={{ fontSize: '7pt' }}>{label}</td>
                  <td>
                    <div className="faction-stepper">
                      <button className="faction-btn" onClick={() => change(key, -1)}>−</button>
                      <span className={`faction-value${val > 0 ? ' pos' : val < 0 ? ' neg' : ''}`}>
                        {val > 0 ? `+${val}` : val}
                      </span>
                      <button className="faction-btn" onClick={() => change(key, 1)}>+</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Serment d'Éther */}
        <div className="serment-block" style={{ marginTop: '4px' }}>
          <div className="bt gold" style={{ fontSize: '7.5pt', padding: '2px 5px' }}>Serment d'Éther</div>
          <div className="bb" style={{ display: 'flex', gap: '6px' }}>
            {['faction', 'statut', 'termes'].map(f => (
              <div key={f} className="field f1" style={{ margin: 0 }}>
                <label style={{ textTransform: 'capitalize' }}>{f.charAt(0).toUpperCase() + f.slice(1)} :</label>
                <input className="field-input" defaultValue="" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
