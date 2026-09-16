import React, { useEffect, useState } from 'react'
import { useStudio, Champ, SelecteurFaction, ListeFiche, DateSiderienne, Texte } from './communs.jsx'
import { nouveauJoueur, nouvelleEntreeHistorique, TYPES_HISTORIQUE } from '../lib/modele.js'
import { fmtDate } from '../lib/calendrier.js'
import { supabase } from '../lib/supabase.js'
import {
  modificateur, lancerPvNiveau, lancerFragments, deFragments, quotaSorts, PALIERS_MONTEE,
} from '../fiches/modeleFiche.js'

// Lien de référence vers la vraie fiche technique du joueur (tables Player/characters de Romain,
// jamais modifiées ici : lecture seule). On stocke juste characterId sur le PJ du Studio.
let CACHE_CLASSES = null
function nomClasse(id, subId) {
  if (!CACHE_CLASSES || !id) return null
  const c = CACHE_CLASSES.find(x => x.id === id)
  if (!c) return null
  const s = subId ? c.subclasses?.find(x => x.id === subId) : null
  return s ? `${c.nom} · ${s.nom}` : c.nom
}

function LienFicheJoueur({ joueur, modifier }) {
  const [options, setOptions] = useState(null)

  useEffect(() => {
    if (!supabase) return
    if (!CACHE_CLASSES) {
      supabase.from('classes_sideria').select('id, nom, subclasses_sideria(id, nom)').then(({ data }) => {
        CACHE_CLASSES = (data || []).map(c => ({ ...c, subclasses: c.subclasses_sideria }))
      })
    }
    supabase.from('characters').select('id, name, level').order('name').then(({ data }) => setOptions(data || []))
  }, [])

  // Dès qu'un characterId est renseigné, on synchronise personnage/joueur/classe/niveau depuis
  // la vraie fiche : le reste de l'appli (Codex, Graphe, Frise, Recherche, export Obsidian, Supabase)
  // continue de lire ces champs normalement, sans rien savoir du lien.
  useEffect(() => {
    if (!supabase || !joueur.characterId) return
    let annule = false
    Promise.all([
      supabase.from('characters').select('name, level, class_id, subclass_id').eq('id', joueur.characterId).maybeSingle(),
      supabase.from('Player').select('name_player').eq('character_id', joueur.characterId).maybeSingle(),
    ]).then(([{ data: perso }, { data: pl }]) => {
      if (annule || !perso) return
      modifier(x => {
        x.personnage = perso.name
        x.niveau = perso.level
        x.classe = nomClasse(perso.class_id, perso.subclass_id) || x.classe
        if (pl?.name_player) x.joueur = pl.name_player
      })
    })
    return () => { annule = true }
  }, [joueur.characterId])

  if (!supabase) return null

  return (
    <div className="carte" style={{ marginBottom: 16 }}>
      <label>Fiche technique liée</label>
      <select value={joueur.characterId || ''} onChange={e => modifier(x => { x.characterId = e.target.value || null })}>
        <option value="">— non liée —</option>
        {(options || []).map(c => <option key={c.id} value={c.id}>{c.name} (niv. {c.level})</option>)}
      </select>
      {joueur.characterId
        ? <p className="aide" style={{ marginTop: 6 }}>Synchronisé depuis la fiche du joueur. <a href="/fiches" target="_blank" rel="noreferrer">ouvrir les fiches ↗</a></p>
        : <p className="aide" style={{ marginTop: 6 }}>Sélectionne la fiche du joueur pour remplir automatiquement son nom, sa classe et son niveau.</p>}
    </div>
  )
}


const CHAMPS_PROGRESSION = 'id, name, level, hp_max, hp_current, hit_dice_remaining, stats, class_id, fragments_current, fragments_max, sorts_connus, sorts_bonus, historique_niveaux'

