import React from 'react'
import { TexteLeger } from './texteLeger.jsx'

function TableXP({ tableau }) {
  const tries = [...tableau].sort((a, b) => a.niveau - b.niveau)
  return (
    <div className="wiki-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {tries.map(r => (
        <div key={r.niveau} className="wiki-stat">
          <div className="wiki-stat-label">Niv. {r.niveau}</div>
          <div className="wiki-stat-valeur">{r.xp.toLocaleString('fr-FR')} XP</div>
        </div>
      ))}
    </div>
  )
}

function TableID({ tableau }) {
  return (
    <div className="wiki-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {tableau.map(r => (
        <div key={r.niveaux} className="wiki-stat">
          <div className="wiki-stat-label">Niv. {r.niveaux}</div>
          <div className="wiki-stat-valeur">+{r.id}</div>
        </div>
      ))}
    </div>
  )
}

function CasTypiques({ tableau }) {
  return (
    <div>
      {tableau.map((c, i) => (
        <div key={i} className="wiki-feature">
          <div className="wiki-feature-nom">{c.titre}</div>
          <div className="wiki-feature-texte"><TexteLeger>{c.texte}</TexteLeger></div>
        </div>
      ))}
    </div>
  )
}

export default function Progression({ regles, chargement, onRetour }) {
  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement…</p></div>
  }

  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Accueil</button>
      <div className="wiki-entete">
        <h1>Progression & multiclassage</h1>
        <p className="wiki-sous-titre">Environ une session par niveau. Alternative simple : monter d'un niveau par session.</p>
      </div>

      {regles.map((r, i) => (
        <div key={r.section}>
          <h2 className="wiki-sous-titre-section" style={{ marginTop: i === 0 ? 0 : 20 }}>{r.titre}</h2>
          {r.contenu && (
            <div className="wiki-description" style={{ whiteSpace: 'pre-line' }}>
              <TexteLeger>{r.contenu}</TexteLeger>
            </div>
          )}
          {r.section === 'progression_xp' && r.tableau && <TableXP tableau={r.tableau} />}
          {r.section === 'indice_discipline' && r.tableau && <TableID tableau={r.tableau} />}
          {r.section === 'specialisations_contextuelles' && r.tableau && <CasTypiques tableau={r.tableau} />}
        </div>
      ))}
    </div>
  )
}
