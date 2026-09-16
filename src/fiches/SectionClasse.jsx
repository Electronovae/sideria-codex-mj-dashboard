import React from 'react'
import { useClasses, useFeaturesDebloquees } from './useClasses.js'

function BlocClasse({ titre, classeId, subclassId, onChoisirClasse, onChoisirSubclasse, classes, fiche, modifier, debloquees, basculer }) {
  const classe = classes.find(c => c.id === classeId)
  const subclasse = classe?.subclasses.find(s => s.id === subclassId)
  const [filtre, setFiltre] = React.useState('toutes') // 'toutes' | 'obtenues'

  const fragmentsUtilises = [...(classe?.features ?? []), ...(subclasse?.features ?? [])]
    .filter(f => debloquees.has(f.id))
    .reduce((total, f) => total + f.cout_fragments, 0)

  const listeFeature = (f) => {
    const accessible = !f.niveau_requis || (fiche.level ?? 1) >= f.niveau_requis
    const active = debloquees.has(f.id)
    return (
      <div key={f.id} className={`classe-feature ${!accessible ? 'classe-feature--verrouillee' : ''}`}>
        <label className="classe-feature-ligne">
          <input
            type="checkbox" checked={active} disabled={!accessible}
            onChange={e => basculer(f.id, e.target.checked)}
          />
          <span className="classe-feature-nom">{f.nom}</span>
          <span className="classe-feature-meta">
            {f.cout_fragments > 0 && <span className="classe-feature-cout">{f.cout_fragments}F</span>}
            {f.niveau_requis > 1 && <span className="classe-feature-niveau">niv.{f.niveau_requis}</span>}
          </span>
        </label>
        <p className="classe-feature-desc">{f.description}</p>
      </div>
    )
  }

  return (
    <div className="classe-bloc">
      <h3>{titre}</h3>
      <div className="fc-grille fc-grille--2">
        <label className="fc-champ">
          <span>Classe</span>
          <select value={classeId ?? ''} onChange={e => onChoisirClasse(e.target.value || null)}>
            <option value="">— Aucune —</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </label>
        <label className="fc-champ">
          <span>Sous-classe</span>
          <select value={subclassId ?? ''} onChange={e => onChoisirSubclasse(e.target.value || null)} disabled={!classe}>
            <option value="">— Aucune —</option>
            {classe?.subclasses.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </label>
      </div>

      {classe && (
        <>
          <p className="feuille-note">Dé de vie : d{classe.de_vie} · {classe.fragments_cadence}</p>
          {classe.jauges.length > 0 && (
            <div className="classe-jauges">
              {classe.jauges.map((j, i) => (
                <div key={i} className="classe-jauge">
                  <strong>{j.nom}</strong>
                  <span>{j.detail}</span>
                </div>
              ))}
            </div>
          )}
          <p className="feuille-note">Fragments utilisés sur cette classe : {fragmentsUtilises}</p>

          <div className="classe-filtre">
            <button type="button" className={'classe-filtre-btn' + (filtre === 'toutes' ? ' actif' : '')}
              onClick={() => setFiltre('toutes')}>
              Toutes
            </button>
            <button type="button" className={'classe-filtre-btn' + (filtre === 'obtenues' ? ' actif' : '')}
              onClick={() => setFiltre('obtenues')}>
              Obtenues ({[...(classe.features ?? []), ...(subclasse?.features ?? [])].filter(f => debloquees.has(f.id)).length})
            </button>
          </div>

          <div className="classe-features">
            {classe.features.filter(f => filtre === 'toutes' || debloquees.has(f.id)).map(listeFeature)}
            {filtre === 'obtenues' && !classe.features.some(f => debloquees.has(f.id)) && (
              <p className="feuille-note">Aucune compétence de classe obtenue pour l'instant.</p>
            )}
          </div>

          {subclasse && (
            <div className="classe-features classe-features--sub">
              <h4>{subclasse.nom}</h4>
              {subclasse.features.filter(f => filtre === 'toutes' || debloquees.has(f.id)).map(listeFeature)}
              {filtre === 'obtenues' && !subclasse.features.some(f => debloquees.has(f.id)) && (
                <p className="feuille-note">Aucune compétence de sous-classe obtenue pour l'instant.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SectionClasse({ fiche, modifier, characterId }) {
  const { classes, chargement: chargementClasses } = useClasses()
  const { debloquees, basculer } = useFeaturesDebloquees(characterId)

  if (chargementClasses) return <p className="feuille-note">Chargement des classes…</p>

  const niveau = fiche.level ?? 1
  const secondaireDebloquee = niveau >= 10

  return (
    <section className="feuille-bloc">
      <h2>Classe</h2>
      <BlocClasse
        titre="Classe principale"
        classeId={fiche.class_id} subclassId={fiche.subclass_id}
        onChoisirClasse={v => { modifier('class_id', v); modifier('subclass_id', null) }}
        onChoisirSubclasse={v => modifier('subclass_id', v)}
        classes={classes} fiche={fiche} modifier={modifier}
        debloquees={debloquees} basculer={basculer}
      />

      {secondaireDebloquee ? (
        <BlocClasse
          titre="Classe secondaire (multiclassage niv.10+)"
          classeId={fiche.class_secondaire_id} subclassId={fiche.subclass_secondaire_id}
          onChoisirClasse={v => { modifier('class_secondaire_id', v); modifier('subclass_secondaire_id', null) }}
          onChoisirSubclasse={v => modifier('subclass_secondaire_id', v)}
          classes={classes} fiche={fiche} modifier={modifier}
          debloquees={debloquees} basculer={basculer}
        />
      ) : (
        <p className="feuille-note">Une deuxième classe sera disponible à partir du niveau 10 (actuellement niveau {niveau}).</p>
      )}
    </section>
  )
}
