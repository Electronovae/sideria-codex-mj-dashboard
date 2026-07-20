import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche, PucesPnjs, DateSiderienne } from './communs.jsx'
import { nouvelEvenement } from '../lib/modele.js'
import { fmtDate } from '../lib/calendrier.js'

export default function Evenements() {
  const { univers, maj } = useStudio()
  const tries = [...univers.evenements].sort((a, b) => a.debut - b.debut)
  const [selId, setSelId] = useState(tries[0]?.id ?? null)
  const e = univers.evenements.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouvelEvenement()
    maj(u => u.evenements.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.evenements.find(x => x.id === selId)) })
  const supprimer = () => {
    if (!confirm(`Supprimer "${e.titre}" ?`)) return
    maj(u => { u.evenements = u.evenements.filter(x => x.id !== selId) })
    setSelId(null)
  }

  return (
    <ListeFiche
      items={tries} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouvel événement"
      rendu={x => {
        const f = univers.factions.find(ff => ff.id === x.factionId)
        return (<><span className="rond" style={{ background: f?.couleur || '#888' }} />
          <span>{x.titre}<div className="sous">{fmtDate(x.debut)}</div></span></>)
      }}
      enfants={e && (
        <div key={e.id}>
          <h2>{e.titre}</h2>
          <Champ label="Titre" value={e.titre} onChange={ev => modifier(x => { x.titre = ev.target.value })} />
          <Champ label="Description" zone value={e.desc} onChange={ev => modifier(x => { x.desc = ev.target.value })} />
          <div className="rangee">
            <DateSiderienne label="Début" valeur={e.debut} surChange={v => modifier(x => { x.debut = v ?? x.debut })} />
            <DateSiderienne label="Fin" optionnel valeur={e.fin} surChange={v => modifier(x => { x.fin = v })} />
          </div>
          <div className="rangee">
            <span><label>Faction (couleur sur les frises)</label>
              <SelecteurFaction valeur={e.factionId} surChange={v => modifier(x => { x.factionId = v })} /></span>
            <span><label>Importance</label>
              <select value={e.importance} onChange={ev => modifier(x => { x.importance = +ev.target.value })}>
                <option value="1">★</option><option value="2">★★</option><option value="3">★★★</option>
              </select></span>
            <span><label>Campagne liée</label>
              <select value={e.campagneId || ''} onChange={ev => modifier(x => { x.campagneId = ev.target.value || null })}>
                <option value="">—</option>
                {univers.campagnes.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
              </select></span>
          </div>
          <h3>Participants (PNJ)</h3>
          <PucesPnjs ids={e.participants} surChange={v => modifier(x => { x.participants = v })} />
          <p className="aide">Ce fichier JSON est directement importable dans l'outil de frises (chroniques_sideria.html) : même schéma de dates.</p>
          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer cet événement</button>
          </div>
        </div>
      )}
    />
  )
}
