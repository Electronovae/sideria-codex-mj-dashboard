import React, { useEffect, useMemo, useRef, useState } from 'react'
import { chargerLocal, sauverLocal, exporterJson, importerJson, supabaseActif, pousserSupabase, tirerSupabase } from './lib/storage.js'
import { exporterObsidian } from './lib/obsidian.js'
import Tableau from './modules/Tableau.jsx'
import Pnjs from './modules/Pnjs.jsx'
import Joueurs from './modules/Joueurs.jsx'
import Factions from './modules/Factions.jsx'
import Evenements from './modules/Evenements.jsx'
import Campagnes from './modules/Campagnes.jsx'
import Frise from './modules/Frise.jsx'
import Codex from './modules/Codex.jsx'

export const Ctx = React.createContext(null)

const MODULES = [
  ['tableau', 'Tableau de bord', Tableau],
  ['campagnes', 'Méta & Campagnes', Campagnes],
  ['pnjs', 'PNJ & Arbres', Pnjs],
  ['joueurs', 'Joueurs', Joueurs],
  ['factions', 'Factions', Factions],
  ['evenements', 'Événements', Evenements],
  ['frise', 'Frise chronologique', Frise],
  ['codex', 'Codex', Codex],
]

export default function App() {
  const [univers, setUnivers] = useState(chargerLocal)
  const [onglet, setOnglet] = useState('tableau')
  const [statut, setStatut] = useState('local')
  const [idSupabase, setIdSupabase] = useState(null)
  const fichierRef = useRef(null)
  const minuteur = useRef(null)

  // Autosave local, 800 ms après la dernière modification.
  useEffect(() => {
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => { sauverLocal(univers); setStatut(s => s.startsWith('supabase') ? s : 'local ✓') }, 800)
    return () => clearTimeout(minuteur.current)
  }, [univers])

  // maj(fn) : toutes les mutations passent par là.
  const maj = (fn) => setUnivers(u => {
    const copie = structuredClone(u)
    fn(copie)
    return copie
  })

  const ctx = useMemo(() => ({ univers, maj, setOnglet }), [univers])

  const surImport = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    try { setUnivers(await importerJson(f)) } catch (err) { alert('Import impossible : ' + err.message) }
    e.target.value = ''
  }

  const pousser = async () => {
    try {
      setStatut('supabase…')
      const id = await pousserSupabase(univers, idSupabase)
      setIdSupabase(id)
      setStatut('supabase ✓')
    } catch (err) { setStatut('erreur'); alert('Supabase : ' + err.message) }
  }

  const tirer = async () => {
    try {
      const res = await tirerSupabase()
      if (!res) { alert('Aucun univers sur Supabase.'); return }
      if (!confirm('Remplacer l\u2019univers local par la version Supabase ?')) return
      setIdSupabase(res.id)
      setUnivers(res.univers)
      setStatut('supabase ✓')
    } catch (err) { alert('Supabase : ' + err.message) }
  }

  const Module = MODULES.find(([id]) => id === onglet)[2]

  return (
    <Ctx.Provider value={ctx}>
      <header>
        <h1>Sidéria Studio</h1>
        <span className="statut">sauvegarde : {statut}</span>
        <span className="sep" />
        <button className="btn" onClick={() => exporterJson(univers)}>Exporter JSON</button>
        <button className="btn" onClick={() => fichierRef.current.click()}>Importer JSON</button>
        <button className="btn" onClick={() => exporterObsidian(univers)}>Export Obsidian (.zip)</button>
        {supabaseActif() && <>
          <button className="btn plein" onClick={pousser}>Pousser vers Supabase</button>
          <button className="btn" onClick={tirer}>Tirer depuis Supabase</button>
        </>}
        {!supabaseActif() && <span className="statut" title="Renseigner .env pour activer">Supabase : non configuré</span>}
        <input ref={fichierRef} type="file" accept=".json" style={{ display: 'none' }} onChange={surImport} />
      </header>
      <nav>
        {MODULES.map(([id, titre]) => (
          <button key={id} className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)}>{titre}</button>
        ))}
      </nav>
      <main><Module /></main>
    </Ctx.Provider>
  )
}
