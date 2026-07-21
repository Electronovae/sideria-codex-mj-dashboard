import React, { useState } from 'react'
import { useStudio } from './communs.jsx'
import { fmtDate } from '../lib/calendrier.js'

// Le Codex : l'Obsidian embarqué. Chaque entité saisie dans le Studio a sa page,
// naviguable par liens, avec les vues agrégées par faction, arc, PNJ, PJ.
export default function Codex() {
  const { univers, codexCible, setCodexCible } = useStudio()
  const [page, setPage] = useState({ type: 'accueil' })
  React.useEffect(() => {
    if (codexCible) { setPage(codexCible); setCodexCible(null) }
  }, [codexCible])
  const L = ({ type, id, children }) => (
    <span onClick={() => setPage({ type, id })}
      style={{ color: '#7a5c14', cursor: 'pointer', borderBottom: '1px dashed #c9a227' }}>{children}</span>
  )
  const f = id => univers.factions.find(x => x.id === id)
  const pnj = id => univers.pnjs.find(x => x.id === id)

  const sections = [
    ['Factions', 'faction', univers.factions, x => x.nom],
    ['Campagnes', 'campagne', univers.campagnes, x => (x.code ? x.code + ' · ' : '') + x.titre],
    ['Arcs', 'arc', univers.arcs, x => x.nom],
    ['PNJ', 'pnj', [...univers.pnjs].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), x => x.nom],
    ['PJ', 'pj', univers.joueurs, x => x.personnage],
    ['Événements', 'evenement', [...univers.evenements].sort((a, b) => a.debut - b.debut), x => x.titre],
  ]

  const Bloc = ({ titre, children }) => <><h3>{titre}</h3>{children}</>

  function Page() {
    const { type, id } = page
    if (type === 'faction') {
      const x = f(id); if (!x) return null
      const membres = univers.pnjs.filter(p => p.faction === id)
      const pjs = univers.joueurs.filter(j => j.faction === id)
      const evts = univers.evenements.filter(e => e.factionId === id).sort((a, b) => a.debut - b.debut)
      const camps = univers.campagnes.filter(c => c.factionId === id)
      return <>
        <h2><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: x.couleur, marginRight: 8 }} />{x.nom}</h2>
        {x.devise && <p style={{ fontStyle: 'italic' }}>« {x.devise} »</p>}
        <p>{x.description}</p>
        {x.chefIds.length > 0 && <Bloc titre="Direction">{x.chefIds.map(cid => pnj(cid)).filter(Boolean)
          .map(c => <div key={c.id}><L type="pnj" id={c.id}>{c.nom}</L> : {c.role}</div>)}</Bloc>}
        {membres.length > 0 && <Bloc titre="Membres">{membres.map(m =>
          <div key={m.id}><L type="pnj" id={m.id}>{m.nom}</L>{m.role && <> : {m.role}</>}</div>)}</Bloc>}
        {pjs.length > 0 && <Bloc titre="PJ affiliés">{pjs.map(j =>
          <div key={j.id}><L type="pj" id={j.id}>{j.personnage}</L> ({j.joueur})</div>)}</Bloc>}
        {camps.length > 0 && <Bloc titre="Campagnes">{camps.map(c =>
          <div key={c.id}><L type="campagne" id={c.id}>{c.titre}</L> (Saison {c.saison})</div>)}</Bloc>}
        {evts.length > 0 && <Bloc titre="Événements">{evts.map(e =>
          <div key={e.id}><strong>{fmtDate(e.debut)}</strong> · <L type="evenement" id={e.id}>{e.titre}</L></div>)}</Bloc>}
        {x.objectifs && <Bloc titre="Objectifs"><p>{x.objectifs}</p></Bloc>}
        {x.ressources && <Bloc titre="Ressources"><p>{x.ressources}</p></Bloc>}
      </>
    }
    if (type === 'pnj') {
      const x = pnj(id); if (!x) return null
      const evts = univers.evenements.filter(e => e.participants.includes(id)).sort((a, b) => a.debut - b.debut)
      const camps = univers.campagnes.filter(c => c.pnjIds.includes(id))
      const dirs = univers.factions.filter(fa => fa.chefIds.includes(id))
      const inters = univers.joueurs.flatMap(j => j.interactions.filter(i => i.pnjId === id).map(i => ({ ...i, j })))
      return <>
        <h2>{x.nom}</h2>
        <p style={{ color: 'var(--gris)', fontStyle: 'italic' }}>{x.role}
          {x.faction && <> · <L type="faction" id={x.faction}>{f(x.faction)?.nom}</L></>}
          {dirs.map(d => <span key={d.id}> · dirige <L type="faction" id={d.id}>{d.nom}</L></span>)}</p>
        <p>{x.description}</p>
        {x.repliques.length > 0 && <Bloc titre="Répliques">{x.repliques.filter(Boolean).map((r, i) =>
          <p key={i} style={{ borderLeft: '3px solid var(--or)', paddingLeft: 8, fontStyle: 'italic' }}>{r}</p>)}</Bloc>}
        {x.arbre && <Bloc titre="Arbre narratif"><p>{x.arbre.compteur.nom} ({x.arbre.compteur.min} à {x.arbre.compteur.max},
          départ {x.arbre.compteur.initial}) · {x.arbre.noeuds.length} nœuds, {x.arbre.transitions.length} transitions.
          Édition et aperçu dans l'onglet PNJ.</p></Bloc>}
        {x.secrets && <div className="carte" style={{ borderLeftColor: 'var(--rouge)' }}>
          <label>Secrets Maître</label><p>{x.secrets}</p></div>}
        {(evts.length + camps.length + inters.length) > 0 && <Bloc titre="Apparaît dans">
          {camps.map(c => <div key={c.id}>Campagne · <L type="campagne" id={c.id}>{c.titre}</L></div>)}
          {evts.map(e => <div key={e.id}>{fmtDate(e.debut)} · <L type="evenement" id={e.id}>{e.titre}</L></div>)}
          {inters.map((i, k) => <div key={k}>Interaction avec <L type="pj" id={i.j.id}>{i.j.personnage}</L>
            {i.date != null && <> ({fmtDate(i.date)})</>} : {i.resume}</div>)}
        </Bloc>}
      </>
    }
    if (type === 'pj') {
      const x = univers.joueurs.find(j => j.id === id); if (!x) return null
      const reps = Object.entries(x.reputations || {}).filter(([, v]) => v !== 0)
      return <>
        <h2>{x.personnage}</h2>
        <p style={{ color: 'var(--gris)', fontStyle: 'italic' }}>{x.joueur} · {x.classe || 'classe ?'} niv. {x.niveau}
          {x.faction && <> · <L type="faction" id={x.faction}>{f(x.faction)?.nom}</L></>}</p>
        <p>{x.notes}</p>
        {reps.length > 0 && <Bloc titre="Réputations">{reps.map(([fid, v]) =>
          <div key={fid}><L type="faction" id={fid}>{f(fid)?.nom || fid}</L> : {v > 0 ? '+' : ''}{v}</div>)}</Bloc>}
        {x.interactions.length > 0 && <Bloc titre="Journal des interactions">{x.interactions.map((i, k) =>
          <div key={k}>{i.date != null && <strong>{fmtDate(i.date)} · </strong>}
            {pnj(i.pnjId) ? <L type="pnj" id={i.pnjId}>{pnj(i.pnjId).nom}</L> : '?'} : {i.resume}
            {i.effet && <em> ({i.effet})</em>}</div>)}</Bloc>}
      </>
    }
    if (type === 'campagne') {
      const x = univers.campagnes.find(c => c.id === id); if (!x) return null
      const evts = univers.evenements.filter(e => e.campagneId === id).sort((a, b) => a.debut - b.debut)
      return <>
        <h2>{x.code && x.code + ' : '}{x.titre}</h2>
        <p style={{ color: 'var(--gris)' }}>
          {x.factionId && <><L type="faction" id={x.factionId}>{f(x.factionId)?.nom}</L> · </>}
          Saison {x.saison} · départ {x.depart} · {x.duree || '?'} sessions · niveaux {x.niveaux || '?'}</p>
        {x.ton && <p style={{ fontStyle: 'italic' }}>{x.ton}</p>}
        <p>{x.pitch}</p>
        {x.actes.map((a, i) => <div className="carte" key={a.id}>
          <strong>Acte {i + 1}{a.titre && ' : ' + a.titre}</strong>
          <p>{a.resume}</p>
          {a.pivot && <p><em>Point pivot : {a.pivot}</em></p>}</div>)}
        {(x.sessions || []).length > 0 && <Bloc titre="Sessions">{x.sessions.map(s => {
          const es = univers.evenements.filter(e => e.sessionId === s.id).sort((a, b) => a.debut - b.debut)
          return <div className="carte" key={s.id}>
            <strong>{s.code ? s.code + ' · ' : ''}{s.titre}</strong>
            {s.date != null && <span className="aide"> · {fmtDate(s.date)}</span>}
            {s.resume && <p>{s.resume}</p>}
            {es.map(e => <div key={e.id} style={{ paddingLeft: 10 }}>· <L type="evenement" id={e.id}>{e.titre}</L></div>)}
          </div>
        })}</Bloc>}
        {x.pnjIds.length > 0 && <Bloc titre="PNJ clés">{x.pnjIds.map(pid => pnj(pid)).filter(Boolean)
          .map(p => <span key={p.id} style={{ marginRight: 12 }}><L type="pnj" id={p.id}>{p.nom}</L></span>)}</Bloc>}
        {evts.length > 0 && <Bloc titre="Autres événements de la campagne">{evts.filter(e => !e.sessionId).map(e =>
          <div key={e.id}>{fmtDate(e.debut)} · <L type="evenement" id={e.id}>{e.titre}</L></div>)}</Bloc>}
        {x.issues && <Bloc titre="Issues possibles"><p>{x.issues}</p></Bloc>}
      </>
    }
    if (type === 'arc') {
      const x = univers.arcs.find(a => a.id === id); if (!x) return null
      const evts = univers.evenements.filter(e => e.arcId === id).sort((a, b) => a.debut - b.debut)
      const persos = [...new Set(evts.flatMap(e => e.participants))].map(pid => pnj(pid)).filter(Boolean)
      return <>
        <h2><span style={{ display: 'inline-block', width: 14, height: 14, background: x.couleur, marginRight: 8 }} />{x.nom}</h2>
        <p style={{ color: 'var(--gris)' }}>{fmtDate(x.debut, 'an')} → {fmtDate(x.fin, 'an')}</p>
        <p>{x.description}</p>
        <Bloc titre="Événements de l'arc">{evts.length ? evts.map(e =>
          <div key={e.id}>{fmtDate(e.debut)} · <L type="evenement" id={e.id}>{e.titre}</L></div>)
          : <p className="aide">Aucun. Rattache des événements à cet arc dans l'onglet Événements.</p>}</Bloc>
        {persos.length > 0 && <Bloc titre="Personnages impliqués">{persos.map(p =>
          <span key={p.id} style={{ marginRight: 12 }}><L type="pnj" id={p.id}>{p.nom}</L></span>)}</Bloc>}
      </>
    }
    if (type === 'evenement') {
      const x = univers.evenements.find(e => e.id === id); if (!x) return null
      return <>
        <h2>{x.titre}</h2>
        <p style={{ color: 'var(--gris)' }}>{fmtDate(x.debut)}{x.fin != null && <> → {fmtDate(x.fin)}</>}
          {x.arcId && univers.arcs.find(a => a.id === x.arcId) &&
            <> · arc <L type="arc" id={x.arcId}>{univers.arcs.find(a => a.id === x.arcId).nom}</L></>}
          {x.factionId && <> · <L type="faction" id={x.factionId}>{f(x.factionId)?.nom}</L></>}
          {x.campagneId && univers.campagnes.find(c => c.id === x.campagneId) &&
            <> · campagne <L type="campagne" id={x.campagneId}>{univers.campagnes.find(c => c.id === x.campagneId).titre}</L></>}</p>
        <p>{x.desc}</p>
        {x.participants.length > 0 && <Bloc titre="Participants">{x.participants.map(pid => pnj(pid)).filter(Boolean)
          .map(p => <span key={p.id} style={{ marginRight: 12 }}><L type="pnj" id={p.id}>{p.nom}</L></span>)}</Bloc>}
      </>
    }
    return <>
      <h2>Codex</h2>
      <p>Tout ce que tu saisis dans le Studio devient une page ici, liée au reste, comme dans Obsidian.
      La page d'une faction agrège sa direction, ses membres, ses PJ, ses campagnes et ses événements.
      Celle d'un PNJ liste partout où il apparaît, y compris le journal des PJ. Clique sur n'importe quel
      nom souligné pour naviguer.</p>
      <p className="aide">Le bouton "Export Obsidian (.zip)" de la barre du haut génère la version fichiers
      de ces pages, à fusionner dans le vrai vault.</p>
    </>
  }

  return <>
    <div className="liste">
      {sections.map(([titre, type, items, libelle]) => <div key={type}>
        <div style={{ padding: '8px 14px 2px', font: '700 10px monospace', letterSpacing: '.15em', color: 'var(--gris)', textTransform: 'uppercase' }}>{titre} ({items.length})</div>
        {items.map(it => <div key={it.id} className={'item' + (page.type === type && page.id === it.id ? ' sel' : '')}
          onClick={() => setPage({ type, id: it.id })} style={{ paddingLeft: 22 }}>{libelle(it)}</div>)}
      </div>)}
    </div>
    <div className="fiche"><Page /></div>
  </>
}
