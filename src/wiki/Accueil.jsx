import React from 'react'

const ETAPES = [
  {
    titre: '1. Choisis ta classe',
    texte: "16 classes, chacune avec 2 à 6 spécialisations. Si tu hésites, regarde les tags de rôle (Corps à corps, Lanceur de sorts, Soutien...) sur chaque carte.",
    action: 'classes',
  },
  {
    titre: '2. Répartis tes caractéristiques',
    texte: 'For, Dex, Con, Int, Sag, Cha et Éclat (7e caractéristique sidérienne). Méthode de lancer détaillée, table des modificateurs et bonus de peuple.',
    action: 'caracteristiques',
  },
  {
    titre: '3. Note tes techniques de départ',
    texte: "Chaque classe a des techniques de base, débloquées ensuite via les Fragments (1d4 par niveau). Tu les retrouves dans l'onglet Techniques de ta fiche de classe.",
    action: 'classes',
  },
  {
    titre: '4. Choisis ton équipement',
    texte: "Armes et armures autorisées dépendent de ta classe : c'est indiqué dans le bloc \u00ab Bases \u00bb en haut de chaque fiche de classe.",
    action: 'classes',
  },
  {
    titre: '5. Défini ton personnage',
    texte: "Origine, faction, traits de personnalité : ce qui rendra ton personnage vivant à la table.",
  },
  {
    titre: '6. Crée ta fiche',
    texte: 'Une fois ces choix faits, direction les fiches de personnage pour tout renseigner officiellement.',
    action: 'fiches',
  },
]

export default function Accueil({ onNaviguer }) {
  return (
    <div className="wiki-page">
      <div className="wiki-entete">
        <h1>Codex de Sidéria</h1>
        <p className="wiki-sous-titre">
          Le manuel des joueurs, en version consultable. Plus besoin d'ouvrir le PDF.
        </p>
      </div>

      <button className="wiki-carte-classe" style={{ marginBottom: 20 }} onClick={() => onNaviguer('classes')}>
        <div className="wiki-carte-tete">
          <span className="wiki-pastille" style={{ background: 'var(--or)' }} />
          <span className="wiki-carte-nom">Parcourir les 16 classes</span>
        </div>
        <p className="wiki-carte-accroche">Techniques complètes, spécialisations, capacités légendaires.</p>
      </button>

      <h2 className="wiki-sous-titre-section" style={{ marginTop: 0 }}>Créer un personnage</h2>
      <div className="wiki-etapes">
        {ETAPES.map((e, i) => (
          <div key={i} className="wiki-etape">
            <div className="wiki-etape-titre">{e.titre}</div>
            <p className="wiki-etape-texte">{e.texte}</p>
            {e.action && (
              <button className="wiki-etape-lien" onClick={() => onNaviguer(e.action)}>
                {e.action === 'fiches' ? 'Aller créer ma fiche →'
                  : e.action === 'caracteristiques' ? 'Voir la méthode →'
                  : 'Voir les classes →'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
