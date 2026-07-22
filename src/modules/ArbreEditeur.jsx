import React, { useEffect, useRef, useState } from 'react'
import { uid } from '../lib/modele.js'

const TYPES_NOEUD = ['etat', 'decision', 'evenement', 'final', 'final positif']
const COULEURS = { etat: '#1c2b45', decision: '#6b4a7e', evenement: '#3f7d5c', final: '#131e31', 'final positif': '#0f2a1e' }
const NW = 180, NH = 54

// ── Manomètre : jauge demi-cercle réutilisée par l'éditeur et le mode session ──
export function Manometre({ compteur, surDelta, largeur = 220 }) {
  const c = compteur
  const min = c.min ?? 0, max = c.max ?? 8
  const val = Math.min(max, Math.max(min, c.valeur ?? c.initial ?? min))
  const R = largeur / 2 - 14, cx = largeur / 2, cy = largeur / 2
  const angle = (v) => Math.PI + ((v - min) / (max - min || 1)) * Math.PI
  const pt = (a, r) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  const zones = []
  const seuils = (c.seuils || []).length ? c.seuils : [{ jusqua: max, libelle: '', couleur: 'vert' }]
  let depuis = min
  const coulZone = { vert: '#3f7d5c', orange: '#c07830', rouge: '#9c3a2e' }
  seuils.forEach((s, i) => {
    const a1 = angle(depuis), a2 = angle(Math.min(s.jusqua, max))
    const p1 = pt(a1, R), p2 = pt(a2, R)
    zones.push(<path key={i} d={`M${p1.x},${p1.y} A${R},${R} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${p2.x},${p2.y}`}
      fill="none" stroke={coulZone[s.couleur] || s.couleur || '#3f7d5c'} strokeWidth="11" strokeLinecap="butt" opacity=".85" />)
    depuis = s.jusqua
  })
  const aV = angle(val), pV = pt(aV, R - 8)
  const seuilActuel = seuils.find(s => val <= s.jusqua) || seuils[seuils.length - 1]
  return (
    <div style={{ textAlign: 'center', display: 'inline-block' }}>
      <svg width={largeur} height={largeur / 2 + 26}>
        {zones}
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const a = angle(min + i), p1 = pt(a, R + 7), p2 = pt(a, R + 12)
          return <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--svg-texte)" strokeWidth="1" />
            <text x={pt(a, R + 20).x} y={pt(a, R + 20).y + 3} textAnchor="middle"
              style={{ font: '8px monospace', fill: 'var(--svg-texte)' }}>{min + i}</text>
          </g>
        })}
        <line x1={cx} y1={cy} x2={pV.x} y2={pV.y} stroke="var(--encre)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="var(--or)" stroke="var(--encre)" />
        <text x={cx} y={cy + 20} textAnchor="middle" style={{ font: '700 15px monospace', fill: 'var(--encre)' }}>{val}</text>
      </svg>
      <div style={{ fontSize: '.78rem', fontStyle: 'italic', color: 'var(--gris)', marginTop: -4 }}>
        {c.nom}{seuilActuel?.libelle ? ` · ${seuilActuel.libelle}` : ''}</div>
      {surDelta && <div style={{ marginTop: 4, display: 'flex', gap: 4, justifyContent: 'center' }}>
        <button className="btn clair" onClick={() => surDelta(-1)}>−1</button>
        <button className="btn clair" onClick={() => surDelta(+1)}>+1</button>
      </div>}
    </div>
  )
}

