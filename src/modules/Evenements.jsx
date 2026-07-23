import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche, PucesPnjs, PucesJoueurs, DateSiderienne } from './communs.jsx'
import { nouvelEvenement, SYMBOLES } from '../lib/modele.js'
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
      tris={{
        date: x => x.debut,
        titre: x => x.titre,
        faction: x => univers.factions.find(f => f.id === x.factionId)?.nom || 'zzz',
        arc: x => univers.arcs.find(a => a.id === x.arcId)?.nom || 'zzz',
      }}
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
              <select value={e.campagneId || ''} onChange={ev => modifier(x => {
                x.campagneId = ev.target.value || null; x.sessionId = null
              })}>
                <option value="">—</option>
                {univers.campagnes.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
              </select></span>
            {e.campagneId && <span><label>Session liée</label>
              <select value={e.sessionId || ''} onChange={ev => modifier(x => { x.sessionId = ev.target.value || null })}>
                <option value="">—</option>
                {univers.campagnes.find(c => c.id === e.campagneId)?.sessions.map(s =>
                  <option key={s.id} value={s.id}>{(s.code ? s.code + ' ' : '') + s.titre}</option>)}
              </select></span>}
          </div>
          <div className="rangee">
            <span><label>Arc</label>
              <select value={e.arcId || ''} onChange={ev => modifier(x => { x.arcId = ev.target.value || null })}>
                <option value="">—</option>
                {univers.arcs.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select></span>
            {e.fin == null && <span><label>Symbole (événement ponctuel)</label>
              <select value={e.symbole} onChange={ev => modifier(x => { x.symbole = ev.target.value })}>
                {SYMBOLES.map(s => <option key={s}>{s}</option>)}
              </select></span>}
            <span><label>Couleur</label>
              <p className="aide" style={{ marginTop: 8 }}>automatique : celle de la faction (sinon de l'arc)</p></span>
          </div>
          <h3>Participants (PNJ)</h3>
          <PucesPnjs ids={e.participants} surChange={v => modifier(x => { x.participants = v })} />
          <h3>Participants (PJ)</h3>
          <PucesJoueurs ids={e.joueurIds} surChange={v => modifier(x => { x.joueurIds = v })} />
          <p className="aide">Ce fichier JSON est directement importable dans l'outil de frises (chroniques_sideria.html) : même schéma de dates.</p>
          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer cet événement</button>
          </div>
        </div>
      )}
    />
  )
}
