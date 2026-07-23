import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche, DateSiderienne } from './communs.jsx'
import { nouveauJoueur, nouvelleEntreeHistorique, TYPES_HISTORIQUE } from '../lib/modele.js'
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
        personnage: x => x.personnage,
        joueur: x => x.joueur,
        niveau: x => -x.niveau,
        faction: x => univers.factions.find(f => f.id === x.faction)?.nom || 'zzz',
      }}
      rendu={p => {
        const f = univers.factions.find(x => x.id === p.faction)
        return (<><span className="rond" style={{ background: f?.couleur || '#888' }} />
          <span>{p.personnage}<div className="sous">{p.joueur} · niv. {p.niveau}</div></span></>)
      }}
      enfants={j && (
        <div key={j.id}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ flex: 1 }}>{j.personnage}</h2>
            <a className="btn clair" href="fiches.html" target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none' }}>Fiches personnages ↗</a>
          </div>
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

          <h3>Citations</h3>
          <p className="aide">Les phrases mémorables prononcées à la table.</p>
          {j.citations.map((c, i) => (
            <div className="rangee" key={i}>
              <input value={c} placeholder="« ... »"
                onChange={e => modifier(x => { x.citations[i] = e.target.value })} />
              <button className="btn clair etroit" onClick={() => modifier(x => { x.citations.splice(i, 1) })}>retirer</button>
            </div>
          ))}
          <button className="btn clair" onClick={() => modifier(x => { x.citations.push('') })}>+ citation</button>

          <h3>Réputations par faction (−4 à +4)</h3>
          {univers.factions.filter(f => f.id !== 'monde').map(f => (
            <div className="jauge-rep" key={f.id}>
              <span className="nom"><span style={{ background: f.couleur, display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 6 }} />{f.nom}</span>
              <input type="range" min="-4" max="4" step="1" value={j.reputations[f.id] ?? 0}
                onChange={e => modifier(x => { x.reputations[f.id] = +e.target.value })} />
              <span className="val">{(j.reputations[f.id] ?? 0) > 0 ? '+' : ''}{j.reputations[f.id] ?? 0}</span>
            </div>
          ))}

          <h3>Historique</h3>
          <p className="aide">Tout ce que le personnage a vécu : rencontres, combats, lieux traversés, révélations. Les entrées datées apparaissent sur sa ligne de la frise.</p>
          {j.historique.map((it, i) => {
            const p = univers.pnjs.find(x => x.id === it.pnjId)
            const l = univers.lieux.find(x => x.id === it.lieuId)
            return (
              <div className="carte" key={it.id}>
                <div className="rangee">
                  <span className="etroit"><label>Type</label>
                    <select value={it.type} onChange={e => modifier(x => { x.historique[i].type = e.target.value })}>
                      {TYPES_HISTORIQUE.map(t => <option key={t}>{t}</option>)}
                    </select></span>
                  <DateSiderienne label="Date" optionnel valeur={it.date}
                    surChange={v => modifier(x => { x.historique[i].date = v })} />
                </div>
                <div className="rangee">
                  <span><label>PNJ concerné</label>
                    <select value={it.pnjId || ''} onChange={e => modifier(x => { x.historique[i].pnjId = e.target.value || null })}>
                      <option value="">—</option>
                      {univers.pnjs.map(pp => <option key={pp.id} value={pp.id}>{pp.nom}</option>)}
                    </select></span>
                  <span><label>Lieu</label>
                    <select value={it.lieuId || ''} onChange={e => modifier(x => { x.historique[i].lieuId = e.target.value || null })}>
                      <option value="">—</option>
                      {univers.lieux.map(ll => <option key={ll.id} value={ll.id}>{ll.nom}</option>)}
                    </select></span>
                </div>
                <div className="rangee">
                  <span><label>Campagne</label>
                    <select value={it.campagneId || ''} onChange={e => modifier(x => {
                      x.historique[i].campagneId = e.target.value || null; x.historique[i].sessionId = null
                    })}>
                      <option value="">—</option>
                      {univers.campagnes.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                    </select></span>
                  {it.campagneId && <span><label>Session</label>
                    <select value={it.sessionId || ''} onChange={e => modifier(x => { x.historique[i].sessionId = e.target.value || null })}>
                      <option value="">—</option>
                      {univers.campagnes.find(c => c.id === it.campagneId)?.sessions.map(s =>
                        <option key={s.id} value={s.id}>{(s.code ? s.code + ' ' : '') + s.titre}</option>)}
                    </select></span>}
                </div>
                <Champ label="Ce qui s'est passé" zone value={it.resume}
                  onChange={e => modifier(x => { x.historique[i].resume = e.target.value })} />
                <Champ label="Effet (compteur, réputation, promesse...)" value={it.effet}
                  onChange={e => modifier(x => { x.historique[i].effet = e.target.value })} />
                <div className="aide">{it.type}{p ? ` · ${p.nom}` : ''}{l ? ` · ${l.nom}` : ''} · {it.date != null ? fmtDate(it.date) : 'sans date'}</div>
                <button className="btn clair" style={{ marginTop: 6 }}
                  onClick={() => modifier(x => { x.historique.splice(i, 1) })}>retirer</button>
              </div>
            )
          })}
          <button className="btn clair" onClick={() => modifier(x => {
            x.historique.push(nouvelleEntreeHistorique())
          })}>+ entrée d'historique</button>

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce personnage</button>
          </div>
        </div>
      )}
    />
  )
}
