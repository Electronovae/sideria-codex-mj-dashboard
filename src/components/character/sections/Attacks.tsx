interface Attack {
  nom: string; bonus_atk: string; degats: string; type_degats: string; portee: string
}

interface Props {
  attacks:     Attack[]
  updateArray: (field: string, value: any[]) => void
}

const EMPTY: Attack = { nom: '', bonus_atk: '', degats: '', type_degats: '', portee: '' }

export default function Attacks({ attacks, updateArray }: Props) {
  const rows = attacks ?? []

  const upd = (i: number, field: keyof Attack, value: string) =>
    updateArray('attacks', rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const add    = () => updateArray('attacks', [...rows, { ...EMPTY }])
  const remove = (i: number) => updateArray('attacks', rows.filter((_, idx) => idx !== i))

  return (
    <div className="box box-gold">
      <div className="bt gold">Attaques</div>
      <div className="bb" style={{ padding: '2px 3px' }}>
        <table className="attacks-table">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Nom</th>
              <th style={{ width: '14%', textAlign: 'center' }}>Bonus</th>
              <th style={{ width: '16%' }}>Dégâts</th>
              <th style={{ width: '16%' }}>Type</th>
              <th style={{ width: '15%' }}>Portée</th>
              <th style={{ width: '7%' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((atk, i) => (
              <tr key={i}>
                <td><input className="atk-input" value={atk.nom} onChange={e => upd(i, 'nom', e.target.value)} placeholder="—" /></td>
                <td><input className="atk-input center" value={atk.bonus_atk} onChange={e => upd(i, 'bonus_atk', e.target.value)} placeholder="+0" /></td>
                <td><input className="atk-input" value={atk.degats} onChange={e => upd(i, 'degats', e.target.value)} placeholder="1d6" /></td>
                <td><input className="atk-input" value={atk.type_degats} onChange={e => upd(i, 'type_degats', e.target.value)} placeholder="tranchant" /></td>
                <td><input className="atk-input" value={atk.portee} onChange={e => upd(i, 'portee', e.target.value)} placeholder="contact" /></td>
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => remove(i)} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '9pt' }}>✕</button>
                </td>
              </tr>
            ))}
            {/* Lignes vides visuelles */}
            {Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, i) => (
              <tr key={`e${i}`}><td colSpan={6} style={{ height: '14px', borderBottom: '1px solid #d4c9a0' }} /></tr>
            ))}
          </tbody>
        </table>
        <button className="add-btn" onClick={add}>+ Attaque</button>
      </div>
    </div>
  )
}
