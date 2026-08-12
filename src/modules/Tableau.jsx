import React from 'react'
import { useStudio } from './communs.jsx'

export default function Tableau() {
  const { univers, setOnglet } = useStudio()
  const tuiles = [
    ['campagnes', 'Campagnes', univers.campagnes.length, 'et la méta-campagne'],
    ['pnjs', 'PNJ', univers.pnjs.length, `${univers.pnjs.filter(p => p.arbre).length} avec arbre`],
    ['joueurs', 'Personnages joueurs', univers.joueurs.length, 'réputations et interactions'],
    ['factions', 'Factions', univers.factions.length, 'couleurs et membres'],
    ['evenements', 'Événements', univers.evenements.length, 'sur le calendrier sidérien'],
  ]
  return (
    <div className="fiche" style={{ maxWidth: 1100 }}>
      <h2>{univers.meta.nom}</h2>
      <p style={{ marginBottom: 16, fontStyle: 'italic' }}>{univers.meta.these}</p>
      <div className="tableau-bord">
        {tuiles.map(([id, titre, n, sous]) => (
          <div key={id} className="tuile" onClick={() => setOnglet(id)}>
            <div className="chiffre">{n}</div>
            <div className="titre">{titre}</div>
            <div style={{ fontSize: '.75rem', opacity: .8 }}>{sous}</div>
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: 26, fontVariant: 'small-caps', color: 'var(--bleu)' }}>Rappels</h3>
      <ul style={{ marginLeft: 20, fontSize: '.88rem' }}>
        <li>La sauvegarde locale est automatique (navigateur). Exporte le JSON régulièrement vers ton vault : c'est lui la vraie sauvegarde.</li>
        <li>L'export Obsidian génère un fragment de vault (PNJ, Factions, PJ, Campagnes, chronologie) avec wikilinks, à fusionner dans l'Obsidian.</li>
        <li>Le JSON exporté est compatible avec les outils de session (arbres, frises chronologiques).</li>
      </ul>
    </div>
  )
}
