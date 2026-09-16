import React, { useMemo, useState } from 'react'
import { metaClasse } from './roleMeta.js'

export default function ListeClasses({ classes, onSelect }) {
  const [recherche, setRecherche] = useState('')

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return classes
    return classes.filter(c => {
      const meta = metaClasse(c.nom)
      const hay = [c.nom, meta.accroche, ...(meta.tags || [])].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [classes, recherche])

  return (
    <div className="wiki-page">
      <div className="wiki-entete">
        <h1>Choisir une classe</h1>
        <p className="wiki-sous-titre">{classes.length} classes. Touche une carte pour voir la fiche complète.</p>
        <input
          type="text" className="wiki-recherche" placeholder="Chercher un mot-clé, un rôle…"
          value={recherche} onChange={e => setRecherche(e.target.value)}
        />
      </div>
      <div className="wiki-liste-classes">
        {visibles.map(c => {
          const meta = metaClasse(c.nom)
          return (
            <button key={c.id} className="wiki-carte-classe" onClick={() => onSelect(c.id)}>
              <div className="wiki-carte-tete">
                <span className="wiki-pastille" style={{ background: meta.couleur }} />
                <span className="wiki-carte-nom">{c.nom}</span>
              </div>
              {meta.accroche && <p className="wiki-carte-accroche">{meta.accroche}</p>}
              {meta.tags?.length > 0 && (
                <div className="wiki-tags">
                  {meta.tags.map(t => <span key={t} className="wiki-tag">{t}</span>)}
                </div>
              )}
            </button>
          )
        })}
        {visibles.length === 0 && (
          <p className="wiki-vide">Aucune classe ne correspond à « {recherche} ».</p>
        )}
      </div>
    </div>
  )
}
