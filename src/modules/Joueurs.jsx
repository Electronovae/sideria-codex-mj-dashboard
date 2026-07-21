import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche, DateSiderienne } from './communs.jsx'
import { nouveauJoueur, uid } from '../lib/modele.js'
import { fmtDate } from '../lib/calendrier.js'

export default function Joueurs() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(univers.joueurs[0]?.id ?? null)
  const j = univers.joueurs.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouveauJoueur()
    maj(u => u.joueurs.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.joueurs.find(x => x.id === selId)) })
  const supprimer = () => {
    if (!confirm(`Supprimer ${j.personnage} ?`)) return
    maj(u => { u.joueurs = u.joueurs.filter(x => x.id !== selId) })
    setSelId(null)
  }

  return (
    <ListeFiche
      items={univers.joueurs} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouveau personnage joueur"
      tris={{
        personnage: j => j.personnage,
        joueur: j => j.joueur,
        faction: j => univers.factions.find(f => f.id === j.faction)?.nom || 'zzz',
      }}
      rendu={p => {
        const f = univers.factions.find(x => x.id === p.faction)
        return (<><span className="rond" style={{ background: f?.couleur || '#888' }} />
          <span>{p.personnage}<div className="sous">{p.joueur} · niv. {p.niveau}</div></span></>)
      }}
      enfants={j && (
        <div key={j.id}>
          <h2>{j.personnage}</h2>
          <div className="rangee">
            <Champ label="Personnage" value={j.personnage} onChange={e => modifier(x => { x.personnage = e.target.value })} />
            <Champ label="Joueur / Joueuse" value={j.joueur} onChange={e => modifier(x => { x.joueur = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Classe" value={j.classe} onChange={e => modifier(x => { x.classe = e.target.value })} />
            <Champ label="Niveau" type="number" min="1" max="40" value={j.niveau}
              onChange={e => modifier(x => { x.niveau = +e.target.value })} />
            <span><label>Faction actuelle</label>
              <SelecteurFaction valeur={j.faction} surChange={v => modifier(x => { x.faction = v })} /></span>
          </div>
          <Champ label="Notes MJ (fils personnels, secrets, dettes)" zone value={j.notes}
            onChange={e => modifier(x => { x.notes = e.target.value })} />

          <h3>Réputations par faction (−4 à +4)</h3>
          {univers.factions.filter(f => f.id !== 'monde').map(f => (
            <div className="jauge-rep" key={f.id}>
              <span className="nom"><span className="rond" style={{ background: f.couleur, display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 6 }} />{f.nom}</span>
              <input type="range" min="-4" max="4" step="1" value={j.reputations[f.id] ?? 0}
                onChange={e => modifier(x => { x.reputations[f.id] = +e.target.value })} />
              <span className="val">{(j.reputations[f.id] ?? 0) > 0 ? '+' : ''}{j.reputations[f.id] ?? 0}</span>
            </div>
          ))}

          <h3>Interactions avec les PNJ</h3>
          <p className="aide">Le journal de qui a parlé à qui, quand, et ce que ça a changé. C'est lui qui nourrit les compteurs des arbres et les réputations.</p>
          {j.interactions.map((it, i) => {
            const p = univers.pnjs.find(x => x.id === it.pnjId)
            return (
              <div className="carte" key={it.id}>
                <div className="rangee">
                  <span><label>PNJ</label>
                    <select value={it.pnjId || ''} onChange={e => modifier(x => { x.interactions[i].pnjId = e.target.value })}>
                      <option value="">—</option>
                      {univers.pnjs.map(pp => <option key={pp.id} value={pp.id}>{pp.nom}</option>)}
                    </select></span>
                  <DateSiderienne label="Date" optionnel valeur={it.date}
                    surChange={v => modifier(x => { x.interactions[i].date = v })} />
                </div>
                <Champ label="Ce qui s'est passé" zone value={it.resume}
                  onChange={e => modifier(x => { x.interactions[i].resume = e.target.value })} />
                <Champ label="Effet (compteur, réputation, promesse...)" value={it.effet}
                  onChange={e => modifier(x => { x.interactions[i].effet = e.target.value })} />
                <div className="aide">{p ? `${p.nom} · ` : ''}{it.date != null ? fmtDate(it.date) : 'sans date'}</div>
                <button className="btn clair" style={{ marginTop: 6 }}
                  onClick={() => modifier(x => { x.interactions.splice(i, 1) })}>retirer</button>
              </div>
            )
          })}
          <button className="btn clair" onClick={() => modifier(x => {
            x.interactions.push({ id: uid('int'), date: null, pnjId: univers.pnjs[0]?.id || '', resume: '', effet: '' })
          })}>+ interaction</button>

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce personnage</button>
          </div>
        </div>
      )}
    />
  )
}
