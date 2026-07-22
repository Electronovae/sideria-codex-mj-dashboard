import React, { useEffect, useRef, useState } from 'react'
import { useStudio } from './communs.jsx'

// Graphe façon Obsidian : chaque entité est un nœud, chaque relation un lien.
// Simulation de forces maison (répulsion + ressorts + centrage), nœuds déplaçables,
// clic sur un nœud : ouvre sa page dans le Codex.
const TYPES = [
  ['faction', 'Factions'], ['pnj', 'PNJ'], ['pj', 'PJ'],
  ['campagne', 'Campagnes'], ['session', 'Sessions'], ['evenement', 'Événements'], ['arc', 'Arcs'],
]

export default function Graphe() {
  const { univers, setOnglet, setCodexCible } = useStudio()
  const conteneur = useRef(null)
  const [taille, setTaille] = useState({ w: 900, h: 600 })
  const [types, setTypes] = useState(() => new Set(['faction', 'pnj', 'pj', 'campagne']))
  const [tick, setTick] = useState(0)
  const [survol, setSurvol] = useState(null)
  const sim = useRef({ noeuds: [], liens: [], vue: { x: 0, y: 0, z: 1 }, chaud: 0, dragNoeud: null, dragFond: null })

  useEffect(() => {
    const majT = () => conteneur.current && setTaille({ w: conteneur.current.clientWidth, h: conteneur.current.clientHeight })
    majT(); window.addEventListener('resize', majT)
    return () => window.removeEventListener('resize', majT)
  }, [])

  const faction = (id) => univers.factions.find(f => f.id === id)

  // ── Construction des nœuds et liens selon les types actifs ──
  useEffect(() => {
    const s = sim.current
    const anciens = Object.fromEntries(s.noeuds.map(n => [n.cle, n]))
    const noeuds = [], liens = []
    const ajouter = (type, id, nom, coul) => {
      const cle = type + ':' + id
      const ancien = anciens[cle]
      noeuds.push(ancien
        ? Object.assign(ancien, { nom, coul })
        : { cle, type, id, nom, coul, x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600, vx: 0, vy: 0, deg: 0 })
      return cle
    }
    const lier = (a, b) => { liens.push([a, b]) }
    const actif = (t) => types.has(t)

    if (actif('faction')) univers.factions.forEach(f => ajouter('faction', f.id, f.nom, f.couleur))
    if (actif('pnj')) univers.pnjs.forEach(p => {
      ajouter('pnj', p.id, p.nom, faction(p.faction)?.couleur || '#8a8272')
      if (actif('faction') && p.faction) lier('pnj:' + p.id, 'faction:' + p.faction)
    })
    if (actif('pj')) univers.joueurs.forEach(j => {
      ajouter('pj', j.id, j.personnage, faction(j.faction)?.couleur || '#c9a227')
      if (actif('faction') && j.faction) lier('pj:' + j.id, 'faction:' + j.faction)
      if (actif('pnj')) (j.historique || []).forEach(i => { if (i.pnjId) lier('pj:' + j.id, 'pnj:' + i.pnjId) })
    })
    if (actif('campagne')) univers.campagnes.forEach(c => {
      ajouter('campagne', c.id, (c.code ? c.code + ' ' : '') + c.titre, faction(c.factionId)?.couleur || '#6b5b95')
      if (actif('faction') && c.factionId) lier('campagne:' + c.id, 'faction:' + c.factionId)
      if (actif('pnj')) c.pnjIds.forEach(pid => lier('campagne:' + c.id, 'pnj:' + pid))
      if (actif('session')) c.sessions.forEach(se => {
        ajouter('session', se.id, (se.code ? se.code + ' ' : '') + se.titre, '#8d6e63')
        lier('session:' + se.id, 'campagne:' + c.id)
      })
    })
    if (actif('arc')) univers.arcs.forEach(a => ajouter('arc', a.id, a.nom, a.couleur))
    if (actif('evenement')) univers.evenements.forEach(e => {
      ajouter('evenement', e.id, e.titre, e.couleur || faction(e.factionId)?.couleur || '#8a8272')
      if (actif('pnj')) e.participants.forEach(pid => lier('evenement:' + e.id, 'pnj:' + pid))
      if (actif('arc') && e.arcId) lier('evenement:' + e.id, 'arc:' + e.arcId)
      if (actif('session') && e.sessionId && actif('campagne')) lier('evenement:' + e.id, 'session:' + e.sessionId)
      else if (actif('campagne') && e.campagneId) lier('evenement:' + e.id, 'campagne:' + e.campagneId)
    })
    // ne garder que les liens dont les deux extrémités existent
    const cles = new Set(noeuds.map(n => n.cle))
    s.liens = liens.filter(([a, b]) => cles.has(a) && cles.has(b))
    s.noeuds = noeuds
    const deg = {}
    s.liens.forEach(([a, b]) => { deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1 })
    s.noeuds.forEach(n => { n.deg = deg[n.cle] || 0 })
    s.index = Object.fromEntries(s.noeuds.map(n => [n.cle, n]))
    s.chaud = 300  // nombre de pas de simulation restants
  }, [univers, types])

  // ── Simulation de forces ──
  useEffect(() => {
    let vivant = true
    const pas = () => {
      if (!vivant) return
      const s = sim.current
      if (s.chaud > 0 || s.dragNoeud) {
        const N = s.noeuds, alpha = Math.min(1, (s.chaud + 60) / 360)
        // répulsion (approximation par grille pour rester fluide)
        for (let i = 0; i < N.length; i++) {
          const a = N[i]
          for (let k = i + 1; k < N.length; k++) {
            const b = N[k]
            let dx = a.x - b.x, dy = a.y - b.y
            let d2 = dx * dx + dy * dy
            if (d2 > 90000) continue
            if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1 }
            const f = 900 * alpha / d2
            a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f
          }
        }
        // ressorts
        s.liens.forEach(([ca, cb]) => {
          const a = s.index[ca], b = s.index[cb]
          const dx = b.x - a.x, dy = b.y - a.y
          const d = Math.sqrt(dx * dx + dy * dy) || 1
          const f = (d - 90) * 0.012 * alpha
          a.vx += dx / d * f; a.vy += dy / d * f
          b.vx -= dx / d * f; b.vy -= dy / d * f
        })
        // centrage + intégration
        N.forEach(n => {
          if (s.dragNoeud === n.cle) { n.vx = 0; n.vy = 0; return }
          n.vx -= n.x * 0.0015 * alpha; n.vy -= n.y * 0.0015 * alpha
          n.vx *= 0.85; n.vy *= 0.85
          n.x += n.vx; n.y += n.vy
        })
        s.chaud = Math.max(0, s.chaud - 1)
        setTick(t => t + 1)
      }
      requestAnimationFrame(pas)
    }
    requestAnimationFrame(pas)
    return () => { vivant = false }
  }, [])

  // ── Interactions souris ──
  useEffect(() => {
    const move = (ev) => {
      const s = sim.current
      if (s.dragNoeud) {
        const n = s.index[s.dragNoeud]
        if (n) {
          n.x = (ev.clientX - s.origine.x) / s.vue.z + s.origine.nx
          n.y = (ev.clientY - s.origine.y) / s.vue.z + s.origine.ny
          s.chaud = Math.max(s.chaud, 30)
          setTick(t => t + 1)
        }
      } else if (s.dragFond) {
        s.vue.x = s.dragFond.vx + (ev.clientX - s.dragFond.x)
        s.vue.y = s.dragFond.vy + (ev.clientY - s.dragFond.y)
        setTick(t => t + 1)
      }
    }
    const up = () => { sim.current.dragNoeud = null; sim.current.dragFond = null }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [])

  useEffect(() => {
    const el = conteneur.current
    if (!el) return
    const molette = (ev) => {
      ev.preventDefault()
      const s = sim.current
      const facteur = ev.deltaY < 0 ? 1.15 : 1 / 1.15
      const r = el.getBoundingClientRect()
      const mx = ev.clientX - r.left - taille.w / 2 - s.vue.x
      const my = ev.clientY - r.top - taille.h / 2 - s.vue.y
      const z = Math.min(4, Math.max(0.15, s.vue.z * facteur))
      s.vue.x -= mx * (z / s.vue.z - 1)
      s.vue.y -= my * (z / s.vue.z - 1)
      s.vue.z = z
      setTick(t => t + 1)
    }
    el.addEventListener('wheel', molette, { passive: false })
    return () => el.removeEventListener('wheel', molette)
  }, [taille])

  const s = sim.current
  const versEcran = (n) => ({ x: taille.w / 2 + s.vue.x + n.x * s.vue.z, y: taille.h / 2 + s.vue.y + n.y * s.vue.z })
  const bascule = (t) => setTypes(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n })
  const ouvrirCodex = (n) => { setCodexCible({ type: n.type, id: n.id }); setOnglet('codex') }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '6px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderBottom: '2px solid var(--parch-mid)' }}>
        {TYPES.map(([t, libelle]) => (
          <span key={t} className={'puce' + (types.has(t) ? '' : ' off')} style={{ borderColor: 'var(--or)' }}
            onClick={() => bascule(t)}>{libelle}</span>
        ))}
        <button className="btn clair" onClick={() => { sim.current.chaud = 300; sim.current.vue = { x: 0, y: 0, z: 1 } }}>Recentrer</button>
        <span className="aide" style={{ marginLeft: 'auto' }}>glisser un nœud : le déplacer · glisser le fond : naviguer · molette : zoom · clic : ouvrir dans le Codex</span>
      </div>
      <div ref={conteneur} style={{ flex: 1, position: 'relative', overflow: 'hidden', userSelect: 'none', cursor: 'grab' }}
        onMouseDown={(ev) => {
          if (ev.button !== 0 || ev.target.closest('[data-noeud]')) return
          ev.preventDefault()
          sim.current.dragFond = { x: ev.clientX, y: ev.clientY, vx: sim.current.vue.x, vy: sim.current.vue.y }
        }}>
        <svg width={taille.w} height={taille.h} style={{ display: 'block', background: 'radial-gradient(ellipse at center, #f6efdc, var(--parch))' }}>
          {s.liens.map(([ca, cb], i) => {
            const a = s.index?.[ca], b = s.index?.[cb]
            if (!a || !b) return null
            const pa = versEcran(a), pb = versEcran(b)
            const clair = survol && (survol === ca || survol === cb)
            return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={clair ? 'var(--or)' : 'rgba(122,106,63,.28)'} strokeWidth={clair ? 1.8 : 1} />
          })}
          {s.noeuds.map(n => {
            const p = versEcran(n)
            if (p.x < -60 || p.x > taille.w + 60 || p.y < -60 || p.y > taille.h + 60) return null
            const r = (5 + Math.min(9, n.deg * 1.1)) * Math.sqrt(s.vue.z)
            const enSurvol = survol === n.cle
            return <g key={n.cle} data-noeud style={{ cursor: 'pointer' }}
              onMouseDown={(ev) => {
                ev.preventDefault(); ev.stopPropagation()
                sim.current.dragNoeud = n.cle
                sim.current.origine = { x: ev.clientX, y: ev.clientY, nx: n.x, ny: n.y }
                sim.current.aBouge = false
              }}
              onMouseMove={() => { if (sim.current.dragNoeud === n.cle) sim.current.aBouge = true; setSurvol(n.cle) }}
              onMouseLeave={() => setSurvol(v => v === n.cle ? null : v)}
              onClick={() => { if (!sim.current.aBouge) ouvrirCodex(n) }}>
              <circle cx={p.x} cy={p.y} r={r} fill={n.coul}
                stroke={enSurvol ? 'var(--or)' : 'rgba(0,0,0,.35)'} strokeWidth={enSurvol ? 2.5 : 1} />
              {n.type === 'faction' && <circle cx={p.x} cy={p.y} r={r + 3} fill="none" stroke={n.coul} strokeWidth="1" opacity=".5" />}
              {(s.vue.z > 0.55 || enSurvol || n.type === 'faction') &&
                <text x={p.x} y={p.y + r + 11} textAnchor="middle"
                  style={{ font: (n.type === 'faction' ? '700 ' : '') + '10px "Palatino Linotype", serif', fill: '#3d3319', pointerEvents: 'none' }}>
                  {n.nom.length > 24 ? n.nom.slice(0, 23) + '…' : n.nom}</text>}
            </g>
          })}
        </svg>
      </div>
    </div>
  )
}