// Progression d'un personnage joueur, gérée par le MJ : montée de niveau (PV, fragments,
// sorts), fragments ponctuels et sorts bonus. Écrit directement sur la vraie fiche `characters`
// en relisant la ligne juste avant chaque écriture pour ne rien écraser.
function PanneauProgression({ characterId, surNiveau }) {
  const [perso, setPerso] = useState(null)
  const [classe, setClasse] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [occupe, setOccupe] = useState(false)
  const [montee, setMontee] = useState(null) // { pv, dePv, fragments } en cours de préparation
  const [fragmentsDon, setFragmentsDon] = useState(1)
  const [motifDon, setMotifDon] = useState('')

  const charger = async () => {
    const { data, error } = await supabase.from('characters').select(CHAMPS_PROGRESSION).eq('id', characterId).maybeSingle()
    if (error) { setErreur(error.message); return null }
    setPerso(data)
    if (data?.class_id) {
      const { data: c } = await supabase.from('classes_sideria')
        .select('id, nom, de_vie, fragments_cadence, sorts_max_depart, sorts_intervalle_niveaux').eq('id', data.class_id).maybeSingle()
      setClasse(c || null)
    } else setClasse(null)
    return data
  }

  useEffect(() => { setMontee(null); setErreur(null); charger() }, [characterId])

  // Relit la fiche, calcule le patch à partir de la version fraîche, écrit, recharge.
  const appliquer = async (calculerPatch) => {
    setOccupe(true)
    setErreur(null)
    const { data: frais, error: errLecture } = await supabase.from('characters').select(CHAMPS_PROGRESSION).eq('id', characterId).single()
    if (errLecture) { setErreur(errLecture.message); setOccupe(false); return false }
    const patch = calculerPatch(frais)
    if (!patch) { setOccupe(false); return false }
    const { error } = await supabase.from('characters').update(patch).eq('id', characterId)
    if (error) { setErreur(error.message); setOccupe(false); return false }
    const maj = await charger()
    if (maj && patch.level !== undefined) surNiveau?.(maj.level)
    setOccupe(false)
    return true
  }

  if (erreur && !perso) return <div className="carte"><p className="aide" style={{ color: 'var(--rouge)' }}>{erreur}</p></div>
  if (!perso) return <div className="carte"><p className="aide">Chargement de la progression…</p></div>

  const deVie = classe?.de_vie ?? 8
  const con = perso.stats?.con
  const niveau = perso.level ?? 1
  const connus = (perso.sorts_connus || []).length
  const quota = quotaSorts(classe, perso)
  const quotaSuivant = quotaSorts(classe, { ...perso, level: niveau + 1 })
  const fr = deFragments(classe)
  const journal = Array.isArray(perso.historique_niveaux) ? perso.historique_niveaux : []
  const derniereMontee = [...journal].reverse().find(e => e.type === 'niveau')

  const preparerMontee = () => {
    const r = lancerPvNiveau(deVie, con)
    setMontee({ pv: r.total, dePv: r.de, fragments: lancerFragments(classe) })
  }
  const relancerPv = () => { const r = lancerPvNiveau(deVie, con); setMontee(m => ({ ...m, pv: r.total, dePv: r.de })) }
  const relancerFragments = () => setMontee(m => ({ ...m, fragments: lancerFragments(classe) }))

  const validerMontee = async () => {
    const pv = Math.max(0, Number(montee.pv) || 0)
    const fragments = Math.max(0, Number(montee.fragments) || 0)
    const ok = await appliquer(f => ({
      level: (f.level ?? 1) + 1,
      hp_max: (f.hp_max ?? 0) + pv,
      hp_current: (f.hp_current ?? 0) + pv,
      hit_dice_remaining: (f.hit_dice_remaining ?? 0) + 1,
      fragments_current: (f.fragments_current ?? 0) + fragments,
      fragments_max: (f.fragments_max ?? 0) + fragments,
      historique_niveaux: [...(f.historique_niveaux || []), {
        type: 'niveau', id: crypto.randomUUID(), date: new Date().toISOString(),
        de: (f.level ?? 1), vers: (f.level ?? 1) + 1, pv, fragments,
      }],
    }))
    if (ok) setMontee(null)
  }

  const annulerMontee = () => {
    if (!derniereMontee || !confirm(`Annuler le passage au niveau ${derniereMontee.vers} (−${derniereMontee.pv} PV, −${derniereMontee.fragments} fragments) ?`)) return
    appliquer(f => {
      const entree = [...(f.historique_niveaux || [])].reverse().find(e => e.type === 'niveau')
      if (!entree) return null
      return {
        level: Math.max(1, (f.level ?? 1) - 1),
        hp_max: Math.max(1, (f.hp_max ?? 0) - entree.pv),
        hp_current: Math.max(0, Math.min((f.hp_current ?? 0) - entree.pv, (f.hp_max ?? 0) - entree.pv)),
        hit_dice_remaining: Math.max(0, (f.hit_dice_remaining ?? 1) - 1),
        fragments_current: Math.max(0, (f.fragments_current ?? 0) - entree.fragments),
        fragments_max: Math.max(0, (f.fragments_max ?? 0) - entree.fragments),
        historique_niveaux: (f.historique_niveaux || []).filter(e => e.id !== entree.id),
      }
    })
  }

  const donnerFragments = async () => {
    const n = Number(fragmentsDon) || 0
    if (!n) return
    const ok = await appliquer(f => ({
      fragments_current: Math.max(0, (f.fragments_current ?? 0) + n),
      fragments_max: Math.max(0, (f.fragments_max ?? 0) + Math.max(0, n)),
      historique_niveaux: [...(f.historique_niveaux || []), {
        type: 'fragments', id: crypto.randomUUID(), date: new Date().toISOString(),
        niveau: f.level ?? 1, fragments: n, motif: motifDon.trim(),
      }],
    }))
    if (ok) { setMotifDon(''); setFragmentsDon(1) }
  }

  const changerBonusSorts = (delta) => appliquer(f => ({ sorts_bonus: Math.max(0, (f.sorts_bonus ?? 0) + delta) }))

  const paliersAtteints = PALIERS_MONTEE.includes(niveau + 1)

  return (
    <div className="carte" style={{ marginBottom: 16 }}>
      <label>Progression (fiche technique)</label>
      <div className="rangee" style={{ gap: 18, flexWrap: 'wrap', margin: '6px 0 10px' }}>
        <span><strong style={{ fontSize: '1.6em' }}>{niveau}</strong> <span className="aide">niveau</span></span>
        <span><strong>{perso.hp_current ?? 0} / {perso.hp_max ?? 0}</strong> <span className="aide">PV (d{deVie}, CON {modificateur(con) >= 0 ? '+' : ''}{modificateur(con)})</span></span>
        <span><strong>{perso.fragments_current ?? 0}</strong> <span className="aide">fragments ({perso.fragments_max ?? 0} gagnés)</span></span>
        <span><strong style={{ color: connus > quota ? 'var(--rouge)' : undefined }}>{connus} / {quota}</strong> <span className="aide">sorts connus</span></span>
      </div>
      {!classe && <p className="aide">Aucune classe sur la fiche : dé de vie d8 et 1d4 fragments par défaut.</p>}

      {!montee ? (
        <div className="rangee" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn plein" disabled={occupe} onClick={preparerMontee}>Monter au niveau {niveau + 1}</button>
          {derniereMontee && (
            <button className="btn clair" disabled={occupe} onClick={annulerMontee}>Annuler le passage au niveau {derniereMontee.vers}</button>
          )}
        </div>
      ) : (
        <div className="carte" style={{ borderColor: 'var(--or)' }}>
          <h3 style={{ marginTop: 0 }}>Niveau {niveau} vers {niveau + 1}</h3>
          <div className="rangee" style={{ gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
            <span className="etroit"><label>PV gagnés</label>
              <input type="number" min="0" value={montee.pv} onChange={e => setMontee(m => ({ ...m, pv: e.target.value }))} /></span>
            <span className="aide">d{deVie} = {montee.dePv}, {modificateur(con) >= 0 ? '+' : '−'} {Math.abs(modificateur(con))} CON, minimum 1</span>
            <button className="btn clair etroit" onClick={relancerPv}>Relancer</button>
          </div>
          <div className="rangee" style={{ gap: 12, alignItems: 'end', flexWrap: 'wrap', marginTop: 8 }}>
            <span className="etroit"><label>Fragments gagnés</label>
              <input type="number" min="0" value={montee.fragments} onChange={e => setMontee(m => ({ ...m, fragments: e.target.value }))} /></span>
            <span className="aide">{fr.nb}d{fr.faces} par niveau</span>
            <button className="btn clair etroit" onClick={relancerFragments}>Relancer</button>
          </div>
          <ul className="aide" style={{ margin: '10px 0 10px 18px' }}>
            <li>Dé de résistance : +1</li>
            <li>{quotaSuivant > quota ? `+${quotaSuivant - quota} sort à apprendre (quota ${quota} vers ${quotaSuivant})` : 'Pas de nouveau sort à ce niveau'}</li>
            {paliersAtteints && <li><strong>Palier de montée de caractéristique atteint</strong> (à cocher sur la fiche par le joueur)</li>}
          </ul>
          <div className="rangee" style={{ gap: 8 }}>
            <button className="btn plein" disabled={occupe} onClick={validerMontee}>{occupe ? 'Enregistrement…' : 'Valider la montée'}</button>
            <button className="btn clair" disabled={occupe} onClick={() => setMontee(null)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="rangee" style={{ gap: 8, alignItems: 'end', flexWrap: 'wrap', marginTop: 14 }}>
        <span className="etroit"><label>Fragments</label>
          <input type="number" value={fragmentsDon} onChange={e => setFragmentsDon(e.target.value)} /></span>
        <span><label>Motif (facultatif)</label>
          <input value={motifDon} placeholder="Ex. relique rendue à l'Académie" onChange={e => setMotifDon(e.target.value)} /></span>
        <button className="btn clair" disabled={occupe || !Number(fragmentsDon)} onClick={donnerFragments}>
          {Number(fragmentsDon) < 0 ? 'Retirer' : 'Donner'}
        </button>
      </div>

      <div className="rangee" style={{ gap: 8, alignItems: 'center', marginTop: 10 }}>
        <span className="aide">Sorts bonus accordés : <strong>{perso.sorts_bonus ?? 0}</strong></span>
        <button className="btn clair etroit" disabled={occupe || !(perso.sorts_bonus > 0)} onClick={() => changerBonusSorts(-1)}>−1</button>
        <button className="btn clair etroit" disabled={occupe} onClick={() => changerBonusSorts(1)}>+1</button>
      </div>

      {erreur && <p className="aide" style={{ color: 'var(--rouge)' }}>{erreur}</p>}

      {journal.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary className="aide" style={{ cursor: 'pointer' }}>Journal de progression ({journal.length})</summary>
          <ul className="aide" style={{ marginLeft: 18 }}>
            {[...journal].reverse().map(e => (
              <li key={e.id}>
                {new Date(e.date).toLocaleDateString('fr-FR')} :{' '}
                {e.type === 'niveau'
                  ? `niveau ${e.de} vers ${e.vers}, +${e.pv} PV, +${e.fragments} fragments`
                  : `${e.fragments > 0 ? '+' : ''}${e.fragments} fragments au niveau ${e.niveau}${e.motif ? ` (${e.motif})` : ''}`}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export default function Joueurs() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(univers.joueurs[0]?.id ?? null)
  const j = univers.joueurs.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouveauJoueur()
    maj(u => u.joueurs.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.joueurs.find(x => x.id === selId)) })
  const supprimer = () => {
    if (!confirm(`Supprimer ${j.personnage} ?`)) return
    maj(u => { u.joueurs = u.joueurs.filter(x => x.id !== selId) })
    setSelId(null)
  }
  const sessionsJouees = j ? univers.campagnes.flatMap(c =>
    c.sessions.filter(s => (s.joueurIds || []).includes(j.id)).map(s => ({ ...s, campagne: c }))
  ).sort((a, b) => (a.date ?? 0) - (b.date ?? 0)) : []

  const nbRelies = univers.joueurs.filter(x => x.characterId).length

  return (
    <ListeFiche
      items={univers.joueurs} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouveau personnage joueur"
      entete={<p className="aide" style={{ padding: '0 14px 8px' }}>
        🔗 {nbRelies} / {univers.joueurs.length} fiche(s) personnage reliée(s)</p>}
      tris={{
        personnage: x => x.personnage,
        joueur: x => x.joueur,
        niveau: x => -x.niveau,
        faction: x => univers.factions.find(f => f.id === x.faction)?.nom || 'zzz',
      }}
      rendu={p => {
        const f = univers.factions.find(x => x.id === p.faction)
        return (<><span className="rond" style={{ background: f?.couleur || '#888' }} />
          <span>{p.personnage}
            {p.characterId && <span title="Fiche personnage reliée" style={{ marginLeft: 6, color: 'var(--or)' }}>🔗</span>}
            <div className="sous">{p.joueur} · niv. {p.niveau}</div>
          </span></>)
      }}
      enfants={j && (
        <div key={j.id}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ flex: 1 }}>{j.personnage}</h2>
            <a className="btn clair" href="/fiches" target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none' }}>Fiches personnage ↗</a>
          </div>
          <LienFicheJoueur joueur={j} modifier={modifier} />
          {supabase && j.characterId && (
            <PanneauProgression characterId={j.characterId} surNiveau={n => modifier(x => { x.niveau = n })} />
          )}
          <div className="rangee">
            <span><label>Faction actuelle</label>
              <SelecteurFaction valeur={j.faction} surChange={v => modifier(x => { x.faction = v })} /></span>
          </div>
          <span><label>Contact / supérieur dans la faction (pour l'organigramme)</label>
            <select value={j.superieurId || ''} onChange={e => modifier(x => { x.superieurId = e.target.value || null })}>
              <option value="">— aucun, affiché à la racine —</option>
              {univers.pnjs.filter(p => p.faction === j.faction).map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select></span>
          <Champ label="Notes MJ (fils personnels, dettes, promesses)" zone value={j.notes}
            onChange={e => modifier(x => { x.notes = e.target.value })} />
          <Champ label="Secrets Maître (ce que le personnage ignore, réservé au MJ)" zone value={j.secrets}
            onChange={e => modifier(x => { x.secrets = e.target.value })} />

          <h3>Citations</h3>
          <p className="aide">Les phrases mémorables prononcées à la table.</p>
          {j.citations.map((c, i) => (
            <div className="rangee" key={i}>
              <input value={c} placeholder="« ... »"
                onChange={e => modifier(x => { x.citations[i] = e.target.value })} />
              <button className="btn clair etroit" onClick={() => modifier(x => { x.citations.splice(i, 1) })}>retirer</button>
            </div>
          ))}
          <button className="btn clair" onClick={() => modifier(x => { x.citations.push('') })}>+ citation</button>

          <h3>Sessions jouées ({sessionsJouees.length})</h3>
          <p className="aide">Coché depuis l'onglet Méta et Campagnes, fiche de la session. Utile pour retrouver qui était là quand.</p>
          {sessionsJouees.length
            ? <ul style={{ marginLeft: 18 }}>{sessionsJouees.map(s => (
                <li key={s.id}>
                  <strong>{s.date != null ? fmtDate(s.date) : 'sans date'}</strong> · {s.code ? s.code + ' · ' : ''}{s.titre}
                  <span className="aide"> ({s.campagne.titre})</span>
                </li>
              ))}</ul>
            : <p className="aide">Aucune session cochée pour ce personnage pour l'instant.</p>}

          <h3>Historique</h3>
          <p className="aide">Tout ce que le personnage a vécu : rencontres, combats, lieux traversés, révélations. Les entrées datées apparaissent sur sa ligne de la frise.</p>
          {j.historique.map((it, i) => {
            const p = univers.pnjs.find(x => x.id === it.pnjId)
            const l = univers.lieux.find(x => x.id === it.lieuId)
            return (
              <div className="carte" key={it.id}>
                <div className="rangee">
                  <span className="etroit"><label>Type</label>
                    <select value={it.type} onChange={e => modifier(x => { x.historique[i].type = e.target.value })}>
                      {TYPES_HISTORIQUE.map(t => <option key={t}>{t}</option>)}
                    </select></span>
                  <DateSiderienne label="Date" optionnel valeur={it.date}
                    surChange={v => modifier(x => { x.historique[i].date = v })} />
                </div>
                <div className="rangee">
                  <span><label>PNJ concerné</label>
                    <select value={it.pnjId || ''} onChange={e => modifier(x => { x.historique[i].pnjId = e.target.value || null })}>
                      <option value="">—</option>
                      {univers.pnjs.map(pp => <option key={pp.id} value={pp.id}>{pp.nom}</option>)}
                    </select></span>
                  <span><label>Lieu</label>
                    <select value={it.lieuId || ''} onChange={e => modifier(x => { x.historique[i].lieuId = e.target.value || null })}>
                      <option value="">—</option>
                      {univers.lieux.map(ll => <option key={ll.id} value={ll.id}>{ll.nom}</option>)}
                    </select></span>
                </div>
                <div className="rangee">
                  <span><label>Campagne</label>
                    <select value={it.campagneId || ''} onChange={e => modifier(x => {
                      x.historique[i].campagneId = e.target.value || null; x.historique[i].sessionId = null
                    })}>
                      <option value="">—</option>
                      {univers.campagnes.map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                    </select></span>
                  {it.campagneId && <span><label>Session</label>
                    <select value={it.sessionId || ''} onChange={e => modifier(x => { x.historique[i].sessionId = e.target.value || null })}>
                      <option value="">—</option>
                      {univers.campagnes.find(c => c.id === it.campagneId)?.sessions.map(s =>
                        <option key={s.id} value={s.id}>{(s.code ? s.code + ' ' : '') + s.titre}</option>)}
                    </select></span>}
                </div>
                <Champ label="Ce qui s'est passé" zone value={it.resume}
                  onChange={e => modifier(x => { x.historique[i].resume = e.target.value })} />
                <Champ label="Effet (compteur, réputation, promesse...)" value={it.effet}
                  onChange={e => modifier(x => { x.historique[i].effet = e.target.value })} />
                <div className="aide">{it.type}{p ? ` · ${p.nom}` : ''}{l ? ` · ${l.nom}` : ''} · {it.date != null ? fmtDate(it.date) : 'sans date'}</div>
                <button className="btn clair" style={{ marginTop: 6 }}
                  onClick={() => modifier(x => { x.historique.splice(i, 1) })}>retirer</button>
              </div>
            )
          })}
          <button className="btn clair" onClick={() => modifier(x => {
            x.historique.push(nouvelleEntreeHistorique())
          })}>+ entrée d'historique</button>

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer ce personnage</button>
          </div>
        </div>
      )}
    />
  )
}
