import React, { useEffect, useRef, useState } from 'react'
import { useStudio } from './communs.jsx'

// Palette de recherche globale (Ctrl+K) : cherche dans toutes les entités et saute au Codex.
export default function Recherche({ fermer }) {
  const { univers, setOnglet, setCodexCible } = useStudio()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const champ = useRef(null)
  useEffect(() => { champ.current?.focus() }, [])

  const norm = (s) => (s || '').toLowerCase()
  const nq = norm(q)
  const candidats = []
  const pousser = (type, id, titre, sous, texte) => {
    if (!nq) return
    const score = norm(titre).startsWith(nq) ? 0 : norm(titre).includes(nq) ? 1 : norm(texte).includes(nq) ? 2 : -1
    if (score >= 0) candidats.push({ type, id, titre, sous, score })
  }
  univers.pnjs.forEach(p => pousser('pnj', p.id, p.nom, 'PNJ · ' + (univers.factions.find(f => f.id === p.faction)?.nom || ''), p.description + ' ' + p.role + ' ' + p.secrets))
  univers.joueurs.forEach(j => pousser('pj', j.id, j.personnage, 'PJ · ' + j.joueur, j.notes))
  univers.factions.forEach(f => pousser('faction', f.id, f.nom, 'Faction', f.description))
  univers.lieux.forEach(l => pousser('lieu', l.id, l.nom, 'Lieu · ' + l.type, l.description))
  univers.campagnes.forEach(c => {
    pousser('campagne', c.id, c.titre, 'Campagne · Saison ' + c.saison, c.pitch)
    c.sessions.forEach(s => pousser('campagne', c.id, (s.code ? s.code + ' · ' : '') + s.titre, 'Session · ' + c.titre, s.resume + ' ' + s.sections.map(x => x.titre + ' ' + x.contenu).join(' ')))
  })
  univers.arcs.forEach(a => pousser('arc', a.id, a.nom, 'Arc', a.description))
  univers.evenements.forEach(e => pousser('evenement', e.id, e.titre, 'Événement', e.desc))
  univers.rapports.forEach(r => pousser('rapport', r.id, r.titre, 'Rapport · ' + r.type, r.contenu))
  const resultats = candidats.sort((a, b) => a.score - b.score).slice(0, 12)

  const ouvrir = (r) => {
    setCodexCible({ type: r.type, id: r.id })
    setOnglet('codex')
    fermer()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.45)', display: 'flex', justifyContent: 'center', paddingTop: '12vh' }}
      onMouseDown={fermer}>
      <div style={{ width: 560, maxWidth: '92vw', alignSelf: 'flex-start', background: 'var(--parch)', border: '2px solid var(--or)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,.5)' }}
        onMouseDown={e => e.stopPropagation()}>
        <input ref={champ} value={q} placeholder="Rechercher dans tout l'univers…"
          style={{ border: 'none', borderBottom: '1px solid var(--parch-mid)', padding: '12px 16px', fontSize: '1rem' }}
          onChange={e => { setQ(e.target.value); setIdx(0) }}
          onKeyDown={e => {
            if (e.key === 'Escape') fermer()
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(resultats.length - 1, i + 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)) }
            if (e.key === 'Enter' && resultats[idx]) ouvrir(resultats[idx])
          }} />
        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {resultats.map((r, i) => (
            <div key={r.type + r.id + i} onClick={() => ouvrir(r)} onMouseMove={() => setIdx(i)}
              style={{ padding: '8px 16px', cursor: 'pointer', background: i === idx ? 'rgba(201,162,39,.22)' : 'transparent', borderLeft: i === idx ? '3px solid var(--or)' : '3px solid transparent' }}>
              <strong>{r.titre}</strong>
              <span style={{ color: 'var(--gris)', fontSize: '.78rem', marginLeft: 8 }}>{r.sous}</span>
            </div>
          ))}
          {q && !resultats.length && <div style={{ padding: 16, color: 'var(--gris)', fontStyle: 'italic' }}>Aucun résultat.</div>}
          {!q && <div style={{ padding: 16, color: 'var(--gris)', fontSize: '.82rem' }}>Tape pour chercher parmi les PNJ, PJ, factions, lieux, campagnes, sessions, arcs et événements. ↑↓ pour naviguer, Entrée pour ouvrir.</div>}
        </div>
      </div>
    </div>
  )
}
