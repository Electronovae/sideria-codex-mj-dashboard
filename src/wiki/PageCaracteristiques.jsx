import React from 'react'

const MODIFICATEURS = [
  { score: '1–3', mod: '−4' }, { score: '4–5', mod: '−3' }, { score: '6–7', mod: '−2' },
  { score: '8–9', mod: '−1' }, { score: '10–11', mod: '+0' }, { score: '12–13', mod: '+1' },
  { score: '14–15', mod: '+2' }, { score: '16–17', mod: '+3' }, { score: '18–19', mod: '+4' },
  { score: '20–21', mod: '+5' },
]

const BONUS_PEUPLES = [
  ['Humain', '+1 à toutes les caractéristiques'],
  ['Humain de Trame', '+2 à deux caractéristiques au choix'],
  ['Sillé', '+2 Dex, +1 Int ou Sag'],
  ['Forgé-chair', '+2 Con, +1 Sag ou For'],
  ['Pied-vif', '+2 Dex, +1 Cha ou Sag'],
  ['Treillis', '+2 Int, +1 Dex ou Cha'],
  ['Demi-Sillé', '+2 Cha, +1 à deux autres au choix'],
  ['Fracture-né', '+2 For, +1 Con'],
  ['Marqié', '+2 Cha, +1 Int'],
  ['Lune-né', '+2 Cha, +1 Sag'],
  ['Forgé', '+2 Con, +1 au choix'],
  ['Sang-Mêlé', '+2 à une, +1 à deux autres (toutes différentes)'],
  ['Transplanés', "+2 selon le plan d'origine, +1 au choix"],
]

export default function PageCaracteristiques({ onRetour }) {
  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Retour au guide</button>

      <div className="wiki-entete">
        <h1>Répartir tes caractéristiques</h1>
        <p className="wiki-sous-titre">Étape 3 de la création de personnage.</p>
      </div>

      <div className="wiki-corps">
        <h2 className="wiki-sous-titre-section" style={{ marginTop: 0 }}>Méthode de lancer</h2>
        <div className="wiki-encart">
          <p style={{ margin: '0 0 8px' }}>
            Lance <strong>4d6</strong>. Si un ou plusieurs dés affichent 1, relance-les une seule fois, puis retire le dé le plus bas des quatre (garde le nouveau résultat, quel qu'il soit). Additionne les 3 meilleurs dés restants : c'est ton score brut.
          </p>
          <p style={{ margin: 0 }}>
            Répète l'opération <strong>7 fois</strong> pour obtenir 7 scores. Attribue-les librement aux 7 caractéristiques : Force, Dextérité, Constitution, Intelligence, Sagesse, Charisme, et <strong>Éclat (ÉCL)</strong>.
          </p>
        </div>

        <div className="wiki-encart">
          <div className="wiki-encart-titre">L'Éclat (ÉCL), 7e caractéristique</div>
          <p style={{ margin: '0 0 8px' }}>
            Mesure la sensibilité naturelle aux flux d'Éther planaire. N'amplifie pas les dégâts de sorts : c'est une stat de réceptivité et de résistance.
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '.86rem' }}>
            <li>Cristallite : les jets de résistance utilisent CON ou ÉCL, le plus élevé selon la source.</li>
            <li>ÉCL ≥ 14 : perception passive des flux d'Éther sans sort actif.</li>
            <li>Le Conduit utilise ÉCL comme caractéristique d'incantation. Le Traceur peut la choisir comme modificateur.</li>
          </ul>
        </div>

        <h2 className="wiki-sous-titre-section">Table des modificateurs</h2>
        <div className="wiki-stats" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {MODIFICATEURS.map(m => (
            <div key={m.score} className="wiki-stat">
              <div className="wiki-stat-label">{m.score}</div>
              <div className="wiki-stat-valeur">{m.mod}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '.82rem', color: 'var(--gris)', marginTop: 8 }}>
          Formule générale : (Score − 10) ÷ 2, arrondi à l'inférieur.
        </p>

        <h2 className="wiki-sous-titre-section">Bonus de peuple</h2>
        <p style={{ fontSize: '.86rem', color: 'var(--gris)', marginBottom: 10 }}>
          Une fois les 7 scores attribués, ajoute les bonus accordés par ton peuple (choisi à l'étape 1, voir la Partie III — Origines du manuel).
        </p>
        {BONUS_PEUPLES.map(([peuple, bonus]) => (
          <div key={peuple} className="wiki-feature">
            <div className="wiki-feature-nom">{peuple}</div>
            <div className="wiki-feature-texte">{bonus}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
