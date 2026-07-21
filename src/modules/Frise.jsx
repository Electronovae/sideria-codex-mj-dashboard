import React, { useEffect, useRef, useState } from 'react'
import { useStudio } from './communs.jsx'
import { nouvelArc, SYMBOLES } from '../lib/modele.js'
import { fmtDate, versJour, depuisJour, JPA, JPS, SAISONS } from '../lib/calendrier.js'

const H_LIGNE = 32, H_AXE = 46, MARGE_G = 185

function Forme({ symbole, x, y, t, fill, creux, ...reste }) {
  const st = { fill: creux ? 'none' : fill, stroke: creux ? fill : 'rgba(0,0,0,.4)', strokeWidth: creux ? 2 : 1 }
  if (symbole === 'cercle') return <circle cx={x} cy={y} r={t} {...st} {...reste} />
  if (symbole === 'carre') return <rect x={x - t} y={y - t} width={2 * t} height={2 * t} {...st} {...reste} />
  if (symbole === 'triangle') return <path d={`M${x},${y - t} L${x + t},${y + t} L${x - t},${y + t} Z`} {...st} {...reste} />
  if (symbole === 'etoile') {
    const p = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? t / 2.2 : t, a = -Math.PI / 2 + i * Math.PI / 5
      p.push(`${x + r * Math.cos(a)},${y + r * Math.sin(a)}`)
    }
    return <polygon points={p.join(' ')} {...st} {...reste} />
  }
  return <path d={`M${x},${y - t} L${x + t},${y} L${x},${y + t} L${x - t},${y} Z`} {...st} {...reste} />
}

