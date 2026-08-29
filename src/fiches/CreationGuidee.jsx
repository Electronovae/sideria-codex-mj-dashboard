import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useClasses } from './useClasses.js'
import { usePeuples, useHistoriques, useDons, useSorts } from '../wiki/useWikiData.js'
import { nouvelleFiche, LIBELLES_CARAC } from './modeleFiche.js'

const NOMS_CARAC = ['for', 'dex', 'con', 'int', 'sag', 'cha', 'ecl']
const ETAPES = ['Nom', 'Classe', 'Origine', 'Caractéristiques', 'Dons', 'Sorts', 'Récapitulatif']

function nomCourtClasse(nomComplet) {
  return (nomComplet || '').replace(/^(Le |La |L')/, '')
}

function lancer4d6DropLowest() {
  const des = []
  for (let i = 0; i < 4; i++) {
    let v = 1 + Math.floor(Math.random() * 6)
    if (v === 1) v = 1 + Math.floor(Math.random() * 6) // relance une fois si 1
    des.push(v)
  }
  des.sort((a, b) => a - b)
  return des[1] + des[2] + des[3]
}

export default function CreationGuidee({ player }) {
  const navigate = useNavigate()
  const { classes, chargement: chargClasses } = useClasses()
  const { peuples, chargement: chargPeuples } = usePeuples()
  const { historiques, chargement: chargHistoriques } = useHistoriques()
  const { dons, chargement: chargDons } = useDons()
  const { sorts, chargement: chargSorts } = useSorts()

  const [etape, setEtape] = useState(0)
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const [nom, setNom] = useState('')
  const [classeId, setClasseId] = useState(null)
  const [sousClasseId, setSousClasseId] = useState(null)
  const [peupleId, setPeupleId] = useState(null)
  const [historiqueId, setHistoriqueId] = useState(null)
  const [jets, setJets] = useState([])
  const [assignation, setAssignation] = useState({}) // { for: indexDeJet, ... }
  const [donsChoisis, setDonsChoisis] = useState([])
  const [sortsChoisis, setSortsChoisis] = useState([])

  const classe = classes.find(c => c.id === classeId)
  const nomCourt = nomCourtClasse(classe?.nom)
  const estLanceurDeSorts = !!classe?.base?.fields?.some(f => f.label === 'Magie')

  const chargement = chargClasses || chargPeuples || chargHistoriques || chargDons || chargSorts

  const donsDisponibles = useMemo(() => {
    if (!classe) return []
    return dons.filter(d => d.categorie === 'generique' || (d.categorie === 'classe' && d.sous_categorie === nomCourt))
  }, [dons, classe, nomCourt])

  const sortsDisponibles = useMemo(() => {
    if (!classe || !estLanceurDeSorts) return []
    return sorts.filter(s => s.sous_type?.includes(nomCourt))
  }, [sorts, classe, estLanceurDeSorts, nomCourt])

  const peuple = peuples.find(p => p.id === peupleId)
  const historique = historiques.find(h => h.id === historiqueId)

  const lancerLesDes = () => {
    const nouveaux = Array.from({ length: 7 }, () => lancer4d6DropLowest())
    setJets(nouveaux)
    setAssignation({})
  }

  const assigner = (carac, indexJet) => {
    setAssignation(prev => {
      const suivant = { ...prev }
      // libère l'index si déjà pris ailleurs
      for (const c of NOMS_CARAC) if (suivant[c] === indexJet && c !== carac) delete suivant[c]
      if (indexJet === '') delete suivant[carac]
      else suivant[carac] = Number(indexJet)
      return suivant
    })
  }

  const toutAssigne = NOMS_CARAC.every(c => assignation[c] !== undefined)

  const basculerDon = (id) => {
    setDonsChoisis(prev => prev.includes(id) ? prev.filter(x => x !== id) : (prev.length >= 1 ? prev : [...prev, id]))
  }
  const basculerSort = (id) => {
    setSortsChoisis(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const peutAvancer = () => {
    if (etape === 0) return nom.trim().length > 0
    if (etape === 1) return !!classeId && (classe?.subclasses?.length ? !!sousClasseId : true)
    if (etape === 2) return !!peupleId && !!historiqueId
    if (etape === 3) return toutAssigne
    if (etape === 4) return true // don optionnel niveau 1 selon table
    if (etape === 5) return true
    return true
  }

  const etapesEffectives = estLanceurDeSorts ? ETAPES : ETAPES.filter(e => e !== 'Sorts')
  const indexEffectif = estLanceurDeSorts ? etape : (etape > 4 ? etape - 1 : etape)

  const suivant = () => {
    let prochaine = etape + 1
    if (prochaine === 5 && !estLanceurDeSorts) prochaine = 6
    setEtape(prochaine)
  }
  const precedent = () => {
    let prochaine = etape - 1
    if (prochaine === 5 && !estLanceurDeSorts) prochaine = 4
    setEtape(Math.max(0, prochaine))
  }

  const valider = async () => {
    setEnvoi(true)
    setErreur(null)
    const { data: { user } } = await supabase.auth.getUser()
    const stats = {}
    for (const c of NOMS_CARAC) stats[c] = jets[assignation[c]]

    const fiche = {
      ...nouvelleFiche(nom.trim()),
      user_id: user.id,
      player_id: player.id,
      class_id: classeId,
      subclass_id: sousClasseId || null,
      peuple_id: peupleId,
      historique_id: historiqueId,
      origin: `${peuple?.nom ?? ''} — ${historique?.nom ?? ''}`,
      stats,
      hit_dice_type: classe?.de_vie ?? 8,
      hit_dice_remaining: 1,
      hp_max: (classe?.de_vie ?? 8) + Math.floor((stats.con - 10) / 2),
      hp_current: (classe?.de_vie ?? 8) + Math.floor((stats.con - 10) / 2),
      dons: donsChoisis,
      sorts_connus: sortsChoisis,
    }

    const { data, error } = await supabase.from('characters').insert(fiche).select('id').single()
    if (error) { setErreur(error.message); setEnvoi(false); return }
    navigate(`/fiches/${data.id}`)
  }

  if (chargement) return <div className="fiches-message">Chargement du Codex…</div>

  return (
    <div className="fiches-selection">
      <div className="fiches-carte">
        <div className="fiches-carte-titre">Créer un personnage</div>
        <p style={{ fontSize: '.82rem', color: 'var(--gris, #8a8478)', margin: '0 0 14px' }}>
          Étape {indexEffectif + 1} / {etapesEffectives.length} — {etapesEffectives[indexEffectif]}
        </p>

        {erreur && <p className="fiches-message fiches-message--erreur">{erreur}</p>}

        {etape === 0 && (
          <div className="fiches-form">
            <label>Nom du personnage</label>
            <input autoFocus type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex. Kessa Vane" />
          </div>
        )}

        {etape === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {classes.map(c => (
                <button key={c.id} type="button" className="fiches-btn fiches-btn--discret"
                  style={{ textAlign: 'left', border: c.id === classeId ? '2px solid var(--or, #c9a227)' : undefined }}
                  onClick={() => { setClasseId(c.id); setSousClasseId(null) }}>
                  {c.nom}
                </button>
              ))}
            </div>
            {classe?.subclasses?.length > 0 && (
              <>
                <p style={{ fontWeight: 600, margin: '10px 0 6px' }}>Sous-classe</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                  {classe.subclasses.map(s => (
                    <button key={s.id} type="button" className="fiches-btn fiches-btn--discret"
                      style={{ textAlign: 'left', border: s.id === sousClasseId ? '2px solid var(--or, #c9a227)' : undefined }}
                      onClick={() => setSousClasseId(s.id)}>
                      <strong>{s.nom}</strong>{s.tagline ? ` — ${s.tagline}` : ''}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {etape === 2 && (
          <div>
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Peuple</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {peuples.map(p => (
                <button key={p.id} type="button" className="fiches-btn fiches-btn--discret"
                  style={{ textAlign: 'left', border: p.id === peupleId ? '2px solid var(--or, #c9a227)' : undefined }}
                  onClick={() => setPeupleId(p.id)}>
                  {p.nom}
                </button>
              ))}
            </div>
            <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Historique</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {historiques.map(h => (
                <button key={h.id} type="button" className="fiches-btn fiches-btn--discret"
                  style={{ textAlign: 'left', border: h.id === historiqueId ? '2px solid var(--or, #c9a227)' : undefined }}
                  onClick={() => setHistoriqueId(h.id)}>
                  {h.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {etape === 3 && (
          <div>
            <p style={{ fontSize: '.86rem', color: 'var(--gris, #8a8478)' }}>
              4d6, relance des 1, garde les 3 meilleurs — répété 7 fois. Assigne librement chaque score à une caractéristique.
              {peuple && <> N'oublie pas les bonus de <strong>{peuple.nom}</strong> une fois assigné.</>}
            </p>
            <button type="button" className="fiches-btn" onClick={lancerLesDes} style={{ marginBottom: 14 }}>
              🎲 Lancer les 7 scores
            </button>
            {jets.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {NOMS_CARAC.map(c => (
                  <div key={c}>
                    <label style={{ display: 'block', fontSize: '.82rem', marginBottom: 4 }}>{LIBELLES_CARAC[c]}</label>
                    <select value={assignation[c] ?? ''} onChange={e => assigner(c, e.target.value)}>
                      <option value="">—</option>
                      {jets.map((v, i) => (
                        (assignation[c] === i || !Object.values(assignation).includes(i)) && (
                          <option key={i} value={i}>{v}</option>
                        )
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {etape === 4 && (
          <div>
            <p style={{ fontSize: '.86rem', color: 'var(--gris, #8a8478)' }}>
              1 don au niveau 1 (génériques ou exclusifs à ta classe). Les dons de maîtrise demandent des prérequis non atteints à la création.
            </p>
            {donsDisponibles.map(d => (
              <label key={d.id} className="fiches-item" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="checkbox" checked={donsChoisis.includes(d.id)} onChange={() => basculerDon(d.id)} style={{ marginTop: 4 }} />
                <span>
                  <span className="fiches-item-nom">{d.nom}</span>
                  <span className="fiches-item-meta" style={{ display: 'block' }}>{d.description}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {etape === 5 && estLanceurDeSorts && (
          <div>
            <p style={{ fontSize: '.86rem', color: 'var(--gris, #8a8478)' }}>
              Sorts exclusifs à ta classe. Les sorts « Tronc commun » de tes disciplines restent accessibles en jeu — vois ça avec ton MJ.
            </p>
            {sortsDisponibles.map(s => (
              <label key={s.id} className="fiches-item" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="checkbox" checked={sortsChoisis.includes(s.id)} onChange={() => basculerSort(s.id)} style={{ marginTop: 4 }} />
                <span>
                  <span className="fiches-item-nom">{s.nom}</span>
                  <span className="fiches-item-meta" style={{ display: 'block' }}>{s.sous_type} · {s.meta}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {etape === 6 && (
          <div>
            <div className="wiki-feature">
              <div className="wiki-feature-nom">{nom}</div>
              <div className="wiki-feature-texte">
                {classe?.nom}{sousClasseId ? ` (${classe.subclasses.find(s => s.id === sousClasseId)?.nom})` : ''}
                {' — '}{peuple?.nom}, {historique?.nom}
              </div>
            </div>
            <div className="wiki-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {NOMS_CARAC.map(c => (
                <div key={c} className="wiki-stat">
                  <div className="wiki-stat-label">{LIBELLES_CARAC[c]}</div>
                  <div className="wiki-stat-valeur">{jets[assignation[c]] ?? '—'}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 10 }}>
              <strong>Dons :</strong> {donsChoisis.map(id => dons.find(d => d.id === id)?.nom).join(', ') || 'aucun'}
            </p>
            {estLanceurDeSorts && (
              <p><strong>Sorts :</strong> {sortsChoisis.map(id => sorts.find(s => s.id === id)?.nom).join(', ') || 'aucun'}</p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button type="button" className="fiches-btn fiches-btn--discret" onClick={precedent} disabled={etape === 0}>
            ← Précédent
          </button>
          {etape < 6 ? (
            <button type="button" className="fiches-btn" onClick={suivant} disabled={!peutAvancer()}>
              Suivant →
            </button>
          ) : (
            <button type="button" className="fiches-btn" onClick={valider} disabled={envoi}>
              {envoi ? 'Création…' : 'Forger la fiche'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
