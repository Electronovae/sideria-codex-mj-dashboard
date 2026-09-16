import React, { useMemo, useState } from 'react'
import { TexteLeger } from './texteLeger.jsx'

const LABELS_SERVICES = {
  hebergement: 'Hébergement', transport: 'Transport', restauration: 'Restauration',
  services_professionnels: 'Services professionnels', train_de_vie: 'Train de vie', salaires: 'Salaires',
}
const ORDRE_SERVICES = ['hebergement', 'transport', 'restauration', 'services_professionnels', 'train_de_vie', 'salaires']

function ObjetCarte({ o }) {
  return (
    <div className="wiki-feature">
      <div className="wiki-feature-nom" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{o.nom}</span>
        {o.prix && <span className="wiki-libelle-discret" style={{ whiteSpace: 'nowrap' }}>{o.prix}</span>}
      </div>
      {o.description && <div className="wiki-feature-texte" style={{ marginBottom: 4 }}><TexteLeger>{o.description}</TexteLeger></div>}
      {o.specificite && <div className="wiki-feature-texte" style={{ color: 'var(--gris)' }}><TexteLeger>{o.specificite}</TexteLeger></div>}
      {o.craft && <div className="wiki-feature-texte" style={{ fontStyle: 'italic', marginTop: 4 }}>Craftable : {o.craft}</div>}
    </div>
  )
}

export default function Equipement({ objets, services, chargement, onRetour }) {
  const categoriesObjets = useMemo(() => {
    const vues = new Set()
    const out = []
    for (const o of objets) if (!vues.has(o.categorie)) { vues.add(o.categorie); out.push(o.categorie) }
    return out
  }, [objets])

  const [categorie, setCategorie] = useState(null)
  const catActive = categorie ?? categoriesObjets[0] ?? null
  const vueServices = categorie === '__services__'

  const items = useMemo(() => objets.filter(o => o.categorie === catActive), [objets, catActive])
  const servicesParCategorie = useMemo(() => {
    const map = new Map()
    for (const s of services) {
      if (!map.has(s.categorie)) map.set(s.categorie, [])
      map.get(s.categorie).push(s)
    }
    return map
  }, [services])

  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement…</p></div>
  }

  return (
    <div className="wiki-page">
      <button className="wiki-retour" onClick={onRetour}>← Accueil</button>
      <div className="wiki-entete">
        <h1>Équipement</h1>
        <p className="wiki-sous-titre">Armes, armures, outils et services accessibles au commun des personnages.</p>
      </div>

      <div className="wiki-pastilles-sous-classes">
        {categoriesObjets.map(c => (
          <span key={c} className={'wiki-pastille-sous-classe' + (!vueServices && c === catActive ? ' actif' : '')}
            onClick={() => setCategorie(c)}>{c}</span>
        ))}
        <span className={'wiki-pastille-sous-classe' + (vueServices ? ' actif' : '')}
          onClick={() => setCategorie('__services__')}>Services & Train de vie</span>
      </div>

      {!vueServices && items.map(o => <ObjetCarte key={o.id} o={o} />)}

      {vueServices && ORDRE_SERVICES.map(cat => (
        servicesParCategorie.has(cat) && (
          <div key={cat}>
            <h2 className="wiki-sous-titre-section">{LABELS_SERVICES[cat] || cat}</h2>
            {servicesParCategorie.get(cat).map(s => (
              <div key={s.id} className="wiki-feature">
                <div className="wiki-feature-nom" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{s.nom}</span>
                  {s.prix && <span className="wiki-libelle-discret" style={{ whiteSpace: 'nowrap' }}>{s.prix}</span>}
                </div>
                {s.detail && <div className="wiki-feature-texte">{s.detail}</div>}
              </div>
            ))}
          </div>
        )
      ))}
    </div>
  )
}
