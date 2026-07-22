import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche } from './communs.jsx'
import { nouveauLieu, TYPES_LIEU } from '../lib/modele.js'

export default function Lieux() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(univers.lieux[0]?.id ?? null)
  const l = univers.lieux.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouveauLieu()
    maj(u => u.lieux.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.lieux.find(x => x.id === selId)) })
  const supprimer = () => {
    if (!confirm(`Supprimer ${l.nom} ?`)) return
    maj(u => {
      u.lieux = u.lieux.filter(x => x.id !== selId)
      u.lieux.forEach(x => { if (x.parentId === selId) x.parentId = null })
      u.joueurs.forEach(j => j.historique.forEach(h => { if (h.lieuId === selId) h.lieuId = null }))
    })
    setSelId(null)
  }
  const enfants = l ? univers.lieux.filter(x => x.parentId === l.id) : []
  const passages = l ? univers.joueurs.flatMap(j =>
    j.historique.filter(h => h.lieuId === l.id).map(h => ({ ...h, j }))) : []

  return (
    <ListeFiche
      items={univers.lieux} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouveau lieu"
      tris={{
        nom: x => x.nom,
        type: x => x.type + '·' + x.nom,
        faction: x => univers.factions.find(f => f.id === x.factionId)?.nom || 'zzz',
      }}
      rendu={x => {
        const f = univers.factions.find(ff => ff.id === x.factionId)
        return (<><span className="rond" style={{ background: f?.couleur || '#8a8272' }} />
          <span>{x.nom}<div className="sous">{x.type}{x.parentId ? ' · ' + (univers.lieux.find(p => p.id === x.parentId)?.nom || '') : ''}</div></span></>)
      }}
      enfants={l && (
        <div key={l.id}>
          <h2>{l.nom}</h2>
          <div className="rangee">
            <Champ label="Nom" value={l.nom} onChange={e => modifier(x => { x.nom = e.target.value })} />
            <span className="etroit"><label>Type</label>
              <select value={l.type} onChange={e => modifier(x => { x.type = e.target.value })}>
                {TYPES_LIEU.map(t => <option key={t}>{t}</option>)}
              </select></span>
          </div>
          <div className="rangee">
            <span><label>Rattaché à</label>
              <select value={l.parentId || ''} onChange={e => modifier(x => { x.parentId = e.target.value || null })}>
                <option value="">— aucun —</option>
                {univers.lieux.filter(x => x.id !== l.id).map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
              </select></span>
            <span><label>Contrôlé par</label>
              <SelecteurFaction valeur={l.factionId} surChange={v => modifier(x => { x.factionId = v })} /></span>
          </div>
          <Champ label="Description" zone value={l.description}
            onChange={e => modifier(x => { x.description = e.target.value })} />
          <Champ label="Secrets Maître" zone value={l.secrets}
            onChange={e => modifier(x => { x.secrets = e.target.value })} />
          {enfants.length > 0 && <>
            <h3>Contient</h3>
            <ul style={{ marginLeft: 18 }}>{enfants.map(e => <li key={e.id}>{e.nom} ({e.type})</li>)}</ul>
          </>}
          {passages.length > 0 && <>
            <h3>Passages de personnages</h3>
            <ul style={{ marginLeft: 18 }}>{passages.map((p, i) =>
              <li key={i}>{p.j.personnage} : {p.resume || p.type}</li>)}</ul>
          </>}
          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce lieu</button>
          </div>
        </div>
      )}
    />
  )
}
