import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche } from './communs.jsx'
import { nouveauPnj, nouvelArbre, nouveauCompteur, uid } from '../lib/modele.js'
import ArbreEditeur, { Manometre } from './ArbreEditeur.jsx'


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
      tris={{
        faction: p => (univers.factions.find(f => f.id === p.faction)?.nom || 'zzz') + '·' + p.nom,
        nom: p => p.nom,
      }}
      groupe={p => univers.factions.find(f => f.id === p.faction)?.nom || 'Sans faction'}
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
          <div className="rangee">
            <Champ label="Poste (organigramme)" placeholder="Chef de l'Aile du Piston"
              value={pnj.poste} onChange={e => modifier(p => { p.poste = e.target.value })} />
            <span><label>Supérieur hiérarchique</label>
              <select value={pnj.superieurId || ''} onChange={e => modifier(p => { p.superieurId = e.target.value || null })}>
                <option value="">—</option>
                {univers.pnjs.filter(x => x.id !== pnj.id && x.faction === pnj.faction)
                  .map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
              </select></span>
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

          <h3>Compteurs personnalisés</h3>
          <p className="aide">Les jauges propres à ce PNJ (confiance, patience, corruption...), manipulables en mode session, indépendantes de l'arbre.</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {pnj.compteurs.map((c, i) => (
              <div className="carte" key={c.id} style={{ minWidth: 250 }}>
                <Manometre compteur={c} surDelta={(d) => modifier(p => {
                  const x = p.compteurs[i]
                  x.valeur = Math.min(x.max, Math.max(x.min, (x.valeur ?? x.min) + d))
                })} />
                <div className="rangee">
                  <span><label>Nom</label>
                    <input value={c.nom} onChange={e => modifier(p => { p.compteurs[i].nom = e.target.value })} /></span>
                  <span className="etroit"><label>Min</label>
                    <input type="number" value={c.min} onChange={e => modifier(p => { p.compteurs[i].min = +e.target.value })} /></span>
                  <span className="etroit"><label>Max</label>
                    <input type="number" value={c.max} onChange={e => modifier(p => { p.compteurs[i].max = +e.target.value })} /></span>
                </div>
                <span><label>Ce qu'il mesure</label>
                  <input value={c.description} onChange={e => modifier(p => { p.compteurs[i].description = e.target.value })} /></span>
                <button className="btn clair" style={{ marginTop: 6 }}
                  onClick={() => modifier(p => { p.compteurs.splice(i, 1) })}>retirer</button>
              </div>
            ))}
          </div>
          <button className="btn clair" onClick={() => modifier(p => { p.compteurs.push(nouveauCompteur()) })}>+ compteur</button>

          <h3>Arbre de décision</h3>
          {!pnj.arbre
            ? <button className="btn clair" onClick={() => modifier(p => { p.arbre = nouvelArbre() })}>Créer un arbre pour ce PNJ</button>
            : <ArbreEditeur arbre={pnj.arbre} modifier={fn => modifier(p => fn(p.arbre))}
                supprimerArbre={() => { if (confirm('Supprimer l\u2019arbre ?')) modifier(p => { p.arbre = null }) }} />}

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce PNJ</button>
          </div>
        </div>
      )}
    />
  )
}
