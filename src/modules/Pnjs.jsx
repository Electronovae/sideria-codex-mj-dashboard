import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFactions, PuceFaction, ChampEditable, ListeFiche } from './communs.jsx'
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
      u.pnjs.forEach(p => { if (p.superieurId === selId) p.superieurId = null })
      u.evenements.forEach(e => { e.participants = e.participants.filter(x => x !== selId) })
      u.campagnes.forEach(c => { c.pnjIds = c.pnjIds.filter(x => x !== selId) })
      u.factions.forEach(f => { if (f.chefId === selId) f.chefId = null })
    })
    setSelId(null)
  }

  return (
    <ListeFiche
      items={univers.pnjs} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouveau PNJ"
      tris={{
        faction: p => (univers.factions.find(f => f.id === p.factionIds?.[0])?.nom || 'zzz') + '·' + p.nom,
        nom: p => p.nom,
      }}
      groupe={p => p.factionIds?.length > 1 ? 'Multi-faction'
        : univers.factions.find(f => f.id === p.factionIds?.[0])?.nom || 'Sans faction'}
      rendu={p => {
        const fs = (p.factionIds || []).map(id => univers.factions.find(x => x.id === id)).filter(Boolean)
        return (<><span className="rond" style={{ background: fs[0]?.couleur || '#888' }} />
          <span>{p.nom}<div className="sous">{p.role}{p.arbre ? ' · arbre ✓' : ''}{fs.length > 1 ? ` · ${fs.length} factions` : ''}</div></span></>)
      }}
      enfants={pnj && (
        <div key={pnj.id}>
          <h2>{pnj.nom}</h2>
          <div className="rangee">
            <Champ label="Nom" value={pnj.nom} onChange={e => modifier(p => { p.nom = e.target.value })} />
            <Champ label="Rôle" value={pnj.role} onChange={e => modifier(p => { p.role = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Image (URL)" placeholder="https://..." value={pnj.image}
              onChange={e => modifier(p => { p.image = e.target.value })} />
            {pnj.image && <span className="etroit">
              <img src={pnj.image} alt={pnj.nom} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, marginTop: 18 }} />
            </span>}
          </div>
          <p className="aide">Le stockage d'images en ligne (upload direct) arrive avec le passage à Supabase Storage. En attendant, colle l'URL d'une image déjà hébergée.</p>

          <h3>Factions</h3>
          <p className="aide">Un PNJ peut appartenir à plusieurs factions (organigrammes, rôles multiples). Précise un poste par faction si besoin, sinon le "Poste" général ci-dessous s'applique partout.</p>
          <SelecteurFactions ids={pnj.factionIds} surChange={v => modifier(p => {
            p.factionIds = v
            Object.keys(p.rolesFactions).forEach(id => { if (!v.includes(id)) delete p.rolesFactions[id] })
          })} />
          {pnj.factionIds.map(fid => {
            const f = univers.factions.find(x => x.id === fid)
            if (!f) return null
            return (
              <div className="rangee" key={fid} style={{ marginTop: 6 }}>
                <PuceFaction id={fid} />
                <input placeholder={pnj.poste || 'Poste dans cette faction (sinon : poste général)'}
                  value={pnj.rolesFactions[fid] || ''}
                  onChange={e => modifier(p => { p.rolesFactions[fid] = e.target.value })} />
              </div>
            )
          })}

          <div className="rangee">
            <Champ label="Poste général (organigramme)" placeholder="Chef de l'Aile du Piston"
              value={pnj.poste} onChange={e => modifier(p => { p.poste = e.target.value })} />
            <span><label>Supérieur hiérarchique</label>
              <select value={pnj.superieurId || ''} onChange={e => modifier(p => { p.superieurId = e.target.value || null })}>
                <option value="">—</option>
                {univers.pnjs.filter(x => x.id !== pnj.id && x.factionIds?.some(id => pnj.factionIds?.includes(id)))
                  .map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
              </select></span>
          </div>
          <label className="aide">Description</label>
          <ChampEditable valeur={pnj.description} vide="Aucune description."
            surChange={v => modifier(p => { p.description = v })} />
          <label className="aide">Secrets Maître</label>
          <ChampEditable valeur={pnj.secrets} vide="Aucun secret."
            surChange={v => modifier(p => { p.secrets = v })} />

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
              <div className="carte" key={c.id} style={{ minWidth: 340, flex: '1 1 480px' }}>
                <div style={{ textAlign: 'center' }}>
                  <Manometre compteur={c} surDelta={(d) => modifier(p => {
                    const x = p.compteurs[i]
                    x.valeur = Math.min(x.max, Math.max(x.min, (x.valeur ?? x.min) + d))
                  })} />
                </div>
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
                <label>Seuils (zones du manomètre)</label>
                {c.seuils.map((s, k) => (
                  <div className="rangee" key={k}>
                    <input className="etroit" type="number" title="jusqu'à" value={s.jusqua}
                      onChange={e => modifier(p => { p.compteurs[i].seuils[k].jusqua = +e.target.value })} />
                    <input placeholder="libellé" value={s.libelle}
                      onChange={e => modifier(p => { p.compteurs[i].seuils[k].libelle = e.target.value })} />
                    <select className="etroit" value={s.couleur}
                      onChange={e => modifier(p => { p.compteurs[i].seuils[k].couleur = e.target.value })}>
                      <option value="vert">vert</option><option value="orange">orange</option><option value="rouge">rouge</option>
                    </select>
                    <button className="btn clair etroit" onClick={() => modifier(p => { p.compteurs[i].seuils.splice(k, 1) })}>×</button>
                  </div>
                ))}
                <button className="btn clair" onClick={() => modifier(p => {
                  p.compteurs[i].seuils.push({ jusqua: c.max, libelle: '', couleur: 'orange' })
                })}>+ seuil</button>
                <label>Événements du compteur (boutons du mode session)</label>
                {c.evenements.map((ev, k) => (
                  <div className="rangee" key={k}>
                    <input placeholder="Rapport rendu à Sterling" value={ev.label}
                      onChange={e => modifier(p => { p.compteurs[i].evenements[k].label = e.target.value })} />
                    <input className="etroit" type="number" value={ev.delta}
                      onChange={e => modifier(p => { p.compteurs[i].evenements[k].delta = +e.target.value })} />
                    <button className="btn clair etroit" onClick={() => modifier(p => { p.compteurs[i].evenements.splice(k, 1) })}>×</button>
                  </div>
                ))}
                <button className="btn clair" onClick={() => modifier(p => {
                  p.compteurs[i].evenements.push({ label: '', delta: 1 })
                })}>+ événement</button>
                <div style={{ marginTop: 8 }}>
                  <button className="btn clair" onClick={() => modifier(p => { p.compteurs.splice(i, 1) })}>retirer le compteur</button>
                </div>
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
