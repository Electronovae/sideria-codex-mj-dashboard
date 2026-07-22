import React, { useContext } from 'react'
import { Ctx } from '../App.jsx'
import { SAISONS, versJour, depuisJour } from '../lib/calendrier.js'

export const useStudio = () => useContext(Ctx)

export const Champ = ({ label, ...props }) => (
  <span style={{ display: 'block' }}>
    <label>{label}</label>
    {props.zone ? <textarea {...props} /> : <input {...props} />}
  </span>
)

export const SelecteurFaction = ({ valeur, surChange, avecVide = true }) => {
  const { univers } = useStudio()
  return (
    <select value={valeur ?? ''} onChange={e => surChange(e.target.value || null)}>
      {avecVide && <option value="">— aucune —</option>}
      {univers.factions.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
    </select>
  )
}

export const PuceFaction = ({ id }) => {
  const { univers } = useStudio()
  const f = univers.factions.find(x => x.id === id)
  if (!f) return null
  return (
    <span className="puce" style={{ borderColor: f.couleur, cursor: 'default' }}>
      <span className="rond" style={{ background: f.couleur }} />{f.nom}
    </span>
  )
}

// Sélecteur multiple de PNJ sous forme de puces cliquables.
export const PucesPnjs = ({ ids, surChange }) => {
  const { univers } = useStudio()
  const ens = new Set(ids)
  const basculer = (id) => {
    ens.has(id) ? ens.delete(id) : ens.add(id)
    surChange([...ens])
  }
  return (
    <div>
      {univers.pnjs.map(p => {
        const f = univers.factions.find(x => x.id === p.faction)
        return (
          <span key={p.id} className={'puce' + (ens.has(p.id) ? '' : ' off')}
            style={{ borderColor: f?.couleur || 'var(--gris)' }}
            onClick={() => basculer(p.id)}>{p.nom}</span>
        )
      })}
    </div>
  )
}

// Saisie d'une date sidérienne (an / saison / jour) -> index de jour ou null.
export const DateSiderienne = ({ label, valeur, surChange, optionnel = false }) => {
  const d = valeur != null ? depuisJour(valeur) : { an: '', sais: 0, jour: 1 }
  const emettre = (an, sais, jour) => {
    if (an === '' || isNaN(parseInt(an))) { surChange(null); return }
    surChange(versJour(parseInt(an), parseInt(sais) || 0, parseInt(jour) || 1))
  }
  return (
    <span style={{ display: 'block' }}>
      <label>{label}{optionnel ? ' (optionnel)' : ''}</label>
      <span className="rangee">
        <input className="etroit" type="number" placeholder="An" value={d.an}
          onChange={e => emettre(e.target.value, d.sais, d.jour)} />
        <select value={d.sais} onChange={e => emettre(d.an, e.target.value, d.jour)}>
          {SAISONS.map((s, i) => <option key={i} value={i}>{s}</option>)}
        </select>
        <input className="etroit" type="number" min="1" max="70" value={d.jour}
          onChange={e => emettre(d.an, d.sais, e.target.value)} />
      </span>
    </span>
  )
}

// Cadre générique liste (gauche) + fiche (droite), avec tri optionnel.
// tris : { libellé: (item) => valeur } ; le premier est le tri par défaut.
export const ListeFiche = ({ items, selId, surSel, surAjout, rendu, enfants, libelleAjout = '+ Ajouter', tris = null, groupe = null }) => {
  const cles = tris ? Object.keys(tris) : []
  const [tri, setTri] = React.useState(cles[0] || null)
  const affiches = tri && tris
    ? [...items].sort((a, b) => {
        const va = tris[tri](a), vb = tris[tri](b)
        if (typeof va === 'number' && typeof vb === 'number') return va - vb
        return String(va ?? '').localeCompare(String(vb ?? ''), 'fr')
      })
    : items
  return (
    <>
      <div className="liste">
        <button className="btn clair ajout" onClick={surAjout}>{libelleAjout}</button>
        {tris && (
          <div style={{ padding: '0 14px 8px' }}>
            <label>Trier par</label>
            <select value={tri} onChange={e => setTri(e.target.value)}>
              {cles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        {affiches.map((it, i) => {
          const grpActif = groupe && tri === cles[0]
          const entete = grpActif && (i === 0 || groupe(affiches[i - 1]) !== groupe(it))
            ? <div className="sous-titre-liste" key={'g' + i}>{groupe(it)}</div> : null
          return (
            <React.Fragment key={it.id}>
              {entete}
              <div className={'item' + (it.id === selId ? ' sel' : '')} onClick={() => surSel(it.id)}
                style={grpActif ? { paddingLeft: 22 } : undefined}>
                {rendu(it)}
              </div>
            </React.Fragment>
          )
        })}
      </div>
      <div className="fiche">
        {enfants || <div className="vide">Sélectionne un élément à gauche, ou crées-en un.</div>}
      </div>
    </>
  )
}
