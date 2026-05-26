// ============================================================
// SpellBrowser.tsx — The Sideria Codex
// Charge les sorts depuis Supabase (table: spells)
// À intégrer dans l'onglet Lore & Sorts de App.tsx :
//   import SpellBrowser from './components/SpellBrowser'
//   <SpellBrowser />
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sharfzrgrjvbcdlentie.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYXJmenJncmp2YmNkbGVudGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDYyMjksImV4cCI6MjA5MzgyMjIyOX0._ggQmzQGxIe_i7p9c0wtKd60BwygbWnSWNnTvOG33Kk'
)

// ── Types ────────────────────────────────────────────────────

type Spell = {
  id: string
  name: string
  discipline: string
  access: 'tronc_commun' | 'exclusif'
  exclusif_classes: string | null
  mana_cost: number
  incantation: string
  portee: string
  duree: string
  degats_type: string | null
  jet: string
  effet: string
}

type Filters = {
  query:       string
  disc:        string
  access:      '' | 'tronc_commun' | 'exclusif'
  mana:        string
  incantation: string
}

// ── Couleurs par Discipline ───────────────────────────────────

const DISC_COLORS: Record<string, { bg: string; text: string; light: string; ltxt: string }> = {
  'Éther':     { bg:'#1A4A3A', text:'#fff', light:'#e0f0ea', ltxt:'#0a3a2a' },
  'Fracture':  { bg:'#4A1A2E', text:'#fff', light:'#f0e0e8', ltxt:'#3a0a1e' },
  'Forge':     { bg:'#7a3a10', text:'#fff', light:'#f5ece0', ltxt:'#6a2a00' },
  'Impulsion': { bg:'#8B1A1A', text:'#fff', light:'#f9e8e8', ltxt:'#6a1010' },
  'Lecture':   { bg:'#4a6018', text:'#fff', light:'#edf3e0', ltxt:'#3a5010' },
  'Lien':      { bg:'#3D2A5A', text:'#fff', light:'#ede8f5', ltxt:'#2d1a4a' },
  'Planaire':  { bg:'#2A1A4A', text:'#fff', light:'#eae0f0', ltxt:'#1a0a3a' },
  'Portail':   { bg:'#1A3A4A', text:'#fff', light:'#e0eaf0', ltxt:'#0a2a3a' },
  'Trame':     { bg:'#1A2E4A', text:'#fff', light:'#e8eef5', ltxt:'#1a2a3a' },
  'Voile':     { bg:'#5a4a1a', text:'#fff', light:'#f5f0e0', ltxt:'#4a3a0a' },
}

const INCANTATIONS = ['Action', 'Action bonus', 'Réaction', '1 minute', '10 minutes', '1 heure']

// ── Styles partagés ───────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  background: '#f5efe0',
  border: '1px solid #b8a882',
  borderRadius: '3px',
  padding: '5px 8px',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: '12px',
  color: '#2a1f14',
  cursor: 'pointer',
  outline: 'none',
}

// ── Sous-composants ───────────────────────────────────────────

