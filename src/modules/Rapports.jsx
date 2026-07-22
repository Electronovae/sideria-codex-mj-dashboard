import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche, DateSiderienne, Texte } from './communs.jsx'
import { nouveauRapport, TYPES_RAPPORT } from '../lib/modele.js'
import { fmtDate } from '../lib/calendrier.js'

// Les documents en jeu : rapports officiels, unes de journaux, lettres, décrets.
// Le contenu supporte les [[wikilinks]] et peut être marqué visible pour les joueurs.
export default function Rapports() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(univers.rapports[0]?.id ?? null)
  const r = univers.rapports.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouveauRapport()
    maj(u => u.rapports.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.rapports.find(x => x.id === selId)) })
  const supprimer = () => {
    if (!confirm(`Supprimer "${r.titre}" ?`)) return
    maj(u => { u.rapports = u.rapports.filter(x => x.id !== selId) })
    setSelId(null)
  }

  return (
    <ListeFiche
      items={univers.rapports} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouveau rapport"
      tris={{
        date: x => x.date ?? 999999,
        titre: x => x.titre,
        type: x => x.type + '·' + x.titre,
        auteur: x => univers.pnjs.find(p => p.id === x.auteurId)?.nom || 'zzz',
      }}
      rendu={x => {
        const f = univers.factions.find(ff => ff.id === x.factionId)
        return (<><span className="rond" style={{ background: f?.couleur || '#8a8272' }} />
          <span>{x.titre}<div className="sous">{x.type}{x.date != null ? ' · ' + fmtDate(x.date) : ''}{x.visibleJoueurs ? ' · 👁 joueurs' : ''}</div></span></>)
      }}
      enfants={r && (
        <div key={r.id}>
          <h2>{r.titre}</h2>
          <div className="rangee">
            <Champ label="Titre" value={r.titre} onChange={e => modifier(x => { x.titre = e.target.value })} />
            <span className="etroit"><label>Type</label>
              <select value={r.type} onChange={e => modifier(x => { x.type = e.target.value })}>
                {TYPES_RAPPORT.map(t => <option key={t}>{t}</option>)}
              </select></span>
          </div>
          <div className="rangee">
            <span><label>Auteur (PNJ)</label>
              <select value={r.auteurId || ''} onChange={e => modifier(x => { x.auteurId = e.target.value || null })}>
                <option value="">—</option>
                {univers.pnjs.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select></span>
            <span><label>Faction</label>
              <SelecteurFaction valeur={r.factionId} surChange={v => modifier(x => { x.factionId = v })} /></span>
            <DateSiderienne label="Date en jeu" optionnel valeur={r.date}
              surChange={v => modifier(x => { x.date = v })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none', letterSpacing: 0, fontSize: '.85rem' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={!!r.visibleJoueurs}
              onChange={e => modifier(x => { x.visibleJoueurs = e.target.checked })} />
            visible pour les joueurs (le distinguer à l'export ou dans la future vue joueurs)
          </label>
          <Champ label="Contenu (les [[Nom]] deviennent des liens)" zone value={r.contenu}
            style={{ minHeight: 220 }}
            onChange={e => modifier(x => { x.contenu = e.target.value })} />
          {r.contenu && <>
            <h3>Aperçu</h3>
            <div className="carte" style={{ whiteSpace: 'pre-wrap' }}><Texte>{r.contenu}</Texte></div>
          </>}
          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce rapport</button>
          </div>
        </div>
      )}
    />
  )
}
