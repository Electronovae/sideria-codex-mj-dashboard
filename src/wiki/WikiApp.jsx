import React, { useState } from 'react'
import { useClasses } from '../fiches/useClasses.js'
import Accueil from './Accueil.jsx'
import ListeClasses from './ListeClasses.jsx'
import FicheClasse from './FicheClasse.jsx'
import './wiki.css'

export default function WikiApp() {
  const { classes, chargement } = useClasses()
  const [vue, setVue] = useState('accueil') // 'accueil' | 'classes' | 'fiche'
  const [selId, setSelId] = useState(null)
  const classe = classes.find(c => c.id === selId)

  const naviguer = (cible) => {
    if (cible === 'fiches') { window.location.href = '/fiches'; return }
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
    </div>
  )
}
