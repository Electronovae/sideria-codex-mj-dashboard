import React from 'react'
import { useStudio, DateSiderienne } from './communs.jsx'
import { STATUTS_SESSION } from '../lib/modele.js'
import { fmtDate } from '../lib/calendrier.js'

export default function Tableau() {
  const { univers, maj, setOnglet } = useStudio()
  const toutesSessions = univers.campagnes.flatMap(c => c.sessions)
  const parStatut = (val) => toutesSessions.filter(s => s.statut === val).length
  const tuiles = [
    ['campagnes', 'Campagnes', univers.campagnes.length, 'et la méta-campagne'],
    ['pnjs', 'PNJ', univers.pnjs.length, `${univers.pnjs.filter(p => p.arbre).length} avec arbre`],
    ['joueurs', 'Personnages joueurs', univers.joueurs.length, 'réputations et interactions'],
    ['factions', 'Factions', univers.factions.length, 'couleurs et membres'],
    ['evenements', 'Événements', univers.evenements.length, 'sur le calendrier sidérien'],
    ['rapports', 'Rapports', univers.rapports.length, 'dépêches, notes, témoignages'],
  ]
  return (
    <div className="fiche" style={{ maxWidth: 1100 }}>
      <h2>{univers.meta.nom}</h2>
      <p style={{ marginBottom: 16, fontStyle: 'italic' }}>{univers.meta.these}</p>

      <div className="carte" style={{ marginBottom: 16 }}>
        <label>Date de campagne</label>
        <p className="aide">Le jour "actuel" pour toi, tous groupes confondus. Sert de point de départ auto-rempli (début = fin) quand tu crées un nouvel événement, modifiable ensuite. Réglable aussi directement depuis la Frise.</p>
        <DateSiderienne optionnel valeur={univers.meta.dateCampagne}
          surChange={v => maj(u => { u.meta.dateCampagne = v })} />
        {univers.meta.dateCampagne != null && <span className="aide" style={{ marginLeft: 10 }}>{fmtDate(univers.meta.dateCampagne)}</span>}
      </div>

      <div className="tableau-bord">
        {tuiles.map(([id, titre, n, sous]) => (
          <div key={id} className="tuile" onClick={() => setOnglet(id)}>
            <div className="chiffre">{n}</div>
            <div className="titre">{titre}</div>
            <div style={{ fontSize: '.75rem', opacity: .8 }}>{sous}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 26, fontVariant: 'small-caps', color: 'var(--bleu)' }}>Sessions</h3>
      <div className="rangee">
        {STATUTS_SESSION.map(st => (
          <div key={st.val} className="carte" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setOnglet('campagnes')}>
            <div style={{ fontSize: '1.6rem' }}>{st.icone}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{parStatut(st.val)}</div>
            <div className="aide">{st.label}</div>
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
