import React, { useMemo, useState } from 'react'
import { TexteLeger } from './texteLeger.jsx'

function CarteSort({ sort }) {
  const champs = sort.contenu?.filter(c => c.type === 'champ') ?? []
  const description = sort.contenu?.find(c => c.type === 'description')
  const progression = sort.contenu?.find(c => c.type === 'progression')

  return (
    <div className="wiki-feature">
      <div className="wiki-feature-nom" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span>{sort.nom}</span>
      </div>
      <div className="wiki-libelle-discret" style={{ marginBottom: 4 }}>{sort.sous_type}</div>
      <div className="wiki-libelle-discret" style={{ marginBottom: 8, fontStyle: 'italic' }}>{sort.meta}</div>

      {champs.map((c, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>{c.label}</span>{' '}
          <span className="wiki-feature-texte" style={{ display: 'inline' }}><TexteLeger>{c.texte}</TexteLeger></span>
        </div>
      ))}
      {description && (
        <p className="wiki-feature-texte" style={{ fontStyle: 'italic', marginTop: 6 }}>
          <TexteLeger>{description.texte}</TexteLeger>
        </p>
      )}
      {progression && (
        <div className="wiki-encart" style={{ marginTop: 6 }}>
          <div className="wiki-encart-titre">Progression</div>
          <TexteLeger>{progression.texte}</TexteLeger>
        </div>
      )}
    </div>
  )
}

export default function Sorts({ disciplines, sorts, chargement, onRetour }) {
  const [discActive, setDiscActive] = useState(null)
  const [recherche, setRecherche] = useState('')

  const disciplineCourante = discActive ?? disciplines[0]?.nom ?? null

  const sortsAffiches = useMemo(() => {
    let liste = sorts.filter(s => {
      const disc = disciplines.find(d => d.id === s.discipline_id)
      return disc?.nom === disciplineCourante
    })
    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase()
      liste = liste.filter(s => s.nom.toLowerCase().includes(q))
    }
    return liste
  }, [sorts, disciplines, disciplineCourante, recherche])

  const disciplineInfo = disciplines.find(d => d.nom === disciplineCourante)

  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement…</p></div>
  }

  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Accueil</button>
      <div className="wiki-entete">
        <h1>Sorts</h1>
        <p className="wiki-sous-titre">339 sorts répartis en 11 disciplines.</p>
      </div>

      <input
        type="text"
        placeholder="Rechercher un sort…"
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        className="wiki-recherche"
        style={{ marginBottom: 12 }}
      />

      <div className="wiki-pastilles-sous-classes">
        {disciplines.map(d => (
          <span key={d.id} className={'wiki-pastille-sous-classe' + (d.nom === disciplineCourante ? ' actif' : '')}
            onClick={() => setDiscActive(d.nom)}>{d.nom}</span>
        ))}
      </div>

      {disciplineInfo && (
        <div className="wiki-entete" style={{ marginTop: 4 }}>
          {disciplineInfo.flavour && <p className="wiki-citation">{disciplineInfo.flavour}</p>}
          {disciplineInfo.intro && <p className="wiki-description">{disciplineInfo.intro}</p>}
        </div>
      )}

      {sortsAffiches.length === 0 && <p className="wiki-vide">Aucun sort trouvé.</p>}
      {sortsAffiches.map(s => <CarteSort key={s.id} sort={s} />)}
    </div>
  )
}