export default function Frise() {
  const { univers, maj } = useStudio()
  const conteneur = useRef(null)
  const [vue, setVue] = useState({ t0: versJour(300), ech: 0.06 })
  const [largeur, setLargeur] = useState(900)
  const [filtreFac, setFiltreFac] = useState(() => new Set(univers.factions.map(f => f.id)))
  const [filtreTypes, setFiltreTypes] = useState(() => new Set(['PJ', 'PNJ']))
  const [survol, setSurvol] = useState(null)
  const [panneauArcs, setPanneauArcs] = useState(false)
  const drag = useRef(null)

  useEffect(() => {
    const majL = () => conteneur.current && setLargeur(conteneur.current.clientWidth)
    majL(); window.addEventListener('resize', majL)
    return () => window.removeEventListener('resize', majL)
  }, [])

  // Zoom : Ctrl+molette, écouteur NON passif (la molette seule défile verticalement).
  useEffect(() => {
    const el = conteneur.current
    if (!el) return
    const surMolette = (ev) => {
      if (!ev.ctrlKey) return
      ev.preventDefault()
      const facteur = ev.deltaY < 0 ? 1.18 : 1 / 1.18
      const ox = ev.clientX - el.getBoundingClientRect().left
      setVue(v => {
        const jCurseur = v.t0 + ox / v.ech
        const ech = Math.min(6, Math.max(0.0008, v.ech * facteur))
        return { ech, t0: jCurseur - ox / ech }
      })
    }
    el.addEventListener('wheel', surMolette, { passive: false })
    return () => el.removeEventListener('wheel', surMolette)
  }, [])

  // Glisser : écouté sur la fenêtre, plus de drag fantôme.
  useEffect(() => {
    const move = (ev) => { if (drag.current) setVue(v => ({ ...v, t0: drag.current.t0 - (ev.clientX - drag.current.x) / v.ech })) }
    const up = () => { drag.current = null }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [])

  const faction = (id) => univers.factions.find(f => f.id === id)
  const arc = (id) => univers.arcs.find(a => a.id === id)
  const lignes = [
    ...(filtreTypes.has('PJ') ? univers.joueurs.map(j => ({ id: j.id, nom: j.personnage, type: 'PJ', faction: j.faction })) : []),
    ...(filtreTypes.has('PNJ') ? univers.pnjs.map(p => ({ id: p.id, nom: p.nom, type: 'PNJ', faction: p.faction })) : []),
  ].filter(l => l.faction == null || filtreFac.has(l.faction))
  const indexLigne = Object.fromEntries(lignes.map((l, i) => [l.id, i]))
  const hauteur = H_AXE + 14 + Math.max(1, lignes.length) * H_LIGNE
  const xDe = (j) => (j - vue.t0) * vue.ech
  const jDe = (x) => vue.t0 + x / vue.ech

  let pas, pasMajeur, precision
  if (vue.ech < 0.004) { pas = 100 * JPA; pasMajeur = 500 * JPA; precision = 'an' }
  else if (vue.ech < 0.03) { pas = 10 * JPA; pasMajeur = 100 * JPA; precision = 'an' }
  else if (vue.ech < 0.35) { pas = JPA; pasMajeur = 10 * JPA; precision = 'an' }
  else { pas = JPS; pasMajeur = JPA; precision = 'saison' }
  const ticks = []
  for (let j = Math.floor(jDe(MARGE_G) / pas) * pas; xDe(j) < largeur; j += pas) if (xDe(j) >= MARGE_G - 4) ticks.push(j)

  const couleurEvt = (e) => e.couleur || arc(e.arcId)?.couleur || faction(e.factionId)?.couleur || '#8a8272'
  const marques = []
  univers.evenements.forEach(e => {
    e.participants.filter(id => id in indexLigne).forEach(id =>
      marques.push({ obj: e, ligne: indexLigne[id], x: xDe(e.debut), xFin: e.fin != null ? xDe(e.fin) : null,
        coul: couleurEvt(e), taille: 3 + (e.importance || 1) * 2, symbole: e.symbole }))
  })
  univers.joueurs.forEach(j => {
    if (!(j.id in indexLigne)) return
    j.interactions.forEach(it => {
      if (it.date == null) return
      const pnj = univers.pnjs.find(p => p.id === it.pnjId)
      marques.push({ obj: { titre: `${j.personnage} × ${pnj?.nom || '?'}`, desc: it.resume, debut: it.date, fin: null },
        ligne: indexLigne[j.id], x: xDe(it.date), xFin: null,
        coul: faction(pnj?.faction)?.couleur || '#8a8272', taille: 5, symbole: 'losange', creux: true })
    })
  })
  const liens = []
  univers.evenements.forEach(e => {
    const ys = e.participants.filter(id => id in indexLigne).map(id => H_AXE + 8 + indexLigne[id] * H_LIGNE + H_LIGNE / 2)
    if (ys.length > 1) liens.push({ x: xDe(e.debut), y1: Math.min(...ys), y2: Math.max(...ys) })
  })

  const bascule = (ens, setEns, id) => { const n = new Set(ens); n.has(id) ? n.delete(id) : n.add(id); setEns(n) }
  const centrer = (an, ech) => setVue({ ech, t0: versJour(an) - (largeur + MARGE_G) / 2 / ech })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '6px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', borderBottom: '2px solid var(--parch-mid)' }}>
        <button className="btn clair" onClick={() => centrer(312, 0.0025)}>Ères</button>
        <button className="btn clair" onClick={() => centrer(312, 0.06)}>Années</button>
        <button className="btn clair" onClick={() => centrer(312, 1)}>Saisons</button>
        <button className="btn clair" onClick={() => setPanneauArcs(v => !v)}>Arcs ({univers.arcs.length})</button>
        {['PJ', 'PNJ'].map(t => <span key={t} className={'puce' + (filtreTypes.has(t) ? '' : ' off')}
          style={{ borderColor: 'var(--or)' }} onClick={() => bascule(filtreTypes, setFiltreTypes, t)}>{t}</span>)}
        {univers.factions.map(f => <span key={f.id} className={'puce' + (filtreFac.has(f.id) ? '' : ' off')}
          style={{ borderColor: f.couleur }} onClick={() => bascule(filtreFac, setFiltreFac, f.id)}>
          <span className="rond" style={{ background: f.couleur }} />{f.nom}</span>)}
        <span className="aide" style={{ marginLeft: 'auto' }}>molette : défiler · Ctrl+molette : zoom · glisser : naviguer</span>
      </div>
      {panneauArcs && (
        <div style={{ padding: '8px 14px', borderBottom: '2px solid var(--parch-mid)', background: '#efe6cf' }}>
          {univers.arcs.map((a, i) => (
            <div key={a.id} className="rangee" style={{ marginBottom: 4, alignItems: 'end' }}>
              <input value={a.nom} onChange={e => maj(u => { u.arcs[i].nom = e.target.value })} />
              <input type="color" value={a.couleur} style={{ height: 32, flex: '0 0 60px' }}
                onChange={e => maj(u => { u.arcs[i].couleur = e.target.value })} />
              <input className="etroit" type="number" title="An de début" value={depuisJour(a.debut).an}
                onChange={e => maj(u => { u.arcs[i].debut = versJour(+e.target.value || 312) })} />
              <input className="etroit" type="number" title="An de fin" value={depuisJour(a.fin).an}
                onChange={e => maj(u => { u.arcs[i].fin = versJour(+e.target.value || 314) })} />
              <button className="btn clair" style={{ flex: '0 0 40px' }}
                onClick={() => maj(u => { u.arcs.splice(i, 1); u.evenements.forEach(e => { if (e.arcId === a.id) e.arcId = null }) })}>×</button>
            </div>
          ))}
          <button className="btn clair" onClick={() => maj(u => { u.arcs.push(nouvelArc()) })}>+ arc</button>
          <span className="aide" style={{ marginLeft: 10 }}>Un arc = une bande de fond. Rattache les événements à un arc dans l'onglet Événements.</span>
        </div>
      )}
      <div ref={conteneur} style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden', cursor: 'grab' }}
        onMouseDown={(ev) => { drag.current = { x: ev.clientX, t0: vue.t0 } }} onMouseLeave={() => setSurvol(null)}>
        <svg width={largeur} height={hauteur} style={{ display: 'block' }}>
          {univers.arcs.map(a => {
            const x1 = Math.max(MARGE_G, xDe(a.debut)), x2 = Math.min(largeur, xDe(a.fin))
            if (x2 <= x1) return null
            return <g key={a.id}>
              <rect x={x1} y={H_AXE} width={x2 - x1} height={hauteur - H_AXE} fill={a.couleur} opacity=".08" />
              <rect x={x1} y={H_AXE} width={x2 - x1} height={16} fill={a.couleur} opacity=".55" />
              <text x={x1 + 6} y={H_AXE + 12} style={{ font: '700 10px monospace', fill: '#fff' }}>{a.nom}</text>
            </g>
          })}
          {lignes.map((l, i) => {
            const y = H_AXE + 8 + i * H_LIGNE + H_LIGNE / 2
            return <line key={l.id} x1={MARGE_G} y1={y} x2={largeur} y2={y}
              stroke={faction(l.faction)?.couleur || '#8a8272'} strokeWidth="1" opacity=".15" />
          })}
          {ticks.map(j => {
            const x = xDe(j), majr = j % pasMajeur === 0
            return <g key={j}>
              <line x1={x} y1={H_AXE - 12} x2={x} y2={majr ? hauteur : H_AXE}
                stroke={majr ? '#7a6a3f' : 'rgba(122,106,63,.2)'} strokeWidth={majr ? 1.4 : 1} />
              {(majr || pas >= JPA) && <text x={x + 4} y={H_AXE - 18}
                style={{ font: (majr ? '700 12px' : '11px') + ' monospace', fill: majr ? '#3d3319' : '#5c5232' }}>
                {precision === 'saison' && !majr ? SAISONS[depuisJour(j).sais] : fmtDate(j, 'an')}</text>}
            </g>
          })}
          <line x1="0" y1={H_AXE} x2={largeur} y2={H_AXE} stroke="#7a6a3f" strokeWidth="2" />
          {liens.map((l, i) => (l.x > MARGE_G - 10 && l.x < largeur + 10) &&
            <line key={i} x1={l.x} y1={l.y1} x2={l.x} y2={l.y2} stroke="rgba(38,34,26,.35)" strokeDasharray="2 3" />)}
          {marques.map((m, i) => {
            if (m.x < MARGE_G - 20 || m.x > largeur + 20) return null
            const y = H_AXE + 8 + m.ligne * H_LIGNE + H_LIGNE / 2
            const props = {
              style: { cursor: 'pointer' },
              onMouseMove: (ev) => setSurvol({ x: ev.clientX, y: ev.clientY, obj: m.obj }),
              onMouseLeave: () => setSurvol(null),
            }
            if (m.xFin != null && m.xFin > m.x)
              return <rect key={i} {...props} x={m.x} y={y - m.taille / 1.5} width={Math.max(6, m.xFin - m.x)}
                height={m.taille * 1.3} rx="3" fill={m.coul} stroke="rgba(0,0,0,.4)" />
            return <Forme key={i} {...props} symbole={m.symbole} x={m.x} y={y} t={m.taille} fill={m.coul} creux={m.creux} />
          })}
        </svg>
        <div style={{ position: 'absolute', left: 0, top: 0, height: hauteur, width: MARGE_G, pointerEvents: 'none',
          background: 'linear-gradient(90deg, var(--parch) 80%, transparent)' }}>
          {lignes.map((l, i) => (
            <div key={l.id} style={{ position: 'absolute', top: H_AXE + 8 + i * H_LIGNE, height: H_LIGNE,
              display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', width: '100%' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: faction(l.faction)?.couleur || '#8a8272',
                flex: 'none', border: '1px solid rgba(0,0,0,.3)' }} />
              <span style={{ fontSize: '.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nom}</span>
              <span style={{ font: '8px monospace', color: 'var(--gris)' }}>{l.type}</span>
            </div>
          ))}
        </div>
        {survol && <div style={{ position: 'fixed', left: survol.x + 14, top: survol.y + 10, background: 'var(--bleu-nuit)',
          color: 'var(--parch)', border: '1px solid var(--or)', padding: '7px 10px', fontSize: '.78rem', maxWidth: 300,
          pointerEvents: 'none', zIndex: 40 }}>
          <strong>{survol.obj.titre}</strong><br />
          <span style={{ font: '10px monospace', color: 'var(--or-clair)' }}>
            {fmtDate(survol.obj.debut)}{survol.obj.fin != null ? ` → ${fmtDate(survol.obj.fin)}` : ''}</span>
          {survol.obj.desc && <><br />{survol.obj.desc.slice(0, 180)}</>}
        </div>}
      </div>
    </div>
  )
}