// ── Éditeur d'arbre v2 : canevas glisser-déposer ──
export default function ArbreEditeur({ arbre, modifier, supprimerArbre }) {
  const conteneur = useRef(null)
  const [taille, setTaille] = useState({ w: 800, h: 480 })
  const [vue, setVue] = useState({ x: 0, y: 0, z: 1 })
  const [sel, setSel] = useState(null)   // { type: 'noeud'|'transition', id|idx }
  const [lien, setLien] = useState(null) // { from, x, y } lien en cours de création
  const drag = useRef(null)

  useEffect(() => {
    const majT = () => conteneur.current && setTaille(t => ({ ...t, w: conteneur.current.clientWidth }))
    majT(); window.addEventListener('resize', majT)
    return () => window.removeEventListener('resize', majT)
  }, [])

  const versMonde = (ev) => {
    const r = conteneur.current.getBoundingClientRect()
    return { x: (ev.clientX - r.left - vue.x) / vue.z, y: (ev.clientY - r.top - vue.y) / vue.z }
  }

  useEffect(() => {
    const move = (ev) => {
      const d = drag.current
      if (d?.type === 'noeud') {
        const m = versMonde(ev)
        modifier(a => {
          const n = a.noeuds.find(x => x.id === d.id)
          n.x = m.x - d.dx; n.y = m.y - d.dy
        })
      } else if (d?.type === 'fond') {
        setVue(v => ({ ...v, x: d.vx + (ev.clientX - d.x), y: d.vy + (ev.clientY - d.y) }))
      } else if (lien) {
        const m = versMonde(ev)
        setLien(l => ({ ...l, x: m.x, y: m.y }))
      }
    }
    const up = (ev) => {
      if (lien) {
        const m = versMonde(ev)
        const cible = arbre.noeuds.find(n => m.x >= n.x && m.x <= n.x + NW && m.y >= n.y && m.y <= n.y + NH)
        if (cible && cible.id !== lien.from) {
          modifier(a => { a.transitions.push({ from: lien.from, to: cible.id, label: '', sombre: false }) })
          setSel({ type: 'transition', idx: arbre.transitions.length })
        }
        setLien(null)
      }
      drag.current = null
    }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  })

  useEffect(() => {
    const el = conteneur.current
    if (!el) return
    const molette = (ev) => {
      ev.preventDefault()
      const f = ev.deltaY < 0 ? 1.15 : 1 / 1.15
      const r = el.getBoundingClientRect()
      const mx = ev.clientX - r.left, my = ev.clientY - r.top
      setVue(v => {
        const z = Math.min(2.5, Math.max(0.25, v.z * f))
        return { z, x: mx - (mx - v.x) * z / v.z, y: my - (my - v.y) * z / v.z }
      })
    }
    el.addEventListener('wheel', molette, { passive: false })
    return () => el.removeEventListener('wheel', molette)
  }, [])

  const ajouterNoeud = () => {
    const id = uid('n')
    const centre = { x: (taille.w / 2 - vue.x) / vue.z - NW / 2, y: (240 - vue.y) / vue.z }
    modifier(a => {
      a.noeuds.push({ id, type: 'etat', phase: 0, titre: 'Nouveau nœud', description: '', replique: '', condition: '', x: centre.x, y: centre.y })
    })
    setSel({ type: 'noeud', id })
  }
  const recadrer = () => {
    if (!arbre.noeuds.length) return
    const xs = arbre.noeuds.map(n => n.x), ys = arbre.noeuds.map(n => n.y)
    setVue({ x: 30 - Math.min(...xs), y: 30 - Math.min(...ys), z: 1 })
  }

  const noeudSel = sel?.type === 'noeud' ? arbre.noeuds.find(n => n.id === sel.id) : null
  const transSel = sel?.type === 'transition' ? arbre.transitions[sel.idx] : null
  const c = arbre.compteur

  return (
    <div>
      {/* Compteur de l'arbre */}
      <div className="carte">
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Manometre compteur={c} surDelta={(d) => modifier(a => {
            a.compteur.valeur = Math.min(a.compteur.max, Math.max(a.compteur.min, (a.compteur.valeur ?? a.compteur.initial ?? 0) + d))
          })} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="rangee">
              <span><label>Nom du compteur</label>
                <input value={c.nom} onChange={e => modifier(a => { a.compteur.nom = e.target.value })} /></span>
              <span className="etroit"><label>Min</label>
                <input type="number" value={c.min} onChange={e => modifier(a => { a.compteur.min = +e.target.value })} /></span>
              <span className="etroit"><label>Max</label>
                <input type="number" value={c.max} onChange={e => modifier(a => { a.compteur.max = +e.target.value })} /></span>
            </div>
            <span><label>Ce qu'il mesure</label>
              <input value={c.description} onChange={e => modifier(a => { a.compteur.description = e.target.value })} /></span>
            <label>Événements du compteur (libellé + delta)</label>
            {c.evenements.map((ev, i) => (
              <div className="rangee" key={i}>
                <input value={ev.label} onChange={e => modifier(a => { a.compteur.evenements[i].label = e.target.value })} />
                <input className="etroit" type="number" value={ev.delta}
                  onChange={e => modifier(a => { a.compteur.evenements[i].delta = +e.target.value })} />
                <button className="btn clair etroit" onClick={() => modifier(a => { a.compteur.evenements.splice(i, 1) })}>×</button>
              </div>
            ))}
            <button className="btn clair" onClick={() => modifier(a => { a.compteur.evenements.push({ label: '', delta: 1 }) })}>+ événement</button>
          </div>
        </div>
      </div>

      {/* Canevas */}
      <div style={{ display: 'flex', gap: 6, margin: '10px 0 6px' }}>
        <button className="btn clair" onClick={ajouterNoeud}>+ nœud</button>
        <button className="btn clair" onClick={recadrer}>Recadrer</button>
        <span className="aide" style={{ alignSelf: 'center' }}>glisser un nœud : déplacer · tirer depuis le rond doré : créer un lien · clic : éditer à droite · molette : zoom</span>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div ref={conteneur} style={{ flex: 1, height: 480, border: '1px solid var(--parch-mid)', background: 'var(--carte)', overflow: 'hidden', position: 'relative', userSelect: 'none', cursor: 'grab' }}
          onMouseDown={(ev) => {
            if (ev.button !== 0 || ev.target.closest('[data-el]')) return
            ev.preventDefault()
            drag.current = { type: 'fond', x: ev.clientX, y: ev.clientY, vx: vue.x, vy: vue.y }
            setSel(null)
          }}>
          <svg width={taille.w} height={480} style={{ display: 'block' }}>
            <g transform={`translate(${vue.x},${vue.y}) scale(${vue.z})`}>
              {arbre.transitions.map((t, i) => {
                const a = arbre.noeuds.find(n => n.id === t.from)
                const b = arbre.noeuds.find(n => n.id === t.to)
                if (!a || !b) return null
                const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, mx = (x1 + x2) / 2
                const estSel = sel?.type === 'transition' && sel.idx === i
                return <g key={i} data-el style={{ cursor: 'pointer' }}
                  onMouseDown={(ev) => { ev.stopPropagation(); setSel({ type: 'transition', idx: i }) }}>
                  <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none" stroke="transparent" strokeWidth="14" />
                  <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none"
                    stroke={estSel ? 'var(--or)' : t.sombre ? '#9c3a2e' : 'var(--axe)'}
                    strokeWidth={estSel ? 2.4 : 1.6} strokeDasharray={t.sombre ? '5 4' : ''} />
                  <polygon points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
                    fill={estSel ? 'var(--or)' : t.sombre ? '#9c3a2e' : 'var(--axe)'} />
                  {t.label && <text x={mx} y={(y1 + y2) / 2 - 6} textAnchor="middle"
                    style={{ font: '9px monospace', fill: 'var(--svg-texte)' }}>{t.label}</text>}
                </g>
              })}
              {lien && (() => {
                const a = arbre.noeuds.find(n => n.id === lien.from)
                if (!a) return null
                return <line x1={a.x + NW} y1={a.y + NH / 2} x2={lien.x} y2={lien.y}
                  stroke="var(--or)" strokeWidth="2" strokeDasharray="4 3" />
              })()}
              {arbre.noeuds.map(n => {
                const estSel = sel?.type === 'noeud' && sel.id === n.id
                const finalPositif = n.type === 'final positif'
                return <g key={n.id} data-el style={{ cursor: 'move' }}
                  onMouseDown={(ev) => {
                    ev.stopPropagation(); ev.preventDefault()
                    const m = versMonde(ev)
                    drag.current = { type: 'noeud', id: n.id, dx: m.x - n.x, dy: m.y - n.y }
                    setSel({ type: 'noeud', id: n.id })
                  }}>
                  <rect x={n.x} y={n.y} width={NW} height={NH} rx="6" fill={COULEURS[n.type] || '#1c2b45'}
                    stroke={estSel ? 'var(--or)' : n.type.startsWith('final') ? (finalPositif ? '#3f7d5c' : '#9c3a2e') : 'rgba(201,162,39,.6)'}
                    strokeWidth={estSel ? 2.5 : 1.4} />
                  <text x={n.x + 10} y={n.y + 18} style={{ font: '8px monospace', fill: '#e6c96a', letterSpacing: '.1em' }}>
                    {n.type.toUpperCase()}</text>
                  <text x={n.x + 10} y={n.y + 37} style={{ font: '600 11.5px Palatino, serif', fill: '#f2ead6' }}>
                    {n.titre.length > 25 ? n.titre.slice(0, 24) + '…' : n.titre}</text>
                  <circle data-el cx={n.x + NW} cy={n.y + NH / 2} r="7" fill="var(--or)" stroke="var(--bleu-nuit)"
                    style={{ cursor: 'crosshair' }}
                    onMouseDown={(ev) => {
                      ev.stopPropagation(); ev.preventDefault()
                      const m = versMonde(ev)
                      setLien({ from: n.id, x: m.x, y: m.y })
                    }} />
                </g>
              })}
            </g>
          </svg>
        </div>

        {/* Panneau latéral d'édition */}
        <div style={{ width: 280, flex: 'none', border: '1px solid var(--parch-mid)', background: 'var(--fond2)', padding: 12, overflowY: 'auto', maxHeight: 480 }}>
          {noeudSel ? <>
            <h3 style={{ marginTop: 0 }}>Nœud</h3>
            <span><label>Titre</label>
              <input value={noeudSel.titre} onChange={e => modifier(a => { a.noeuds.find(n => n.id === sel.id).titre = e.target.value })} /></span>
            <span><label>Type</label>
              <select value={noeudSel.type} onChange={e => modifier(a => { a.noeuds.find(n => n.id === sel.id).type = e.target.value })}>
                {TYPES_NOEUD.map(t => <option key={t}>{t}</option>)}
              </select></span>
            <span><label>Description (à lire ou jouer)</label>
              <textarea style={{ minHeight: 90 }} value={noeudSel.description}
                onChange={e => modifier(a => { a.noeuds.find(n => n.id === sel.id).description = e.target.value })} /></span>
            <span><label>Réplique type</label>
              <textarea style={{ minHeight: 60 }} value={noeudSel.replique}
                onChange={e => modifier(a => { a.noeuds.find(n => n.id === sel.id).replique = e.target.value })} /></span>
            <span><label>Condition d'activation</label>
              <input value={noeudSel.condition || ''} placeholder="Compteur ≥ 5"
                onChange={e => modifier(a => { a.noeuds.find(n => n.id === sel.id).condition = e.target.value })} /></span>
            <button className="btn danger" style={{ marginTop: 10 }} onClick={() => {
              modifier(a => {
                a.transitions = a.transitions.filter(t => t.from !== sel.id && t.to !== sel.id)
                a.noeuds = a.noeuds.filter(n => n.id !== sel.id)
              })
              setSel(null)
            }}>Supprimer le nœud</button>
          </> : transSel ? <>
            <h3 style={{ marginTop: 0 }}>Transition</h3>
            <p className="aide">{arbre.noeuds.find(n => n.id === transSel.from)?.titre} → {arbre.noeuds.find(n => n.id === transSel.to)?.titre}</p>
            <span><label>Déclencheur</label>
              <input value={transSel.label || ''} placeholder="Compteur atteint 5"
                onChange={e => modifier(a => { a.transitions[sel.idx].label = e.target.value })} /></span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none', letterSpacing: 0 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={!!transSel.sombre}
                onChange={e => modifier(a => { a.transitions[sel.idx].sombre = e.target.checked })} />
              trajectoire sombre (pointillés rouges)
            </label>
            <button className="btn danger" style={{ marginTop: 10 }} onClick={() => {
              modifier(a => { a.transitions.splice(sel.idx, 1) })
              setSel(null)
            }}>Supprimer la transition</button>
          </> : <p className="aide">Clique sur un nœud ou une transition pour l'éditer. Tire depuis le rond doré d'un nœud vers un autre pour créer un lien.</p>}
        </div>
      </div>
      <button className="btn danger" style={{ marginTop: 10 }} onClick={supprimerArbre}>Supprimer l'arbre</button>
    </div>
  )
}
