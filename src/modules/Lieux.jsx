import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche, Texte, trouverBacklinks } from './communs.jsx'
import { MiniGraphe } from './Graphe.jsx'
import { nouveauLieu, TYPES_LIEU } from '../lib/modele.js'
import { fmtDate } from '../lib/calendrier.js'

export default function Lieux() {
  const { univers, maj, setOnglet, setCodexCible } = useStudio()
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
  const ouvrir = (type, id) => { setCodexCible({ type, id }); setOnglet('codex') }

  const enfants = l ? univers.lieux.filter(x => x.parentId === l.id) : []
  const parent = l?.parentId ? univers.lieux.find(x => x.id === l.parentId) : null
  const faction = l ? univers.factions.find(f => f.id === l.factionId) : null
  const passages = l ? univers.joueurs.flatMap(j =>
    j.historique.filter(h => h.lieuId === l.id).map(h => ({ ...h, j }))) : []
  // Voisins directs pour le mini-graphe : hiérarchie de lieux, faction, liens retour (backlinks).
  const voisins = l ? (() => {
    const vus = new Set()
    const liste = []
    const ajouterVoisin = (type, id, nom, couleur) => {
      const cle = type + ':' + id
      if (vus.has(cle)) return
      vus.add(cle); liste.push({ type, id, nom, couleur })
    }
    if (parent) ajouterVoisin('lieu', parent.id, parent.nom, '#8d6e63')
    enfants.forEach(e => ajouterVoisin('lieu', e.id, e.nom, '#8d6e63'))
    if (faction) ajouterVoisin('faction', faction.id, faction.nom, faction.couleur)
    trouverBacklinks(univers, { type: 'lieu', id: l.id }).forEach(b => ajouterVoisin(b.type, b.id, b.nom, '#a3512e'))
    return liste
  })() : []

  return (
    <ListeFiche
      items={univers.lieux} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouveau lieu"
      tris={{
        type: x => x.type + '·' + x.nom,
        nom: x => x.nom,
        faction: x => univers.factions.find(f => f.id === x.factionId)?.nom || 'zzz',
      }}
      groupe={x => x.type}
      rendu={x => {
        const f = univers.factions.find(ff => ff.id === x.factionId)
        return (<><span className="rond" style={{ background: f?.couleur || '#8a8272' }} />
          <span>{x.nom}<div className="sous">{x.type}{x.parentId ? ' · ' + (univers.lieux.find(p => p.id === x.parentId)?.nom || '') : ''}</div></span></>)
      }}
      enfants={l && (
        <div key={l.id}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ flex: 1 }}>{l.nom}</h2>
            {faction && <span className="puce" style={{ borderColor: faction.couleur, cursor: 'pointer' }}
              onClick={() => ouvrir('faction', faction.id)}>
              <span className="rond" style={{ background: faction.couleur }} />{faction.nom}</span>}
          </div>
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
          {l.description && <div style={{ fontSize: '.86rem' }}><Texte>{l.description}</Texte></div>}
          <p className="aide">Utilise des [[wikilinks]] vers d'autres PNJ, factions, lieux... : ils apparaissent ci-dessous dans "Liens" et dans le mini-graphe.</p>

          <Champ label="Secrets Maître" zone value={l.secrets}
            onChange={e => modifier(x => { x.secrets = e.target.value })} />

          <h3>Hiérarchie</h3>
          <div className="rangee" style={{ flexWrap: 'wrap' }}>
            {parent
              ? <span className="puce" style={{ cursor: 'pointer' }} onClick={() => ouvrir('lieu', parent.id)}>↑ {parent.nom}</span>
              : <span className="aide">Aucun lieu parent.</span>}
          </div>
          {enfants.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <label>Contient ({enfants.length})</label>
              <div className="rangee" style={{ flexWrap: 'wrap' }}>
                {enfants.map(e => <span key={e.id} className="puce" style={{ cursor: 'pointer' }}
                  onClick={() => ouvrir('lieu', e.id)}>{e.nom} ({e.type})</span>)}
              </div>
            </div>
          )}

          <h3>Liens ({voisins.length})</h3>
          <p className="aide">Rattachements directs (hiérarchie, faction) et liens retour : toute entité qui référence ce lieu via un [[wikilink]] dans un de ses champs texte.</p>
          {voisins.length
            ? <div className="rangee" style={{ flexWrap: 'wrap' }}>
                {voisins.map(v => (
                  <span key={v.type + v.id} className="puce" style={{ borderColor: v.couleur, cursor: 'pointer' }}
                    onClick={() => ouvrir(v.type, v.id)}>
                    <span className="rond" style={{ background: v.couleur }} />{v.nom}</span>
                ))}
              </div>
            : <p className="aide">Aucun lien pour l'instant.</p>}

          <h3>Graphe local</h3>
          <MiniGraphe centre={{ nom: l.nom }} voisins={voisins} />

          {passages.length > 0 && <>
            <h3>Passages de personnages ({passages.length})</h3>
            <ul style={{ marginLeft: 18 }}>{passages.map((p, i) =>
              <li key={i}>{p.j.personnage} : {p.resume || p.type}{p.date != null ? ` · ${fmtDate(p.date)}` : ''}</li>)}</ul>
          </>}

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce lieu</button>
          </div>
        </div>
      )}
    />
  )
}
