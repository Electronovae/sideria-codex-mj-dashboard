import React, { useMemo, useState } from 'react'
import { TexteLeger } from './texteLeger.jsx'

export default function JouerASideria({ regles, chargement, onRetour }) {
  const sections = useMemo(
    () => regles.filter(r => r.section.startsWith('jouer_')).sort((a, b) => a.ordre - b.ordre),
    [regles]
  )
  const categories = useMemo(() => {
    const vues = new Set()
    const out = []
    for (const s of sections) if (!vues.has(s.categorie)) { vues.add(s.categorie); out.push(s.categorie) }
    return out
  }, [sections])
  const [categorie, setCategorie] = useState(null)
  const catActive = categorie ?? categories[0] ?? null

  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement…</p></div>
  }

  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Accueil</button>
      <div className="wiki-entete">
        <h1>Jouer à Sidéria</h1>
        <p className="wiki-sous-titre">Les règles de base : caractéristiques, compétences, combat, aventure et marchandises.</p>
      </div>

      <div className="wiki-pastilles-sous-classes">
        {categories.map(c => (
          <span key={c} className={'wiki-pastille-sous-classe' + (c === catActive ? ' actif' : '')}
            onClick={() => setCategorie(c)}>{c}</span>
        ))}
      </div>

      {sections.filter(s => s.categorie === catActive).map(s => (
        <div key={s.section} className="wiki-feature">
          <div className="wiki-feature-nom">{s.titre}</div>
          <div className="wiki-feature-texte" style={{ whiteSpace: 'pre-line' }}><TexteLeger>{s.contenu}</TexteLeger></div>
        </div>
      ))}
    </div>
  )
}
