import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, PucesPnjs } from './communs.jsx'
import { nouvelleCampagne, uid } from '../lib/modele.js'

export default function Campagnes() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(null) // null = méta-campagne
  const c = univers.campagnes.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouvelleCampagne()
    maj(u => u.campagnes.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.campagnes.find(x => x.id === selId)) })
  const modifierMeta = (fn) => maj(u => { fn(u.meta) })
  const supprimer = () => {
    if (!confirm(`Supprimer la campagne "${c.titre}" ?`)) return
    maj(u => {
      u.campagnes = u.campagnes.filter(x => x.id !== selId)
      u.evenements.forEach(e => { if (e.campagneId === selId) e.campagneId = null })
    })
    setSelId(null)
  }

  return (
    <>
      <div className="liste">
        <div className={'item' + (selId === null ? ' sel' : '')} onClick={() => setSelId(null)}>
          <span className="rond" style={{ background: 'var(--or)' }} />
          <span>Méta-campagne<div className="sous">thèse et saisons</div></span>
        </div>
        <button className="btn clair ajout" onClick={ajouter}>+ Nouvelle campagne</button>
        {[...univers.campagnes].sort((a, b) => (a.saison - b.saison) || a.titre.localeCompare(b.titre)).map(x => {
          const f = univers.factions.find(ff => ff.id === x.factionId)
          return (
            <div key={x.id} className={'item' + (x.id === selId ? ' sel' : '')} onClick={() => setSelId(x.id)}>
              <span className="rond" style={{ background: f?.couleur || '#888' }} />
              <span>{x.code ? x.code + ' · ' : ''}{x.titre}<div className="sous">Saison {x.saison} · {f?.nom || 'faction ?'}</div></span>
            </div>
          )
        })}
      </div>
      <div className="fiche">
        {selId === null ? <Meta meta={univers.meta} modifier={modifierMeta} /> : c && (
          <div key={c.id}>
            <h2>{c.titre}</h2>
            <div className="rangee">
              <Champ className="etroit" label="Code" placeholder="C01" value={c.code}
                onChange={e => modifier(x => { x.code = e.target.value })} />
              <Champ label="Titre" value={c.titre} onChange={e => modifier(x => { x.titre = e.target.value })} />
              <span><label>Faction</label>
                <SelecteurFaction valeur={c.factionId} surChange={v => modifier(x => { x.factionId = v })} /></span>
              <span className="etroit"><label>Saison</label>
                <select value={c.saison} onChange={e => modifier(x => { x.saison = +e.target.value })}>
                  {univers.meta.saisons.map(s => <option key={s.num} value={s.num}>Saison {s.num}</option>)}
                </select></span>
            </div>
            <div className="rangee">
              <Champ label="Départ (Horloge)" placeholder="M0" value={c.depart} onChange={e => modifier(x => { x.depart = e.target.value })} />
              <Champ label="Durée (sessions)" placeholder="10-12" value={c.duree} onChange={e => modifier(x => { x.duree = e.target.value })} />
              <Champ label="Niveaux" placeholder="8-22" value={c.niveaux} onChange={e => modifier(x => { x.niveaux = e.target.value })} />
            </div>
            <Champ label="Ton" value={c.ton} onChange={e => modifier(x => { x.ton = e.target.value })} />
            <Champ label="Pitch" zone value={c.pitch} onChange={e => modifier(x => { x.pitch = e.target.value })} />

            <h3>Actes et points pivots</h3>
            {c.actes.map((a, i) => (
              <div className="carte" key={a.id}>
                <Champ label={`Acte ${i + 1} : titre`} value={a.titre}
                  onChange={e => modifier(x => { x.actes[i].titre = e.target.value })} />
                <Champ label="Résumé" zone value={a.resume}
                  onChange={e => modifier(x => { x.actes[i].resume = e.target.value })} />
                <Champ label="Point pivot (la décision des joueurs qui change tout)" value={a.pivot}
                  onChange={e => modifier(x => { x.actes[i].pivot = e.target.value })} />
                <button className="btn clair" style={{ marginTop: 6 }}
                  onClick={() => modifier(x => { x.actes.splice(i, 1) })}>retirer l'acte</button>
              </div>
            ))}
            <button className="btn clair" onClick={() => modifier(x => {
              x.actes.push({ id: uid('acte'), titre: '', resume: '', pivot: '' })
            })}>+ acte</button>

            <h3>PNJ clés</h3>
            <PucesPnjs ids={c.pnjIds} surChange={v => modifier(x => { x.pnjIds = v })} />

            <Champ label="Issues possibles" zone value={c.issues}
              onChange={e => modifier(x => { x.issues = e.target.value })} />

            <div style={{ marginTop: 24 }}>
              <button className="btn danger" onClick={supprimer}>Supprimer cette campagne</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Meta({ meta, modifier }) {
  return (
    <div>
      <h2>Méta-campagne</h2>
      <Champ label="Nom de l'univers" value={meta.nom} onChange={e => modifier(m => { m.nom = e.target.value })} />
      <Champ label="Thèse (ce que l'histoire globale raconte)" zone value={meta.these}
        onChange={e => modifier(m => { m.these = e.target.value })} />
      <h3>Saisons</h3>
      {meta.saisons.map((s, i) => (
        <div className="carte" key={s.num}>
          <div className="rangee">
            <Champ className="etroit" label="N°" type="number" value={s.num}
              onChange={e => modifier(m => { m.saisons[i].num = +e.target.value })} />
            <Champ label="Titre" value={s.titre} onChange={e => modifier(m => { m.saisons[i].titre = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Question dramatique" value={s.question}
              onChange={e => modifier(m => { m.saisons[i].question = e.target.value })} />
            <Champ className="etroit" label="Horloge" value={s.horloge}
              onChange={e => modifier(m => { m.saisons[i].horloge = e.target.value })} />
            <Champ className="etroit" label="Niveaux" value={s.niveaux}
              onChange={e => modifier(m => { m.saisons[i].niveaux = e.target.value })} />
          </div>
          <button className="btn clair" style={{ marginTop: 6 }}
            onClick={() => modifier(m => { m.saisons.splice(i, 1) })}>retirer la saison</button>
        </div>
      ))}
      <button className="btn clair" onClick={() => modifier(m => {
        m.saisons.push({ num: m.saisons.length + 1, titre: '', question: '', horloge: '', niveaux: '' })
      })}>+ saison</button>
      <p className="aide">Les campagnes se rattachent aux saisons définies ici. La thèse est la boussole : tout arc qui la contredit mérite discussion.</p>
    </div>
  )
}
