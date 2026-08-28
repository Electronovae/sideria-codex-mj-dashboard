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
    action: 'equipement',
  },
  {
    titre: '5. Défini ton personnage',
    texte: "Origine, faction, traits de personnalité : ce qui rendra ton personnage vivant à la table.",
    action: 'origines',
  },
  {
    titre: '6. Crée ta fiche',
    texte: 'Une fois ces choix faits, direction les fiches de personnage pour tout renseigner officiellement.',
    action: 'fiches',
  },
]

const SECTIONS = [
  { titre: 'Parcourir les 16 classes', accroche: 'Techniques complètes, spécialisations, capacités légendaires.', action: 'classes' },
  { titre: 'Origines', accroche: 'Peuples et historiques : bonus de départ, compétences, capacités narratives.', action: 'origines' },
  { titre: 'Dons', accroche: 'Génériques, de maîtrise ou de classe. Acquis aux niveaux 1, 10, 20, 30 et 40.', action: 'dons' },
  { titre: 'Équipement', accroche: 'Armes, armures, outils, consommables et services courants.', action: 'equipement' },
  { titre: 'Jouer à Sidéria', accroche: 'Caractéristiques, compétences, combat, aventure, montures et marchandises.', action: 'jouer' },
  { titre: 'Progression & multiclassage', accroche: "XP, Fragments de Progression, Indice de Discipline.", action: 'progression' },
  { titre: 'Sorts', accroche: '339 sorts répartis en 11 disciplines.', action: 'sorts' },
]

export default function Accueil({ onNaviguer }) {
  return (
    <div className="wiki-page">
      <div className="wiki-entete" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1>Codex de Sidéria</h1>
          <p className="wiki-sous-titre" style={{ marginBottom: 0 }}>
            Le manuel des joueurs, en version consultable. Plus besoin d'ouvrir le PDF.
          </p>
        </div>
        <button className="wiki-etape-lien" style={{
          flex: 'none', background: 'var(--bleu)', color: '#fff', padding: '9px 16px',
          borderRadius: 8, fontSize: '.85rem', whiteSpace: 'nowrap',
        }} onClick={() => onNaviguer('connexion')}>
          Se connecter
        </button>
      </div>

      <p className="wiki-description" style={{ marginTop: 16, marginBottom: 22 }}>
        Sidéria est une cité tentaculaire où l'Éther irrigue tout : l'industrie, la magie, les inégalités
        entre l'Arcadie et les Bas-Fonds. Ce codex rassemble tout ce qu'il te faut pour y créer et jouer
        un personnage — classes, origines, dons, équipement et règles de base.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {SECTIONS.map(s => (
          <button
            key={s.titre}
            className="wiki-carte-classe"
            disabled={!s.action}
            style={!s.action ? { opacity: .55, cursor: 'default' } : undefined}
            onClick={() => s.action && onNaviguer(s.action)}
          >
            <div className="wiki-carte-tete">
              <span className="wiki-pastille" style={{ background: 'var(--or)' }} />
              <span className="wiki-carte-nom">{s.titre}</span>
            </div>
            <p className="wiki-carte-accroche" style={{ marginBottom: 0 }}>{s.accroche}</p>
          </button>
        ))}
      </div>

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
                  : e.action === 'origines' ? 'Voir les origines →'
                  : e.action === 'equipement' ? "Voir l'équipement →"
                  : 'Voir les classes →'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
