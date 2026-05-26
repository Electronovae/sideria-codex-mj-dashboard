// ============================================================
// SpellBrowser.tsx — The Sideria Codex
// Compendium Éthérique — Navigateur de sorts v4.2
//
// Usage dans App.tsx :
//   import SpellBrowser from './components/SpellBrowser'
//   // Dans le JSX de l'onglet Lore & Sorts :
//   <SpellBrowser />
//
// Pour basculer sur Supabase, remplacez l'import statique par :
//   const { data: spells } = await supabase.from('spells').select('*')
// ============================================================

import { useState, useMemo } from 'react'
import { SPELLS, DISC_COLORS, DISCIPLINES, type Spell } from '../data/spellsData'

// ── Types ────────────────────────────────────────────────────

type Filters = {
  query:     string
  disc:      string
  access:    '' | 'tronc_commun' | 'exclusif'
  mana:      string
  incantation: string
}

// ── Constantes ───────────────────────────────────────────────

const INCANTATIONS = ['Action', 'Action bonus', 'Réaction', '1 minute', '10 minutes', '1 heure']

const SHEET_VARS = `
  --parch:     #fdf8ee;
  --parch-mid: #f5ede0;
  --parch-dk:  #e8dcc8;
  --ink:       #2a1f14;
  --ink-mid:   #5a4a30;
  --ink-lt:    #8a7a5a;
  --blue:      #2a4a6a;
  --gold:      #8a6a1a;
`

// ── Sous-composants ──────────────────────────────────────────

function DiscPill({
  disc, active, onClick
}: { disc: string; active: boolean; onClick: () => void }) {
  const c = DISC_COLORS[disc]
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '9px',
        letterSpacing: '0.04em',
        padding: '3px 9px',
        borderRadius: '2px',
        border: `1px solid ${c?.bg ?? '#2a1f14'}`,
        background: active ? (c?.bg ?? '#2a1f14') : 'var(--parch-mid, #f5ede0)',
        color: active ? (c?.text ?? '#fff') : (c?.ltxt ?? '#5a4a30'),
        cursor: 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {disc}
    </button>
  )
}

function AccessBadge({ access }: { access: Spell['access'] }) {
  const isTronc = access === 'tronc_commun'
  return (
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
  )
}

function ManaBadge({ spell }: { spell: Spell }) {
  const label = spell.mana_variable ? 'Variable' : `${spell.mana_cost} Mana`
  return (
    <span style={{
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: '2px',
      background: spell.mana_variable ? '#5a3a6a' : '#2a1f14',
      color: '#fdf8ee',
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: '#ede5cc',
      borderRadius: '2px',
      padding: '1px 5px',
      fontSize: '10.5px',
      color: '#4a3a20',
    }}>
      {children}
    </span>
  )
}

function SpellCard({
  spell, expanded, onToggle
}: { spell: Spell; expanded: boolean; onToggle: () => void }) {
  const c = DISC_COLORS[spell.discipline]

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
      {/* Ligne du haut : nom + coût Mana */}
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

      {/* Discipline */}
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

      {/* Chips meta */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        <MetaChip>{spell.incantation}</MetaChip>
        <MetaChip>{spell.portee}</MetaChip>
        <AccessBadge access={spell.access} />
      </div>

      {/* Détail (expandé) */}
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
            flexDirection: 'column' as const,
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

// ── Composant principal ──────────────────────────────────────

export default function SpellBrowser() {
  const [filters, setFilters] = useState<Filters>({
    query: '', disc: 'Tous', access: '', mana: '', incantation: '',
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const setF = (patch: Partial<Filters>) => {
    setFilters(f => ({ ...f, ...patch }))
    setExpandedId(null)
  }

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase()
    return SPELLS.filter(s => {
      if (q && !s.name.toLowerCase().includes(q)
             && !s.discipline.toLowerCase().includes(q)
             && !s.effet.toLowerCase().includes(q)
             && !(s.exclusif_classes?.toLowerCase().includes(q))) return false
      if (filters.disc !== 'Tous' && s.discipline !== filters.disc) return false
      if (filters.access && s.access !== filters.access) return false
      if (filters.incantation && !s.incantation.includes(filters.incantation)) return false
      if (filters.mana !== '') {
        if (filters.mana === 'v' && !s.mana_variable) return false
        if (filters.mana === '4+' && (s.mana_variable || s.mana_cost < 4)) return false
        if (!['v', '4+'].includes(filters.mana) && !s.mana_variable && s.mana_cost !== parseInt(filters.mana)) return false
      }
      return true
    })
  }, [filters])

  const tronc = filtered.filter(s => s.access === 'tronc_commun').length
  const exclu = filtered.filter(s => s.access === 'exclusif').length

  return (
    <div style={{
      fontFamily: "'Crimson Pro', Georgia, serif",
      color: '#2a1f14',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      height: '100%',
    }}>

      {/* ── Barre de recherche + filtres selects ── */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
          <input
            value={filters.query}
            onChange={e => setF({ query: e.target.value })}
            placeholder="Rechercher un sort…"
            style={{
              width: '100%',
              background: '#f5efe0',
              border: '1px solid #b8a882',
              borderRadius: '3px',
              padding: '5px 10px 5px 28px',
              fontFamily: "'Crimson Pro', serif",
              fontSize: '13px',
              color: '#2a1f14',
              outline: 'none',
              boxSizing: 'border-box' as const,
            }}
          />
          <span style={{
            position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '12px', color: '#8a7a5a', pointerEvents: 'none',
          }}>
            🔍
          </span>
        </div>

        <select
          value={filters.access}
          onChange={e => setF({ access: e.target.value as Filters['access'] })}
          style={selectStyle}
        >
          <option value="">Tout accès</option>
          <option value="tronc_commun">Tronc commun</option>
          <option value="exclusif">Exclusif</option>
        </select>

        <select
          value={filters.mana}
          onChange={e => setF({ mana: e.target.value })}
          style={selectStyle}
        >
          <option value="">Tout Mana</option>
          <option value="0">0 Mana</option>
          <option value="1">1 Mana</option>
          <option value="2">2 Mana</option>
          <option value="3">3 Mana</option>
          <option value="4+">4+ Mana</option>
          <option value="v">Variable</option>
        </select>

        <select
          value={filters.incantation}
          onChange={e => setF({ incantation: e.target.value })}
          style={selectStyle}
        >
          <option value="">Toute incantation</option>
          {INCANTATIONS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* ── Pills Discipline ── */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {DISCIPLINES.map(d => (
          <DiscPill
            key={d}
            disc={d}
            active={filters.disc === d}
            onClick={() => setF({ disc: d })}
          />
        ))}
      </div>

      {/* ── Stats ── */}
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '9px',
        color: '#8a7a5a',
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
      }}>
        {filtered.length} sort{filtered.length > 1 ? 's' : ''} — {tronc} tronc commun · {exclu} exclusifs
      </div>

      {/* ── Grille ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto' as const,
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

// ── Helpers ──────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  background: '#f5efe0',
  border: '1px solid #b8a882',
  borderRadius: '3px',
  padding: '5px 8px',
  fontFamily: "'Crimson Pro', serif",
  fontSize: '12px',
  color: '#2a1f14',
  cursor: 'pointer',
  outline: 'none',
}
