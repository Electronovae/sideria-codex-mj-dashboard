import React, { useState } from 'react'
import { useStudio, Champ, ListeFiche } from './communs.jsx'
import { nouvelleFaction } from '../lib/modele.js'
import { fmtDate } from '../lib/calendrier.js'

export default function Factions() {
  const { univers, maj, setOnglet } = useStudio()
  const [selId, setSelId] = useState(univers.factions[0]?.id ?? null)
  const f = univers.factions.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouvelleFaction()
    maj(u => u.factions.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.factions.find(x => x.id === selId)) })
  const supprimer = () => {
    if (!confirm(`Supprimer ${f.nom} ? Les PNJ et PJ rattachés deviennent sans faction.`)) return
    maj(u => {
      u.factions = u.factions.filter(x => x.id !== selId)
      u.pnjs.forEach(p => { if (p.faction === selId) p.faction = null })
      u.joueurs.forEach(j => { if (j.faction === selId) j.faction = null })
      u.evenements.forEach(e => { if (e.factionId === selId) e.factionId = null })
    })
    setSelId(null)
  }

  const membres = f ? univers.pnjs.filter(p => p.faction === f.id) : []
  const pjs = f ? univers.joueurs.filter(j => j.faction === f.id) : []
  const evts = f ? univers.evenements.filter(e => e.factionId === f.id).sort((a, b) => a.debut - b.debut) : []

  return (
    <ListeFiche
      items={univers.factions} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouvelle faction"
      tris={{
        nom: f => f.nom,
        'nb PNJ': f => -univers.pnjs.filter(p => p.faction === f.id).length,
      }}
      rendu={x => (<><span className="rond" style={{ background: x.couleur }} />
        <span>{x.nom}<div className="sous">{univers.pnjs.filter(p => p.faction === x.id).length} PNJ</div></span></>)}
      enfants={f && (
        <div key={f.id}>
          <h2>{f.nom}</h2>
          <div className="rangee">
            <Champ label="Nom" value={f.nom} onChange={e => modifier(x => { x.nom = e.target.value })} />
            <span className="etroit"><label>Couleur</label>
              <input type="color" value={f.couleur} style={{ height: 34, padding: 2 }}
                onChange={e => modifier(x => { x.couleur = e.target.value })} /></span>
          </div>
          <Champ label="Devise" value={f.devise} onChange={e => modifier(x => { x.devise = e.target.value })} />
          <Champ label="Description" zone value={f.description} onChange={e => modifier(x => { x.description = e.target.value })} />
          <Champ label="Objectifs" zone value={f.objectifs} onChange={e => modifier(x => { x.objectifs = e.target.value })} />
          <Champ label="Ressources et moyens" zone value={f.ressources} onChange={e => modifier(x => { x.ressources = e.target.value })} />

          <h3>Chef de la faction</h3>
          <select value={f.chefId || ''} onChange={e => modifier(x => { x.chefId = e.target.value || null })}>
            <option value="">— aucun —</option>
            {membres.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
          <p className="aide">Le chef se choisit parmi les membres (PNJ rattachés à cette faction).</p>

          <h3>Membres</h3>
          {membres.length
            ? <ul style={{ marginLeft: 18 }}>{membres.map(m => <li key={m.id}>{m.nom}{m.poste ? ` : ${m.poste}` : m.role ? ` : ${m.role}` : ''}</li>)}</ul>
            : <p className="aide">Aucun PNJ. Le rattachement se fait depuis la fiche du PNJ.</p>}

          <h3>Organigramme</h3>
          {membres.length
            ? <Organigramme faction={f} membres={membres} />
            : <p className="aide">L'organigramme se construit avec les champs "poste" et "supérieur" des fiches PNJ.</p>}
          {pjs.length > 0 && <>
            <h3>Personnages joueurs affiliés</h3>
            <ul style={{ marginLeft: 18 }}>{pjs.map(p => <li key={p.id}>{p.personnage} ({p.joueur})</li>)}</ul>
          </>}

          <h3>Événements liés</h3>
          {evts.length
            ? <ul style={{ marginLeft: 18 }}>{evts.map(e => <li key={e.id}><strong>{fmtDate(e.debut)}</strong> : {e.titre}</li>)}</ul>
            : <p className="aide">Aucun événement rattaché. Onglet Événements pour en créer.</p>}
          <button className="btn clair" onClick={() => setOnglet('evenements')}>Aller aux événements</button>

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer cette faction</button>
          </div>
        </div>
      )}
    />
  )
}


// Organigramme : arbre hiérarchique déduit des champs superieurId des PNJ.
function Organigramme({ faction, membres }) {
  const enfants = (id) => membres.filter(m => (m.superieurId || null) === id && m.id !== id)
  // racines : le chef, puis les membres sans supérieur (ou dont le supérieur est hors faction)
  const idsMembres = new Set(membres.map(m => m.id))
  const racines = membres.filter(m =>
    m.id === faction.chefId || !m.superieurId || !idsMembres.has(m.superieurId))
    .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
    .sort((a, b) => (a.id === faction.chefId ? -1 : b.id === faction.chefId ? 1 : 0))
  const Noeud = ({ m, prof, vus }) => {
    if (vus.has(m.id)) return null
    const suiv = new Set(vus); suiv.add(m.id)
    return (
      <div style={{ marginLeft: prof * 22 }}>
        <div className="carte" style={{ padding: '6px 12px', margin: '4px 0',
          borderLeftColor: m.id === faction.chefId ? 'var(--or)' : faction.couleur,
          display: 'inline-block', minWidth: 220 }}>
          <strong>{m.nom}</strong>{m.id === faction.chefId && ' ★'}
          <div className="aide" style={{ marginTop: 0 }}>{m.poste || m.role || 'poste à définir'}</div>
        </div>
        {enfants(m.id).map(e => <Noeud key={e.id} m={e} prof={prof + 1} vus={suiv} />)}
      </div>
    )
  }
  return <div>{racines.map(m => <Noeud key={m.id} m={m} prof={0} vus={new Set()} />)}</div>
}
