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
import Graphe from './modules/Graphe.jsx'
import Lieux from './modules/Lieux.jsx'
import Bestiaire from './modules/Bestiaire.jsx'
import Recherche from './modules/Recherche.jsx'
import Rapports from './modules/Rapports.jsx'
import Wiki from './modules/Wiki.jsx'

export const Ctx = React.createContext(null)

// Ordre pensé comme un parcours plutôt qu'une liste plate de features :
// 1) vue d'ensemble → 2) contenu de l'univers → 3) suivi de partie.
// SEPARATEURS_APRES marque les ids après lesquels une séparation visuelle apparaît dans la nav.
const MODULES = [
  ['tableau', 'Tableau de bord', Tableau],
  ['codex', 'Codex', Codex],
  ['graphe', 'Graphe', Graphe],
  ['factions', 'Factions', Factions],
  ['lieux', 'Lieux', Lieux],
  ['pnjs', 'PNJ & Arbres', Pnjs],
  ['bestiaire', 'Bestiaire', Bestiaire],
  ['wiki', 'Classes', Wiki],
  ['campagnes', 'Méta & Campagnes', Campagnes],
  ['evenements', 'Événements', Evenements],
  ['joueurs', 'Joueurs', Joueurs],
  ['frise', 'Frise chronologique', Frise],
  ['rapports', 'Rapports', Rapports],
]
const SEPARATEURS_APRES = new Set(['graphe', 'wiki'])

