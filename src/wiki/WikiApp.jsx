import React, { useState } from 'react'
import { useClasses } from '../fiches/useClasses.js'
import { usePeuples, useHistoriques, useDons, useObjets, useServices, useRegles } from './useWikiData.js'
import Accueil from './Accueil.jsx'
import ListeClasses from './ListeClasses.jsx'
import FicheClasse from './FicheClasse.jsx'
import PageCaracteristiques from './PageCaracteristiques.jsx'
import Origines from './Origines.jsx'
import Dons from './Dons.jsx'
import Equipement from './Equipement.jsx'
import Progression from './Progression.jsx'
import './wiki.css'

export default function WikiApp() {
  const { classes, chargement } = useClasses()
  const { peuples, chargement: chargementPeuples } = usePeuples()
  const { historiques, chargement: chargementHistoriques } = useHistoriques()
  const { dons, chargement: chargementDons } = useDons()
  const { objets, chargement: chargementObjets } = useObjets()
  const { services, chargement: chargementServices } = useServices()
  const { regles, chargement: chargementRegles } = useRegles()
  const [vue, setVue] = useState('accueil') // 'accueil' | 'classes' | 'fiche' | 'caracteristiques' | 'origines' | 'dons' | 'equipement' | 'progression'
  const [selId, setSelId] = useState(null)
  const classe = classes.find(c => c.id === selId)

  const naviguer = (cible) => {
    if (cible === 'fiches' || cible === 'connexion') { window.location.href = '/fiches'; return }
    setVue(cible)
  }

  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement du codex…</p></div>
  }

  return (
    <div className="wiki-app">
      {vue === 'accueil' && <Accueil onNaviguer={naviguer} />}
      {vue === 'classes' && !classe && (
        <>
          <button className="wiki-retour" style={{ marginLeft: 16, marginTop: 12 }} onClick={() => setVue('accueil')}>
            ← Accueil
          </button>
          <ListeClasses classes={classes} onSelect={id => { setSelId(id); setVue('fiche') }} />
        </>
      )}
      {vue === 'fiche' && classe && (
        <FicheClasse classe={classe} onRetour={() => { setSelId(null); setVue('classes') }} />
      )}
      {vue === 'caracteristiques' && (
        <PageCaracteristiques onRetour={() => setVue('accueil')} />
      )}
      {vue === 'origines' && (
        <Origines peuples={peuples} historiques={historiques}
          chargement={chargementPeuples || chargementHistoriques} onRetour={() => setVue('accueil')} />
      )}
      {vue === 'dons' && (
        <Dons dons={dons} chargement={chargementDons} onRetour={() => setVue('accueil')} />
      )}
      {vue === 'equipement' && (
        <Equipement objets={objets} services={services}
          chargement={chargementObjets || chargementServices} onRetour={() => setVue('accueil')} />
      )}
      {vue === 'progression' && (
        <Progression regles={regles} chargement={chargementRegles} onRetour={() => setVue('accueil')} />
      )}
    </div>
  )
}

