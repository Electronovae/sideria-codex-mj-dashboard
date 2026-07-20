import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche } from './communs.jsx'
import { nouveauPnj, nouvelArbre, uid } from '../lib/modele.js'

const TYPES_NOEUD = ['etat', 'decision', 'evenement', 'final', 'final positif']

export default function Pnjs() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(univers.pnjs[0]?.id ?? null)
  const pnj = univers.pnjs.find(p => p.id === selId)

  const ajouter = () => {
    const p = nouveauPnj()
    maj(u => u.pnjs.push(p))
    setSelId(p.id)
  }
  const modifier = (fn) => maj(u => { fn(u.pnjs.find(p => p.id === selId)) })
  const supprimer = () => {
    if (!confirm(`Supprimer ${pnj.nom} ?`)) return
    maj(u => {
      u.pnjs = u.pnjs.filter(p => p.id !== selId)
      u.evenements.forEach(e => { e.participants = e.participants.filter(x => x !== selId) })
      u.campagnes.forEach(c => { c.pnjIds = c.pnjIds.filter(x => x !== selId) })
      u.factions.forEach(f => { f.chefIds = f.chefIds.filter(x => x !== selId) })
    })
    setSelId(null)
  }

  return (
    <ListeFiche
      items={univers.pnjs} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouveau PNJ"
      rendu={p => {
        const f = univers.factions.find(x => x.id === p.faction)
        return (<><span className="rond" style={{ background: f?.couleur || '#888' }} />
          <span>{p.nom}<div className="sous">{p.role}{p.arbre ? ' · arbre ✓' : ''}</div></span></>)
      }}
      enfants={pnj && (
        <div key={pnj.id}>
          <h2>{pnj.nom}</h2>
          <div className="rangee">
            <Champ label="Nom" value={pnj.nom} onChange={e => modifier(p => { p.nom = e.target.value })} />
            <Champ label="Rôle" value={pnj.role} onChange={e => modifier(p => { p.role = e.target.value })} />
            <span><label>Faction</label>
              <SelecteurFaction valeur={pnj.faction} surChange={v => modifier(p => { p.faction = v })} /></span>
          </div>
          <Champ label="Description" zone value={pnj.description}
            onChange={e => modifier(p => { p.description = e.target.value })} />
          <Champ label="Secrets Maître" zone value={pnj.secrets}
            onChange={e => modifier(p => { p.secrets = e.target.value })} />

          <h3>Répliques types</h3>
          {pnj.repliques.map((r, i) => (
            <div className="rangee" key={i}>
              <input value={r} onChange={e => modifier(p => { p.repliques[i] = e.target.value })} />
              <button className="btn clair etroit" onClick={() => modifier(p => { p.repliques.splice(i, 1) })}>retirer</button>
            </div>
          ))}
          <button className="btn clair" onClick={() => modifier(p => { p.repliques.push('') })}>+ réplique</button>

          <h3>Arbre de décision</h3>
          {!pnj.arbre
            ? <button className="btn clair" onClick={() => modifier(p => { p.arbre = nouvelArbre() })}>Créer un arbre pour ce PNJ</button>
            : <EditeurArbre arbre={pnj.arbre} modifier={fn => modifier(p => fn(p.arbre))}
                supprimerArbre={() => { if (confirm('Supprimer l\u2019arbre ?')) modifier(p => { p.arbre = null }) }} />}

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce PNJ</button>
          </div>
        </div>
      )}
    />
  )
}