function ManaBadge({ spell }: { spell: Spell }) {
  const isVariable = spell.mana_cost === 0 && spell.incantation === '1 heure'
  return (
    <span style={{
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: '2px',
      background: isVariable ? '#5a3a6a' : '#2a1f14',
      color: '#fdf8ee',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {isVariable ? 'Variable' : `${spell.mana_cost} Mana`}
    </span>
  )
}

function SpellCard({ spell, expanded, onToggle }: {
  spell: Spell
  expanded: boolean
  onToggle: () => void
}) {
  const c = DISC_COLORS[spell.discipline]
  const isTronc = spell.access === 'tronc_commun'

  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? '#fff8ec' : '#faf5e8',
        border: `1px solid ${expanded ? '#8a7a5a' : '#c8b888'}`,
        borderRadius: '3px',
        padding: '10px 11px',
        cursor: 'pointer',
        transition: 'border-color 0.12s, background 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '5px' }}>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '11px',
          fontWeight: 600,
          color: '#2a1f14',
          lineHeight: 1.3,
          flex: 1,
        }}>
          {spell.name}
        </span>
        <ManaBadge spell={spell} />
      </div>

      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '8.5px',
        fontWeight: 600,
        color: c?.bg ?? '#5a4a30',
        marginBottom: '5px',
        letterSpacing: '0.03em',
      }}>
        {spell.discipline}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[spell.incantation, spell.portee].map(v => (
          <span key={v} style={{
            background: '#ede5cc', borderRadius: '2px',
            padding: '1px 5px', fontSize: '10.5px', color: '#4a3a20',
          }}>
            {v}
          </span>
        ))}
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: '9px',
          padding: '1px 5px',
          borderRadius: '2px',
          background: isTronc ? '#d8ead8' : '#e8d8e8',
          color: isTronc ? '#2a4a2a' : '#4a2a4a',
        }}>
          {isTronc ? 'Tronc' : 'Exclusif'}
        </span>
      </div>

      {expanded && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #ddd5b5',
        }}>
          <p style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '12px',
            color: '#3a2a14',
            lineHeight: 1.5,
            margin: '0 0 6px',
          }}>
            {spell.effet}
          </p>
          <div style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: '11px',
            color: '#6a5a3a',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            <span>Durée : {spell.duree}</span>
            <span>Jet : {spell.jet}</span>
            {spell.degats_type && <span>Dégâts : {spell.degats_type}</span>}
            {spell.exclusif_classes && (
              <span style={{ color: '#4a2a4a', fontStyle: 'italic' }}>
                Classes : {spell.exclusif_classes}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────

export default function SpellBrowser() {
  const [spells, setSpells]   = useState<Spell[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    query: '', disc: 'Tous', access: '', mana: '', incantation: '',
  })

  useEffect(() => {
    supabase
      .from('spells')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setSpells(data ?? [])
        setLoading(false)
      })
  }, [])

  const disciplines = useMemo(() => {
    const discs = [...new Set(spells.map(s => s.discipline))].sort()
    return ['Tous', ...discs]
  }, [spells])

  const setF = (patch: Partial<Filters>) => {
    setFilters(f => ({ ...f, ...patch }))
    setExpandedId(null)
  }

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase()
    return spells.filter(s => {
      if (q && !s.name.toLowerCase().includes(q)
             && !s.discipline.toLowerCase().includes(q)
             && !s.effet.toLowerCase().includes(q)
             && !(s.exclusif_classes?.toLowerCase().includes(q))) return false
      if (filters.disc !== 'Tous' && s.discipline !== filters.disc) return false
      if (filters.access && s.access !== filters.access) return false
      if (filters.incantation && !s.incantation.includes(filters.incantation)) return false
      if (filters.mana !== '') {
        const isVar = s.mana_cost === 0 && s.incantation === '1 heure'
        if (filters.mana === 'v' && !isVar) return false
        if (filters.mana === '4+' && (isVar || s.mana_cost < 4)) return false
        if (!['v', '4+'].includes(filters.mana) && !isVar && s.mana_cost !== parseInt(filters.mana)) return false
      }
      return true
    })
  }, [spells, filters])

  const tronc = filtered.filter(s => s.access === 'tronc_commun').length
  const exclu = filtered.filter(s => s.access === 'exclusif').length

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', fontFamily: "'Cinzel', serif", fontSize: '11px', color: '#8a7a5a', letterSpacing: '0.1em' }}>
      Ouverture du compendium…
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem', fontFamily: "'Cinzel', serif", fontSize: '11px', color: '#8B1A1A', letterSpacing: '0.05em' }}>
      Erreur : {error}
    </div>
  )

  return (
    <div style={{
      fontFamily: "'Crimson Pro', Georgia, serif",
      color: '#2a1f14',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: '100%',
    }}>

      {/* Barre recherche + selects */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
          <input
            value={filters.query}
            onChange={e => setF({ query: e.target.value })}
            placeholder="Rechercher un sort…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#f5efe0', border: '1px solid #b8a882', borderRadius: '3px',
              padding: '5px 10px 5px 28px',
              fontFamily: "'Crimson Pro', Georgia, serif", fontSize: '13px', color: '#2a1f14', outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8a7a5a', pointerEvents: 'none' }}>
            🔍
          </span>
        </div>

        <select value={filters.access} onChange={e => setF({ access: e.target.value as Filters['access'] })} style={selectStyle}>
          <option value="">Tout accès</option>
          <option value="tronc_commun">Tronc commun</option>
          <option value="exclusif">Exclusif</option>
        </select>

        <select value={filters.mana} onChange={e => setF({ mana: e.target.value })} style={selectStyle}>
          <option value="">Tout Mana</option>
          <option value="0">0 Mana</option>
          <option value="1">1 Mana</option>
          <option value="2">2 Mana</option>
          <option value="3">3 Mana</option>
          <option value="4+">4+ Mana</option>
          <option value="v">Variable</option>
        </select>

        <select value={filters.incantation} onChange={e => setF({ incantation: e.target.value })} style={selectStyle}>
          <option value="">Toute incantation</option>
          {INCANTATIONS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* Pills Discipline (générées depuis les données réelles) */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {disciplines.map(d => {
          const c = DISC_COLORS[d]
          const active = filters.disc === d
          return (
            <button
              key={d}
              onClick={() => setF({ disc: d })}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '9px',
                letterSpacing: '0.04em',
                padding: '3px 9px',
                borderRadius: '2px',
                border: `1px solid ${c?.bg ?? '#2a1f14'}`,
                background: active ? (c?.bg ?? '#2a1f14') : '#f5ede0',
                color: active ? (c?.text ?? '#fff') : (c?.ltxt ?? '#5a4a30'),
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {d}
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '9px',
        color: '#8a7a5a',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {filtered.length} sort{filtered.length > 1 ? 's' : ''} — {tronc} tronc commun · {exclu} exclusifs
      </div>

      {/* Grille */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: '7px',
        alignContent: 'start',
      }}>
        {filtered.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '3rem 0',
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            color: '#8a7a5a',
            letterSpacing: '0.1em',
          }}>
            Aucun sort ne correspond
          </div>
        ) : filtered.map(s => (
          <SpellCard
            key={s.id}
            spell={s}
            expanded={expandedId === s.id}
            onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
          />
        ))}
      </div>
    </div>
  )
}