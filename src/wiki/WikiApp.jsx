import React, { useState } from 'react'
import { useClasses } from '../fiches/useClasses.js'
import ListeClasses from './ListeClasses.jsx'
import FicheClasse from './FicheClasse.jsx'
import './wiki.css'

export default function WikiApp() {
  const { classes, chargement } = useClasses()
  const [selId, setSelId] = useState(null)
  const classe = classes.find(c => c.id === selId)

  if (chargement) {
    return <div className="wiki-page"><p className="wiki-vide">Chargement du codex…</p></div>
  }

  return (
    <div className="wiki-app">
      {classe
        ? <FicheClasse classe={classe} onRetour={() => setSelId(null)} />
        : <ListeClasses classes={classes} onSelect={setSelId} />}
    </div>
  )
}