function EditeurArbre({ arbre, modifier, supprimerArbre }) {
  const c = arbre.compteur
  return (
    <div>
      <div className="carte">
        <div className="rangee">
          <Champ label="Nom du compteur" value={c.nom} onChange={e => modifier(a => { a.compteur.nom = e.target.value })} />
          <Champ className="etroit" label="Min" type="number" value={c.min} onChange={e => modifier(a => { a.compteur.min = +e.target.value })} />
          <Champ className="etroit" label="Max" type="number" value={c.max} onChange={e => modifier(a => { a.compteur.max = +e.target.value })} />
          <Champ className="etroit" label="Départ" type="number" value={c.initial} onChange={e => modifier(a => { a.compteur.initial = +e.target.value })} />
        </div>
        <Champ label="Ce que le compteur mesure" value={c.description}
          onChange={e => modifier(a => { a.compteur.description = e.target.value })} />
        <label>Événements du compteur (libellé + delta)</label>
        {c.evenements.map((ev, i) => (
          <div className="rangee" key={i}>
            <input value={ev.label} onChange={e => modifier(a => { a.compteur.evenements[i].label = e.target.value })} />
            <input className="etroit" type="number" value={ev.delta} onChange={e => modifier(a => { a.compteur.evenements[i].delta = +e.target.value })} />
            <button className="btn clair etroit" onClick={() => modifier(a => { a.compteur.evenements.splice(i, 1) })}>retirer</button>
          </div>
        ))}
        <button className="btn clair" onClick={() => modifier(a => { a.compteur.evenements.push({ label: '', delta: 1 }) })}>+ événement de compteur</button>
      </div>

      <h3>Nœuds</h3>
      <table className="grille">
        <thead><tr><th>Titre</th><th>Type</th><th>Phase</th><th>Description</th><th>Réplique</th><th /></tr></thead>
        <tbody>
          {arbre.noeuds.map((n, i) => (
            <tr key={n.id}>
              <td><input value={n.titre} onChange={e => modifier(a => { a.noeuds[i].titre = e.target.value })} /></td>
              <td><select value={n.type} onChange={e => modifier(a => { a.noeuds[i].type = e.target.value })}>
                {TYPES_NOEUD.map(t => <option key={t}>{t}</option>)}</select></td>
              <td><input type="number" min="0" max="6" style={{ width: 52 }} value={n.phase}
                onChange={e => modifier(a => { a.noeuds[i].phase = +e.target.value })} /></td>
              <td><textarea style={{ minHeight: 40 }} value={n.description}
                onChange={e => modifier(a => { a.noeuds[i].description = e.target.value })} /></td>
              <td><textarea style={{ minHeight: 40 }} value={n.replique}
                onChange={e => modifier(a => { a.noeuds[i].replique = e.target.value })} /></td>
              <td><button className="btn clair" onClick={() => modifier(a => {
                a.transitions = a.transitions.filter(t => t.from !== n.id && t.to !== n.id)
                a.noeuds.splice(i, 1)
              })}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn clair" onClick={() => modifier(a => {
        a.noeuds.push({ id: uid('n'), type: 'etat', phase: 0, titre: 'Nouveau nœud', description: '', replique: '', condition: '' })
      })}>+ nœud</button>

      <h3>Transitions</h3>
      <table className="grille">
        <thead><tr><th>De</th><th>Vers</th><th>Déclencheur</th><th>Sombre</th><th /></tr></thead>
        <tbody>
          {arbre.transitions.map((t, i) => (
            <tr key={i}>
              <td><SelecteurNoeud arbre={arbre} valeur={t.from} surChange={v => modifier(a => { a.transitions[i].from = v })} /></td>
              <td><SelecteurNoeud arbre={arbre} valeur={t.to} surChange={v => modifier(a => { a.transitions[i].to = v })} /></td>
              <td><input value={t.label || ''} onChange={e => modifier(a => { a.transitions[i].label = e.target.value })} /></td>
              <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!t.sombre}
                onChange={e => modifier(a => { a.transitions[i].sombre = e.target.checked })} /></td>
              <td><button className="btn clair" onClick={() => modifier(a => { a.transitions.splice(i, 1) })}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn clair" onClick={() => modifier(a => {
        const n0 = arbre.noeuds[0]?.id
        a.transitions.push({ from: n0, to: n0, label: '', sombre: false })
      })}>+ transition</button>

      <h3>Aperçu</h3>
      <div className="apercu-arbre"><ApercuArbre arbre={arbre} /></div>
      <p className="aide">L'aperçu suit la même disposition que l'outil de session (colonnes par phase). L'export Obsidian inclut l'arbre en tableau.</p>
      <button className="btn danger" style={{ marginTop: 10 }} onClick={supprimerArbre}>Supprimer l'arbre</button>
    </div>
  )
}

const SelecteurNoeud = ({ arbre, valeur, surChange }) => (
  <select value={valeur} onChange={e => surChange(e.target.value)}>
    {arbre.noeuds.map(n => <option key={n.id} value={n.id}>{n.titre}</option>)}
  </select>
)

const COULEURS = { etat: '#1c2b45', decision: '#6b4a7e', evenement: '#3f7d5c', final: '#131e31', 'final positif': '#131e31' }

function ApercuArbre({ arbre }) {
  const W = 180, H = 52, GX = 70, GY = 20, PAD = 28
  const phases = {}
  arbre.noeuds.forEach(n => { (phases[n.phase] ||= []).push(n) })
  const cles = Object.keys(phases).map(Number).sort((a, b) => a - b)
  if (!cles.length) return null
  const maxLignes = Math.max(...Object.values(phases).map(a => a.length))
  const largeur = PAD * 2 + cles.length * W + (cles.length - 1) * GX
  const hauteur = PAD * 2 + maxLignes * H + (maxLignes - 1) * GY
  const pos = {}
  cles.forEach((ph, ci) => {
    const decalage = (maxLignes - phases[ph].length) * (H + GY) / 2
    phases[ph].forEach((n, ri) => { pos[n.id] = { x: PAD + ci * (W + GX), y: PAD + decalage + ri * (H + GY) } })
  })
  return (
    <svg width={largeur} height={hauteur}>
      {arbre.transitions.map((t, i) => {
        const a = pos[t.from], b = pos[t.to]
        if (!a || !b) return null
        const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, mx = (x1 + x2) / 2
        return <g key={i}>
          <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none"
            stroke={t.sombre ? '#9c3a2e' : '#7a6a3f'} strokeWidth="1.4"
            strokeDasharray={t.sombre ? '5 4' : ''} />
          {t.label && <text x={mx} y={(y1 + y2) / 2 - 4} textAnchor="middle"
            style={{ font: '9px monospace', fill: '#5c5232' }}>{t.label}</text>}
        </g>
      })}
      {arbre.noeuds.map(n => {
        const p = pos[n.id]
        const finalPositif = n.type === 'final positif'
        return <g key={n.id}>
          <rect x={p.x} y={p.y} width={W} height={H} rx="5" fill={COULEURS[n.type] || '#1c2b45'}
            stroke={n.type.startsWith('final') ? (finalPositif ? '#3f7d5c' : '#9c3a2e') : '#c9a227'} strokeWidth="1.5" />
          <text x={p.x + 10} y={p.y + 19} style={{ font: '8px monospace', fill: '#e6c96a', letterSpacing: '.1em' }}>
            {n.type.toUpperCase()}</text>
          <text x={p.x + 10} y={p.y + 36} style={{ font: '600 11px Palatino, serif', fill: '#f2ead6' }}>
            {n.titre.length > 26 ? n.titre.slice(0, 25) + '…' : n.titre}</text>
        </g>
      })}
    </svg>
  )
}
