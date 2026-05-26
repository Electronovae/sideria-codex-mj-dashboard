interface Props {
  character: any
  update:     (field: string, value: any) => void
  updateJson: (field: string, key: string, value: any) => void
}

const CRIST_STADES = [
  { stade: '0',  nom: 'Exposition',  effets: 'Aucun. Détectable par analyse magique.' },
  { stade: '1',  nom: 'Précoce',     effets: '−1 Dextérité.' },
  { stade: '1b', nom: 'Consolidé',   effets: '−1 Dex. Perception éthérique passive 30 m.' },
  { stade: '2',  nom: 'Avancé',      effets: '−2 Dex. Faveur jets perception éthérique.' },
  { stade: '3',  nom: 'Critique',    effets: '−3 Dex, −2 For. Immunité froid. Hallucinations.' },
  { stade: '4',  nom: 'Terminal',    effets: 'Statut en transformation. Entre deux états.' },
  { stade: '5',  nom: 'Passage',     effets: 'Corps partiel. Traverser 1 m. Sorts éthériques = 0.' },
  { stade: '6',  nom: 'Fusion',      effets: 'Irréversible. Corps cristallisé. Contact = 2d6 force.' },
]

export default function Combat({ character, update }: Props) {
  const toggleDS = (type: 'success' | 'failure', i: number) => {
    const field = type === 'success' ? 'death_saves_success' : 'death_saves_failure'
    const cur = character[field] ?? 0
    update(field, i < cur ? i : i + 1)
  }

  const cristStade = character.cristallite ?? 0

  return (
    <div className="box">
      <div className="bt">Combat</div>
      <div className="bb" style={{ padding: '3px 4px' }}>

        {/* Grille PV + combat */}
        <div className="combat-grid">
          {[
            { label: 'PV MAX',   field: 'hp_max',     gold: false },
            { label: 'PV ACTU.', field: 'hp_current', gold: false },
            { label: 'PV TEMP.', field: 'hp_temp',    gold: true  },
            { label: 'GRD',      field: 'armor_class', gold: false },
            { label: 'VIT.',     field: 'speed',       gold: false },
          ].map(({ label, field, gold }) => (
            <div key={field} className="combat-cell">
              <div className={`lb${gold ? ' gold-bg' : ''}`}>{label}</div>
              <div className="vl">
                <input className="combat-input" type="number"
                  value={character[field] ?? 0}
                  onChange={e => update(field, parseInt(e.target.value) || 0)} />
              </div>
            </div>
          ))}
          <div className="combat-cell">
            <div className="lb">DÉS RÉS.</div>
            <div className="vl" style={{ flexDirection: 'column' }}>
              <span style={{ fontSize: '6pt', color: 'var(--gray)' }}>d{character.hit_dice_type ?? 8}</span>
              <span style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '9pt', color: 'var(--blue)' }}>
                {character.hit_dice_remaining ?? character.level} / {character.level}
              </span>
            </div>
          </div>
        </div>

        {/* Mana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', padding: '2px 4px', border: '1px solid var(--gold)', borderRadius: '2px', background: 'var(--parch-min)' }}>
          <span style={{ fontFamily: 'Cinzel,serif', fontSize: '7pt', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>MANA</span>
          <input className="resource-input" type="number" value={character.mana_current ?? 0} onChange={e => update('mana_current', parseInt(e.target.value) || 0)} />
          <span style={{ color: 'var(--gray)', fontSize: '8pt' }}>/</span>
          <input className="resource-input" type="number" value={character.mana_max ?? 0} onChange={e => update('mana_max', parseInt(e.target.value) || 0)} />
        </div>

        {/* Fragments */}
        <div style={{ marginTop: '3px', border: '1px solid var(--purple)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ background: 'var(--purple)', padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Cinzel,serif', fontSize: '7pt', fontWeight: 700, color: '#fff' }}>FRAGMENTS</span>
            <span style={{ fontSize: '6.5pt', color: 'rgba(255,255,255,.7)' }}>
              {character.fragments_current ?? 0} / {character.fragments_max ?? 10}
            </span>
          </div>
          <div className="fragments-grid" style={{ padding: '3px 5px' }}>
            {Array.from({ length: Math.max(character.fragments_max ?? 10, 10) }).map((_, i) => (
              <div key={i}
                className={`fragment-box${i < (character.fragments_current ?? 0) ? ' used' : ''}`}
                onClick={() => update('fragments_current', i < (character.fragments_current ?? 0) ? i : i + 1)}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Jets de mort + Étincelle + Montées */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 1.4fr', gap: '3px', marginTop: '3px' }}>
          {/* Jets de mort */}
          <div style={{ border: '1px solid var(--red)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--red)', padding: '2px 5px' }}>
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: '6.5pt', fontWeight: 700, color: '#fff' }}>JETS DE MORT</span>
            </div>
            <div style={{ padding: '3px 5px', background: 'var(--parch-min)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '6pt', color: 'var(--green)', fontWeight: 700, width: '42px' }}>Succès</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} className={`death-circle s${i < (character.death_saves_success ?? 0) ? ' filled' : ''}`} onClick={() => toggleDS('success', i)} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '6pt', color: 'var(--red)', fontWeight: 700, width: '42px' }}>Échecs</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} className={`death-circle${i < (character.death_saves_failure ?? 0) ? ' filled' : ''}`} onClick={() => toggleDS('failure', i)} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Étincelle */}
          <div style={{ border: '1px solid var(--gold)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gold)', padding: '2px 5px' }}>
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: '6.5pt', fontWeight: 700, color: '#fff' }}>ÉTINCELLE</span>
            </div>
            <div style={{ padding: '4px 5px', background: 'var(--parch-min)', display: 'flex', gap: '4px', justifyContent: 'center' }}>
              {[0,1,2].map(i => <span key={i} className="circle" style={{ borderColor: 'var(--gold)', width: '11px', height: '11px' }} />)}
            </div>
          </div>

          {/* Montées de caractéristique */}
          <div style={{ border: '1px solid var(--blue)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--blue)', padding: '2px 5px' }}>
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: '6.5pt', fontWeight: 700, color: '#fff' }}>MONTÉES CARACT.</span>
            </div>
            <div style={{ padding: '3px 5px', background: 'var(--parch-min)' }}>
              <div style={{ fontSize: '5.5pt', color: 'var(--gray)', marginBottom: '2px' }}>3·7·11·15·19·23·27·31·35·39</div>
              <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                {Array.from({ length: 10 }).map((_, i) => <span key={i} className="circle sm" />)}
              </div>
            </div>
          </div>
        </div>

        {/* Cristallite — table des stades */}
        <div style={{ marginTop: '3px', border: '1px solid var(--purple)', borderRadius: '2px', overflow: 'hidden' }}>
          <div className="bt purple" style={{ fontSize: '7pt', padding: '2px 5px' }}>Cristallite — Stade</div>
          <div className="bb" style={{ padding: '2px 4px' }}>
            <table className="cristallite-table">
              <thead>
                <tr><th className="c">Stade</th><th>Nom</th><th>Effets</th><th className="c">✓</th></tr>
              </thead>
              <tbody>
                {CRIST_STADES.map(({ stade, nom, effets }, i) => (
                  <tr key={stade} style={i >= 6 ? { background: 'rgba(61,42,90,.08)' } : undefined}>
                    <td className="c" style={{ fontWeight: 700, color: i >= 6 ? 'var(--purple)' : 'var(--ink)' }}>{stade}</td>
                    <td style={{ fontWeight: 600, fontStyle: i >= 6 ? 'italic' : 'normal', fontSize: '6.5pt' }}>{nom}</td>
                    <td style={{ color: 'var(--gray)', fontSize: '6pt' }}>{effets}</td>
                    <td className="c">
                      <span
                        className={`crist-check${cristStade > i ? ' checked' : ''}`}
                        style={i >= 6 ? { borderColor: 'var(--purple)' } : undefined}
                        onClick={() => update('cristallite', cristStade === i + 1 ? i : i + 1)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
