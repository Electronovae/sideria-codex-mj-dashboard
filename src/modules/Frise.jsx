import React, { useEffect, useRef, useState } from 'react'
import { useStudio } from './communs.jsx'
import { fmtDate, versJour, depuisJour, JPA, JPS, SAISONS } from '../lib/calendrier.js'

const H_LIGNE = 32, H_AXE = 44, MARGE_G = 185

export default function Frise() {
  const { univers } = useStudio()
  const conteneur = useRef(null)
  const [vue, setVue] = useState({ t0: versJour(300), ech: 0.06 })
  const [taille, setTaille] = useState({ w: 900, h: 500 })
  const [filtreFac, setFiltreFac] = useState(() => new Set(univers.factions.map(f => f.id)))
  const [filtreTypes, setFiltreTypes] = useState(() => new Set(['PJ', 'PNJ']))
  const [survol, setSurvol] = useState(null)
  const drag = useRef(null)

  useEffect(() => {
    const maj = () => {
      if (conteneur.current) setTaille({ w: conteneur.current.clientWidth, h: conteneur.current.clientHeight })
    }
    maj()
    window.addEventListener('resize', maj)
    return () => window.removeEventListener('resize', maj)
  }, [])

  const faction = (id) => univers.factions.find(f => f.id === id)

  // Lignes : PJ puis PNJ, filtrés.
  const lignes = [
    ...(filtreTypes.has('PJ') ? univers.joueurs.map(j => ({ id: j.id, nom: j.personnage, type: 'PJ', faction: j.faction })) : []),
    ...(filtreTypes.has('PNJ') ? univers.pnjs.map(p => ({ id: p.id, nom: p.nom, type: 'PNJ', faction: p.faction })) : []),
  ].filter(l => l.faction == null || filtreFac.has(l.faction))
  const indexLigne = Object.fromEntries(lignes.map((l, i) => [l.id, i]))

  const xDe = (j) => (j - vue.t0) * vue.ech
  const jDe = (x) => vue.t0 + x / vue.ech

  // ── Axe adaptatif ──
  let pas, pasMajeur, precision
  if (vue.ech < 0.004) { pas = 100 * JPA; pasMajeur = 500 * JPA; precision = 'an' }
  else if (vue.ech < 0.03) { pas = 10 * JPA; pasMajeur = 100 * JPA; precision = 'an' }
  else if (vue.ech < 0.35) { pas = JPA; pasMajeur = 10 * JPA; precision = 'an' }
  else { pas = JPS; pasMajeur = JPA; precision = 'saison' }
  const ticks = []
  for (let j = Math.floor(jDe(MARGE_G) / pas) * pas; xDe(j) < taille.w; j += pas) {
    if (xDe(j) < MARGE_G - 4) continue
    ticks.push(j)
  }

  // ── Marqueurs à dessiner ──
  const marques = []
  univers.evenements.forEach(e => {
    const coul = faction(e.factionId)?.couleur || '#8a8272'
    const cibles = e.participants.filter(id => id in indexLigne)
    const lanes = cibles.length ? cibles : []
    lanes.forEach(id => marques.push({ type: 'evt', obj: e, ligne: indexLigne[id], x: xDe(e.debut), xFin: e.fin != null ? xDe(e.fin) : null, coul, taille: 3 + (e.importance || 1) * 2 }))
  })
  univers.joueurs.forEach(j => {
    if (!(j.id in indexLigne)) return
    j.interactions.forEach(it => {
      if (it.date == null) return
      const pnj = univers.pnjs.find(p => p.id === it.pnjId)
      const coul = faction(pnj?.faction)?.couleur || '#8a8272'
      marques.push({ type: 'int', obj: { titre: `${j.personnage} × ${pnj?.nom || '?'}`, desc: it.resume, debut: it.date, fin: null }, ligne: indexLigne[j.id], x: xDe(it.date), xFin: null, coul, taille: 5, creux: true })
    })
  })
  // liens verticaux entre participants d'un même événement
  const liens = []
  univers.evenements.forEach(e => {
    const ys = e.participants.filter(id => id in indexLigne).map(id => H_AXE + 6 + indexLigne[id] * H_LIGNE + H_LIGNE / 2)
    if (ys.length > 1) liens.push({ x: xDe(e.debut), y1: Math.min(...ys), y2: Math.max(...ys) })
  })

  // ── Navigation ──
  const surMolette = (ev) => {
    ev.preventDefault()
    const facteur = ev.deltaY < 0 ? 1.18 : 1 / 1.18
    const rect = conteneur.current.getBoundingClientRect()
    const ox = ev.clientX - rect.left
    const jCurseur = vue.t0 + ox / vue.ech
    const ech = Math.min(6, Math.max(0.0008, vue.ech * facteur))
    setVue({ ech, t0: jCurseur - ox / ech })
  }
  const surSouris = {
    onMouseDown: (ev) => { drag.current = { x: ev.clientX, t0: vue.t0 } },
    onMouseMove: (ev) => { if (drag.current) setVue(v => ({ ...v, t0: drag.current.t0 - (ev.clientX - drag.current.x) / v.ech })) },
    onMouseUp: () => { drag.current = null },
    onMouseLeave: () => { drag.current = null; setSurvol(null) },
  }
  const centrer = (an, ech) => setVue({ ech, t0: versJour(an) - (taille.w + MARGE_G) / 2 / ech })

  const bascule = (ens, setEns, id) => {
    const n = new Set(ens)
    n.has(id) ? n.delete(id) : n.add(id)
    setEns(n)
  }

  const hauteurUtile = H_AXE + 12 + lignes.length * H_LIGNE

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '6px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderBottom: '2px solid var(--parch-mid)' }}>
        <button className="btn clair" onClick={() => centrer(312, 0.0025)}>Ères</button>
        <button className="btn clair" onClick={() => centrer(312, 0.06)}>Années</button>
        <button className="btn clair" onClick={() => centrer(312, 1)}>Saisons</button>
        {['PJ', 'PNJ'].map(t => (
          <span key={t} className={'puce' + (filtreTypes.has(t) ? '' : ' off')} style={{ borderColor: 'var(--or)' }}
            onClick={() => bascule(filtreTypes, setFiltreTypes, t)}>{t}</span>
        ))}
        {univers.factions.map(f => (
          <span key={f.id} className={'puce' + (filtreFac.has(f.id) ? '' : ' off')} style={{ borderColor: f.couleur }}
            onClick={() => bascule(filtreFac, setFiltreFac, f.id)}>
            <span className="rond" style={{ background: f.couleur }} />{f.nom}</span>
        ))}
        <span className="aide" style={{ marginLeft: 'auto' }}>molette : zoom · glisser : naviguer · les losanges creux sont les interactions PJ</span>
      </div>
      <div ref={conteneur} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: drag.current ? 'grabbing' : 'grab' }}
        onWheel={surMolette} {...surSouris}>
        <svg width={taille.w} height={Math.max(taille.h, hauteurUtile)}>
          {/* lignes de vie */}
          {lignes.map((l, i) => {
            const y = H_AXE + 6 + i * H_LIGNE + H_LIGNE / 2
            return <line key={l.id} x1={MARGE_G} y1={y} x2={taille.w} y2={y}
              stroke={faction(l.faction)?.couleur || '#8a8272'} strokeWidth="1" opacity=".15" />
          })}
          {/* axe */}
          {ticks.map(j => {
            const x = xDe(j), majeur = j % pasMajeur === 0
            return <g key={j}>
              <line x1={x} y1={H_AXE - 12} x2={x} y2={majeur ? Math.max(taille.h, hauteurUtile) : H_AXE}
                stroke={majeur ? '#7a6a3f' : 'rgba(122,106,63,.2)'} strokeWidth={majeur ? 1.4 : 1} />
              {(majeur || pas >= JPA) && <text x={x + 4} y={H_AXE - 18}
                style={{ font: (majeur ? '700 12px' : '11px') + ' monospace', fill: majeur ? '#3d3319' : '#5c5232' }}>
                {precision === 'saison' && !majeur ? SAISONS[depuisJour(j).sais] : fmtDate(j, 'an')}</text>}
            </g>
          })}
          <line x1="0" y1={H_AXE} x2={taille.w} y2={H_AXE} stroke="#7a6a3f" strokeWidth="2" />
          {/* liens verticaux */}
          {liens.map((l, i) => (l.x > MARGE_G - 10 && l.x < taille.w + 10) &&
            <line key={i} x1={l.x} y1={l.y1} x2={l.x} y2={l.y2} stroke="rgba(38,34,26,.35)" strokeDasharray="2 3" />)}
          {/* marqueurs */}
          {marques.map((m, i) => {
            if (m.x < MARGE_G - 20 || m.x > taille.w + 20) return null
            const y = H_AXE + 6 + m.ligne * H_LIGNE + H_LIGNE / 2
            const t = m.taille
            const commun = {
              key: i, style: { cursor: 'pointer' },
              onMouseMove: (ev) => setSurvol({ x: ev.clientX, y: ev.clientY, obj: m.obj }),
              onMouseLeave: () => setSurvol(null),
            }
            if (m.xFin != null && m.xFin > m.x) {
              return <rect {...commun} x={m.x} y={y - t / 1.5} width={Math.max(6, m.xFin - m.x)} height={t * 1.3} rx="3"
                fill={m.coul} stroke="rgba(0,0,0,.4)" />
            }
            return <path {...commun} d={`M${m.x},${y - t} L${m.x + t},${y} L${m.x},${y + t} L${m.x - t},${y} Z`}
              fill={m.creux ? 'none' : m.coul} stroke={m.creux ? m.coul : 'rgba(0,0,0,.4)'} strokeWidth={m.creux ? 2 : 1} />
          })}
        </svg>
        {/* étiquettes des lignes */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: MARGE_G, pointerEvents: 'none', background: 'linear-gradient(90deg, var(--parch) 80%, transparent)' }}>
          {lignes.map((l, i) => (
            <div key={l.id} style={{ position: 'absolute', top: H_AXE + 6 + i * H_LIGNE, height: H_LIGNE, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', width: '100%' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: faction(l.faction)?.couleur || '#8a8272', flex: 'none', border: '1px solid rgba(0,0,0,.3)' }} />
              <span style={{ fontSize: '.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nom}</span>
              <span style={{ font: '8px monospace', color: 'var(--gris)' }}>{l.type}</span>
            </div>
          ))}
        </div>
        {survol && (
          <div style={{ position: 'fixed', left: survol.x + 14, top: survol.y + 10, background: 'var(--bleu-nuit)', color: 'var(--parch)', border: '1px solid var(--or)', padding: '7px 10px', fontSize: '.78rem', maxWidth: 300, pointerEvents: 'none', zIndex: 40 }}>
            <strong>{survol.obj.titre}</strong><br />
            <span style={{ font: '10px monospace', color: 'var(--or-clair)' }}>
              {fmtDate(survol.obj.debut)}{survol.obj.fin != null ? ` → ${fmtDate(survol.obj.fin)}` : ''}</span>
            {survol.obj.desc && <><br />{survol.obj.desc.slice(0, 180)}</>}
          </div>
        )}
        {lignes.length === 0 && <div className="vide">Aucune ligne visible : active des types ou des factions dans les filtres.</div>}
      </div>
    </div>
  )
}
