interface Item { nom: string; qte: string; poids: string }

interface Props {
  inventory:   Item[]
  currency:    Record<string, number>
  updateArray: (field: string, value: any[]) => void
  updateJson:  (field: string, key: string, value: any) => void
}

const CURRENCIES = [
  { key: 'le',      label: 'LE' },
  { key: 'pp',      label: 'PP' },
  { key: 'po',      label: 'PO' },
  { key: 'pa',      label: 'PA' },
  { key: 'pc',      label: 'PC' },
  { key: 'cristaux', label: 'Crx.' },
]

export default function Inventory({ inventory, currency, updateArray, updateJson }: Props) {
  const rows = inventory ?? []

  const upd = (i: number, field: keyof Item, value: string) =>
    updateArray('inventory', rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))

  const add    = () => updateArray('inventory', [...rows, { nom: '', qte: '1', poids: '' }])
  const remove = (i: number) => updateArray('inventory', rows.filter((_, idx) => idx !== i))

  return (
    <div className="box" style={{ flex: 1 }}>
      <div className="bt">Inventaire</div>
      <div className="bb" style={{ padding: '2px 4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {rows.map((item, i) => (
            <div key={i} className="inv-row">
              <span className="inv-bullet">○</span>
              <input
                className="atk-input"
                style={{ flex: 3 }}
                value={item.nom}
                onChange={e => upd(i, 'nom', e.target.value)}
                placeholder="Objet"
              />
              <input
                className="atk-input center"
                style={{ width: '28px' }}
                value={item.qte}
                onChange={e => upd(i, 'qte', e.target.value)}
                placeholder="1"
              />
              <button onClick={() => remove(i)} style={{ border: 'none', background: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '8pt', flexShrink: 0, padding: 0 }}>✕</button>
            </div>
          ))}
          {/* Lignes vides visuelles */}
          {Array.from({ length: Math.max(0, 8 - rows.length) }).map((_, i) => (
            <div key={`e${i}`} className="inv-row">
              <span className="inv-bullet">○</span>
              <div style={{ flex: 1, borderBottom: '1px solid #d4c9a0', height: '14px' }} />
            </div>
          ))}
        </div>
        <button className="add-btn" onClick={add} style={{ marginTop: '3px' }}>+ Objet</button>

        {/* Monnaie */}
        <div className="currency-grid" style={{ marginTop: '5px' }}>
          {CURRENCIES.map(({ key, label }) => (
            <div key={key} className="currency-cell">
              <span className="currency-label">{label}</span>
              <input
                className="currency-input"
                type="number"
                value={currency?.[key] ?? 0}
                onChange={e => updateJson('currency', key, parseInt(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
