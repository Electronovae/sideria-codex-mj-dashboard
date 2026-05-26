import { useState } from 'react'

interface Spell {
  id: string; name: string; discipline: string; access: string
  exclusif_classes: string; mana_cost: number; incantation: string
  portee: string; duree: string; degats_type?: string; jet: string; effet: string
}

interface Props {
  spells:        Spell[]
  knownSpellIds: string[]
  onToggle:      (id: string) => void
}

const DISCIPLINE_COLORS: Record<string, string> = {
  'Impulsion':  '#8B1A1A',
  'Trame':      '#1A2E4A',
  'Lecture':    '#6B8E23',
  'Lien':       '#3D2A5A',
  'Voile':      '#4A3A1A',
  'Forge':      '#8B4513',
  '[Éther]':    '#1A4A3A',
  '[Planaire]': '#2A1A4A',
  'Fracture':   '#4A1A2E',
  'Portail':    '#1A3A4A',
}

const INCANT_BADGE: Record<string, string> = {
  'Action': 'A', 'Action bonus': 'AB', 'Réaction': 'R', '10 minutes': '10m', '1 minute': '1m',
}

export default function SpellList({ spells, knownSpellIds, onToggle }: Props) {
  const [filter, setFilter] = useState<string>('Tous')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const disciplines = ['Tous', ...Array.from(new Set(spells.map(s => s.discipline)))]

  const filtered = spells.filter(s => {
    const matchDiscipline = filter === 'Tous' || s.discipline === filter
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    return matchDiscipline && matchSearch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '100%' }}>
      {/* Filtres */}
      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '100px', border: '1px solid var(--blue)', borderRadius: '2px',
            padding: '2px 5px', fontSize: '8pt', fontFamily: 'Crimson Pro, serif',
            background: 'var(--parch-min)', color: 'var(--ink)', outline: 'none',
          }}
        />
        {disciplines.map(d => (
          <button key={d} onClick={() => setFilter(d)}
            style={{
              border: `1px solid ${filter === d ? (DISCIPLINE_COLORS[d] ?? 'var(--blue)') : 'var(--parch-dk)'}`,
              background: filter === d ? (DISCIPLINE_COLORS[d] ?? 'var(--blue)') : 'var(--parch-mid)',
              color: filter === d ? '#fff' : 'var(--gray)',
              fontFamily: 'Cinzel, serif', fontSize: '6.5pt', padding: '2px 5px',
              cursor: 'pointer', borderRadius: '2px',
            }}>
            {d}
          </button>
        ))}
      </div>

      {/* Liste des sorts */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.map(spell => {
          const isKnown = knownSpellIds.includes(spell.id)
          const isExpanded = expandedId === spell.id
          const color = DISCIPLINE_COLORS[spell.discipline] ?? 'var(--blue)'

          return (
            <div key={spell.id} style={{
              border: `1px solid ${isKnown ? color : '#d4c9a0'}`,
              borderRadius: '2px', marginBottom: '2px', overflow: 'hidden',
              background: isKnown ? `color-mix(in srgb, ${color} 5%, var(--parch-min))` : 'var(--parch-min)',
            }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 5px', cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : spell.id)}
              >
                {/* Checkbox connu */}
                <span
                  onClick={e => { e.stopPropagation(); onToggle(spell.id) }}
                  style={{
                    width: '10px', height: '10px', borderRadius: '1px', border: `1.5px solid ${color}`,
                    background: isKnown ? color : 'transparent', flexShrink: 0, cursor: 'pointer',
                    display: 'inline-block',
                  }}
                />

                {/* Nom */}
                <span style={{ fontWeight: 700, fontSize: '8pt', flex: 1 }}>{spell.name}</span>

                {/* Badges */}
                <span style={{
                  background: color, color: '#fff', fontFamily: 'Cinzel,serif',
                  fontSize: '6pt', padding: '1px 4px', borderRadius: '2px', flexShrink: 0,
                }}>{spell.mana_cost}M</span>

                <span style={{
                  background: 'var(--parch-mid)', border: `1px solid ${color}`,
                  color: color, fontSize: '6pt', padding: '1px 3px', borderRadius: '2px', flexShrink: 0,
                }}>{INCANT_BADGE[spell.incantation] ?? spell.incantation?.slice(0, 3)}</span>

                {spell.degats_type && (
                  <span style={{ fontSize: '6pt', color: 'var(--red)', flexShrink: 0 }}>{spell.degats_type}</span>
                )}

                {spell.access === 'exclusif' && (
                  <span style={{ fontSize: '5.5pt', color: 'var(--purple)', fontStyle: 'italic', flexShrink: 0 }}>Excl.</span>
                )}

                <span style={{ fontSize: '8pt', color: 'var(--gray)', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Détail étendu */}
              {isExpanded && (
                <div style={{ padding: '4px 8px', borderTop: `1px solid ${color}33`, background: 'var(--parch-min)' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Portée', val: spell.portee },
                      { label: 'Durée', val: spell.duree },
                      { label: 'Jet', val: spell.jet },
                    ].map(({ label, val }) => val && (
                      <div key={label}>
                        <span style={{ fontFamily: 'Cinzel,serif', fontSize: '6pt', fontWeight: 700, color: color }}>{label} : </span>
                        <span style={{ fontSize: '7pt', color: 'var(--gray)' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '7.5pt', color: 'var(--ink)', lineHeight: 1.4, fontStyle: 'italic' }}>
                    {spell.effet}
                  </div>
                  {spell.exclusif_classes && (
                    <div style={{ marginTop: '3px', fontSize: '6.5pt', color: 'var(--purple)' }}>
                      Exclusif : {spell.exclusif_classes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
