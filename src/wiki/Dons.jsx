import React, { useMemo, useState } from 'react'
import { TexteLeger } from './texteLeger.jsx'

const CATEGORIES = [
  ['generique', 'Génériques'],
  ['maitrise', 'Maîtrise'],
  ['classe', 'Classe'],
]

export default function Dons({ dons, chargement, onRetour }) {
  const [categorie, setCategorie] = useState('generique')

  const groupes = useMemo(() => {
    const filtres = dons.filter(d => d.categorie === categorie)
    const map = new Map()
    for (const d of filtres) {
      if (!map.has(d.sous_categorie)) map.set(d.sous_categorie, [])
      map.get(d.sous_categorie).push(d)
    }
    return [...map.entries()]
  }, [dons, categorie])

  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement…</p></div>
  }

  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Accueil</button>
      <div className="wiki-entete">
        <h1>Dons</h1>
        <p className="wiki-sous-titre">
          Acquis au niveau 1, puis aux niveaux 10, 20, 30 et 40. Un don par jalon, définitif.
        </p>
      </div>

      <div className="wiki-onglets">
        {CATEGORIES.map(([val, label]) => (
          <button key={val} className={'wiki-onglet' + (categorie === val ? ' actif' : '')} onClick={() => setCategorie(val)}>
            {label}
          </button>
        ))}
      </div>

      {groupes.map(([sousCat, items]) => (
        <div key={sousCat}>
          <h2 className="wiki-sous-titre-section">{sousCat}</h2>
          {items.map(d => (
            <div key={d.id} className="wiki-feature">
              <div className="wiki-feature-nom">
                {d.nom}
                {d.prerequis && <span className="wiki-libelle-discret" style={{ marginLeft: 8 }}>({d.prerequis})</span>}
              </div>
              <div className="wiki-feature-texte"><TexteLeger>{d.description}</TexteLeger></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
