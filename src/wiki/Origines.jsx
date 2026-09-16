import React, { useState } from 'react'
import { TexteLeger } from './texteLeger.jsx'

function Traits({ traits }) {
  if (!traits?.length) return null
  return (
    <div>
      {traits.map((t, i) => (
        <div key={i} className="wiki-feature">
          {t.label && <div className="wiki-feature-nom">{t.label}</div>}
          <div className="wiki-feature-texte"><TexteLeger>{t.texte}</TexteLeger></div>
        </div>
      ))}
    </div>
  )
}

function FichePeuple({ p, onRetour }) {
  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Tous les peuples</button>
      <div className="wiki-entete">
        <span className="wiki-libelle-discret">Peuple</span>
        <h1>{p.nom}</h1>
        {p.flavour && <p className="wiki-citation">{p.flavour}</p>}
      </div>
      <div className="wiki-corps">
        <h2 className="wiki-sous-titre-section" style={{ marginTop: 0 }}>Traits</h2>
        <Traits traits={p.traits} />
        {p.variante && (
          <div className="wiki-encart">
            <div className="wiki-encart-titre">Variante</div>
            <TexteLeger>{p.variante}</TexteLeger>
          </div>
        )}
        {p.regard && (
          <>
            <h2 className="wiki-sous-titre-section">Regard de Sidéria</h2>
            <p className="wiki-description"><TexteLeger>{p.regard}</TexteLeger></p>
          </>
        )}
      </div>
    </div>
  )
}

function FicheHistorique({ h, onRetour }) {
  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Tous les historiques</button>
      <div className="wiki-entete">
        <span className="wiki-libelle-discret">Historique</span>
        <h1>{h.nom}</h1>
        {h.flavour && <p className="wiki-citation">{h.flavour}</p>}
      </div>
      <div className="wiki-corps">
        <h2 className="wiki-sous-titre-section" style={{ marginTop: 0 }}>Compétences & équipement</h2>
        <Traits traits={h.traits} />
        {h.trait_accroche?.length > 0 && (
          <>
            <h2 className="wiki-sous-titre-section">Trait & accroche</h2>
            <Traits traits={h.trait_accroche} />
          </>
        )}
      </div>
    </div>
  )
}

export default function Origines({ peuples, historiques, chargement, onRetour }) {
  const [onglet, setOnglet] = useState('peuples')
  const [selPeuple, setSelPeuple] = useState(null)
  const [selHistorique, setSelHistorique] = useState(null)

  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement…</p></div>
  }

  if (selPeuple) {
    const p = peuples.find(x => x.id === selPeuple)
    if (p) return <FichePeuple p={p} onRetour={() => setSelPeuple(null)} />
  }
  if (selHistorique) {
    const h = historiques.find(x => x.id === selHistorique)
    if (h) return <FicheHistorique h={h} onRetour={() => setSelHistorique(null)} />
  }

  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Accueil</button>
      <div className="wiki-entete">
        <h1>Origines</h1>
        <p className="wiki-sous-titre">Ton peuple, puis ton historique. Les deux ensemble définissent tes bonus de départ.</p>
      </div>

      <div className="wiki-onglets">
        <button className={'wiki-onglet' + (onglet === 'peuples' ? ' actif' : '')} onClick={() => setOnglet('peuples')}>
          Peuples ({peuples.length})
        </button>
        <button className={'wiki-onglet' + (onglet === 'historiques' ? ' actif' : '')} onClick={() => setOnglet('historiques')}>
          Historiques ({historiques.length})
        </button>
      </div>

      {onglet === 'peuples' && (
        <div className="wiki-liste-classes">
          {peuples.map(p => (
            <button key={p.id} className="wiki-carte-classe" onClick={() => setSelPeuple(p.id)}>
              <div className="wiki-carte-tete">
                <span className="wiki-carte-nom">{p.nom}</span>
              </div>
              {p.flavour && <p className="wiki-carte-accroche">{p.flavour}</p>}
            </button>
          ))}
        </div>
      )}

      {onglet === 'historiques' && (
        <div className="wiki-liste-classes">
          {historiques.map(h => (
            <button key={h.id} className="wiki-carte-classe" onClick={() => setSelHistorique(h.id)}>
              <div className="wiki-carte-tete">
                <span className="wiki-carte-nom">{h.nom}</span>
              </div>
              {h.flavour && <p className="wiki-carte-accroche">{h.flavour}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