export default function App({ deconnexion }) {
  const [univers, setUnivers] = useState(chargerLocal)
  const [onglet, setOnglet] = useState('tableau')
  const [codexCible, setCodexCible] = useState(null)
  const [scinde, setScinde] = useState(false)
  const [ongletB, setOngletB] = useState('graphe')
  const [codexCibleB, setCodexCibleB] = useState(null)
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('sideria-theme') || 'clair' } catch { return 'clair' } })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('sideria-theme', theme) } catch {}
  }, [theme])
  const [statut, setStatut] = useState('local')
  const fichierRef = useRef(null)
  const minuteur = useRef(null)

  // Autosave local (800 ms) puis Supabase (30 s) après la dernière modification.
  const minuteurSb = useRef(null)
  useEffect(() => {
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => { sauverLocal(univers); setStatut(s => s.startsWith('supabase') ? s : 'local ✓') }, 800)
    if (supabaseActif()) {
      clearTimeout(minuteurSb.current)
      minuteurSb.current = setTimeout(async () => {
        try {
          setStatut('supabase…')
          await pousserSupabase(univers)
          setStatut('supabase ✓ ' + new Date().toLocaleTimeString())
        } catch (err) { setStatut('supabase : erreur (' + (err.message || '?') + ')') }
      }, 30000)
    }
    return () => { clearTimeout(minuteur.current); clearTimeout(minuteurSb.current) }
  }, [univers])

  // maj(fn) : toutes les mutations passent par là (avec historique pour Ctrl+Z).
  const passe = useRef([]), futur = useRef([])
  const maj = (fn) => setUnivers(u => {
    passe.current.push(u)
    if (passe.current.length > 50) passe.current.shift()
    futur.current = []
    const copie = structuredClone(u)
    fn(copie)
    return copie
  })
  const [recherche, setRecherche] = useState(false)
  useEffect(() => {
    const clavier = (e) => {
      const dansChamp = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setRecherche(v => !v)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !dansChamp) {
        e.preventDefault()
        if (e.shiftKey) {
          if (futur.current.length) setUnivers(u => { passe.current.push(u); return futur.current.pop() })
        } else if (passe.current.length) {
          setUnivers(u => { futur.current.push(u); return passe.current.pop() })
        }
      }
    }
    window.addEventListener('keydown', clavier)
    return () => window.removeEventListener('keydown', clavier)
  }, [])

  const ctx = useMemo(() => ({ univers, maj, setOnglet, codexCible, setCodexCible }), [univers, codexCible])
  const ctxB = useMemo(() => ({ univers, maj, setOnglet: setOngletB, codexCible: codexCibleB, setCodexCible: setCodexCibleB }), [univers, codexCibleB])

  const surImport = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    try { setUnivers(await importerJson(f)) } catch (err) { alert('Import impossible : ' + err.message) }
    e.target.value = ''
  }

  const pousser = async () => {
    try {
      setStatut('supabase…')
      await pousserSupabase(univers)
      setStatut('supabase ✓')
    } catch (err) { setStatut('erreur'); alert('Supabase : ' + err.message) }
  }

  const tirer = async () => {
    try {
      const nouvelUnivers = await tirerSupabase()
      if (!confirm('Remplacer l\u2019univers local par la version Supabase ?')) return
      setUnivers(nouvelUnivers)
      setStatut('supabase ✓')
    } catch (err) { alert('Supabase : ' + err.message) }
  }

  const Module = MODULES.find(([id]) => id === onglet)[2]
  const ModuleB = MODULES.find(([id]) => id === ongletB)?.[2] || Module

  return (
    <Ctx.Provider value={ctx}>
      <header>
        <h1>Sidéria Studio</h1>
        <span className="statut">sauvegarde : {statut}</span>
        <span className="sep" />
        <button className="btn" onClick={() => setTheme(th => th === 'clair' ? 'sombre' : 'clair')}>
          {theme === 'clair' ? 'Mode sombre' : 'Mode clair'}</button>
        <button className={'btn' + (scinde ? ' plein' : '')} onClick={() => setScinde(v => !v)}>
          {scinde ? '◨ Quitter l\u2019écran scindé' : '◨ Écran scindé'}</button>
        <button className="btn" onClick={() => exporterJson(univers)}>Exporter JSON</button>
        <button className="btn" onClick={() => fichierRef.current.click()}>Importer JSON</button>
        <button className="btn" onClick={() => exporterObsidian(univers)}>Export Obsidian (.zip)</button>
        {supabaseActif() && <>
          <button className="btn plein" onClick={pousser}>Pousser vers Supabase</button>
          <button className="btn" onClick={tirer}>Tirer depuis Supabase</button>
        </>}
        {!supabaseActif() && <span className="statut" title="Renseigner .env pour activer">Supabase : non configuré</span>}
        {deconnexion && <button className="btn" onClick={deconnexion} style={{ marginLeft: 'auto' }}>Se déconnecter</button>}
        <input ref={fichierRef} type="file" accept=".json" style={{ display: 'none' }} onChange={surImport} />
      </header>
      {!scinde && (
        <nav>
          {MODULES.map(([id, titre]) => (
            <React.Fragment key={id}>
              <button className={onglet === id ? 'actif' : ''} onClick={() => setOnglet(id)}>{titre}</button>
              {SEPARATEURS_APRES.has(id) && <span className="nav-sep" />}
            </React.Fragment>
          ))}
        </nav>
      )}
      {!scinde ? (
        <main><Module /></main>
      ) : (
        <main className="scinde">
          <section className="panneau">
            <div className="barre-panneau">
              <select value={onglet} onChange={e => setOnglet(e.target.value)}>
                {MODULES.map(([id, titre]) => <option key={id} value={id}>{titre}</option>)}
              </select>
            </div>
            <div className="contenu-panneau"><Module /></div>
          </section>
          <section className="panneau">
            <div className="barre-panneau">
              <select value={ongletB} onChange={e => setOngletB(e.target.value)}>
                {MODULES.map(([id, titre]) => <option key={id} value={id}>{titre}</option>)}
              </select>
            </div>
            <div className="contenu-panneau">
              <Ctx.Provider value={ctxB}><ModuleB /></Ctx.Provider>
            </div>
          </section>
        </main>
      )}
      {recherche && <Recherche fermer={() => setRecherche(false)} />}
    </Ctx.Provider>
  )
}
