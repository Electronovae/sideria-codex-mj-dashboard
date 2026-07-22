import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, PucesPnjs } from './communs.jsx'
import { nouvelleCampagne, nouvelleSession, nouvelEvenement, uid } from '../lib/modele.js'
import { DateSiderienne } from './communs.jsx'
import { fmtDate } from '../lib/calendrier.js'
import { Manometre } from './ArbreEditeur.jsx'

export default function Campagnes() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(null) // null = méta-campagne
  const [tri, setTri] = useState('saison')
  const [sessionSel, setSessionSel] = useState(null)
  const c = univers.campagnes.find(x => x.id === selId)

  const ajouter = () => {
    const n = nouvelleCampagne()
    maj(u => u.campagnes.push(n))
    setSelId(n.id)
  }
  const modifier = (fn) => maj(u => { fn(u.campagnes.find(x => x.id === selId)) })
  const modifierMeta = (fn) => maj(u => { fn(u.meta) })
  const supprimer = () => {
    if (!confirm(`Supprimer la campagne "${c.titre}" ?`)) return
    maj(u => {
      u.campagnes = u.campagnes.filter(x => x.id !== selId)
      u.evenements.forEach(e => { if (e.campagneId === selId) e.campagneId = null })
    })
    setSelId(null)
  }

  return (
    <>
      <div className="liste">
        <div className={'item' + (selId === null ? ' sel' : '')} onClick={() => { setSelId(null); setSessionSel(null) }}>
          <span className="rond" style={{ background: 'var(--or)' }} />
          <span>Méta-campagne<div className="sous">thèse et saisons</div></span>
        </div>
        <button className="btn clair ajout" onClick={ajouter}>+ Nouvelle campagne</button>
        <div style={{ padding: '0 14px 8px' }}>
          <label>Trier par</label>
          <select value={tri} onChange={e => setTri(e.target.value)}>
            <option value="saison">saison</option>
            <option value="titre">titre</option>
            <option value="faction">faction</option>
          </select>
        </div>
        {[...univers.campagnes].sort((a, b) => {
          if (tri === 'titre') return a.titre.localeCompare(b.titre, 'fr')
          if (tri === 'faction') {
            const fa = univers.factions.find(f => f.id === a.factionId)?.nom || 'zzz'
            const fb = univers.factions.find(f => f.id === b.factionId)?.nom || 'zzz'
            return fa.localeCompare(fb, 'fr')
          }
          return (a.saison - b.saison) || a.titre.localeCompare(b.titre, 'fr')
        }).map(x => {
          const f = univers.factions.find(ff => ff.id === x.factionId)
          return (
            <div key={x.id} className={'item' + (x.id === selId ? ' sel' : '')} onClick={() => { setSelId(x.id); setSessionSel(null) }}>
              <span className="rond" style={{ background: f?.couleur || '#888' }} />
              <span>{x.code ? x.code + ' · ' : ''}{x.titre}<div className="sous">Saison {x.saison} · {f?.nom || 'faction ?'}</div></span>
            </div>
          )
        }).reduce((acc, el, i) => {
          const camp = [...univers.campagnes].sort((a, b) => {
            if (tri === 'titre') return a.titre.localeCompare(b.titre, 'fr')
            if (tri === 'faction') {
              const fa = univers.factions.find(f => f.id === a.factionId)?.nom || 'zzz'
              const fb = univers.factions.find(f => f.id === b.factionId)?.nom || 'zzz'
              return fa.localeCompare(fb, 'fr')
            }
            return (a.saison - b.saison) || a.titre.localeCompare(b.titre, 'fr')
          })[i]
          acc.push(el)
          camp.sessions.forEach(s => acc.push(
            <div key={s.id} className={'item' + (sessionSel === s.id ? ' sel' : '')}
              style={{ paddingLeft: 34, fontSize: '.82rem' }}
              onClick={() => { setSelId(camp.id); setSessionSel(s.id) }}>
              <span style={{ color: 'var(--gris)' }}>└</span>
              <span>{s.code ? s.code + ' · ' : ''}{s.titre}
                <div className="sous">{s.date != null ? fmtDate(s.date) : 'sans date'}</div></span>
            </div>))
          return acc
        }, [])}
      </div>
      <div className="fiche">
        {selId === null ? <Meta meta={univers.meta} modifier={modifierMeta} />
        : (c && sessionSel && c.sessions.some(s => s.id === sessionSel))
          ? <EditeurSession campagne={c} sessionId={sessionSel} maj={maj} univers={univers}
              retour={() => setSessionSel(null)} />
        : c && (
          <div key={c.id}>
            <h2>{c.titre}</h2>
            <div className="rangee">
              <Champ className="etroit" label="Code" placeholder="C01" value={c.code}
                onChange={e => modifier(x => { x.code = e.target.value })} />
              <Champ label="Titre" value={c.titre} onChange={e => modifier(x => { x.titre = e.target.value })} />
              <span><label>Faction</label>
                <SelecteurFaction valeur={c.factionId} surChange={v => modifier(x => { x.factionId = v })} /></span>
              <span className="etroit"><label>Saison</label>
                <input type="number" min="0" value={c.saison}
                  onChange={e => modifier(x => { x.saison = +e.target.value || 0 })} /></span>
            </div>
            <div className="rangee">
              <span><label>Arc narratif</label>
                <select value={c.arcId || ''} onChange={e => modifier(x => { x.arcId = e.target.value || null })}>
                  <option value="">—</option>
                  {univers.arcs.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                </select></span>
              <Champ label="Durée (sessions)" placeholder="10-12" value={c.duree} onChange={e => modifier(x => { x.duree = e.target.value })} />
              <Champ label="Niveaux" placeholder="8-22" value={c.niveaux} onChange={e => modifier(x => { x.niveaux = e.target.value })} />
            </div>
            <Champ label="Ton" value={c.ton} onChange={e => modifier(x => { x.ton = e.target.value })} />
            <Champ label="Pitch" zone value={c.pitch} onChange={e => modifier(x => { x.pitch = e.target.value })} />

            <h3>Actes et points pivots</h3>
            {c.actes.map((a, i) => (
              <div className="carte" key={a.id}>
                <Champ label={`Acte ${i + 1} : titre`} value={a.titre}
                  onChange={e => modifier(x => { x.actes[i].titre = e.target.value })} />
                <Champ label="Résumé" zone value={a.resume}
                  onChange={e => modifier(x => { x.actes[i].resume = e.target.value })} />
                <Champ label="Point pivot (la décision des joueurs qui change tout)" value={a.pivot}
                  onChange={e => modifier(x => { x.actes[i].pivot = e.target.value })} />
                <button className="btn clair" style={{ marginTop: 6 }}
                  onClick={() => modifier(x => { x.actes.splice(i, 1) })}>retirer l'acte</button>
              </div>
            ))}
            <button className="btn clair" onClick={() => modifier(x => {
              x.actes.push({ id: uid('acte'), titre: '', resume: '', pivot: '' })
            })}>+ acte</button>

            <h3>Sessions</h3>
            {c.sessions.map(s => (
              <div className="carte" key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSessionSel(s.id)}>
                <strong>{s.code ? s.code + ' · ' : ''}{s.titre}</strong>
                <span className="aide"> · {s.date != null ? fmtDate(s.date) : 'sans date'} · {univers.evenements.filter(e => e.sessionId === s.id).length} événement(s) · cliquer pour éditer</span>
              </div>
            ))}
            <button className="btn clair" onClick={() => modifier(x => { x.sessions.push(nouvelleSession()) })}>+ session</button>

            <h3>PNJ clés</h3>
            <PucesPnjs ids={c.pnjIds} surChange={v => modifier(x => { x.pnjIds = v })} />

            <Champ label="Issues possibles" zone value={c.issues}
              onChange={e => modifier(x => { x.issues = e.target.value })} />

            <div style={{ marginTop: 24 }}>
              <button className="btn danger" onClick={supprimer}>Supprimer cette campagne</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Meta({ meta, modifier }) {
  return (
    <div>
      <h2>Méta-campagne</h2>
      <Champ label="Nom de l'univers" value={meta.nom} onChange={e => modifier(m => { m.nom = e.target.value })} />
      <Champ label="Thèse (ce que l'histoire globale raconte)" zone value={meta.these}
        onChange={e => modifier(m => { m.these = e.target.value })} />
      <h3>Saisons</h3>
      {meta.saisons.map((s, i) => (
        <div className="carte" key={s.num}>
          <div className="rangee">
            <Champ className="etroit" label="N°" type="number" value={s.num}
              onChange={e => modifier(m => { m.saisons[i].num = +e.target.value })} />
            <Champ label="Titre" value={s.titre} onChange={e => modifier(m => { m.saisons[i].titre = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Question dramatique" value={s.question}
              onChange={e => modifier(m => { m.saisons[i].question = e.target.value })} />
            <Champ className="etroit" label="Horloge" value={s.horloge}
              onChange={e => modifier(m => { m.saisons[i].horloge = e.target.value })} />
            <Champ className="etroit" label="Niveaux" value={s.niveaux}
              onChange={e => modifier(m => { m.saisons[i].niveaux = e.target.value })} />
          </div>
          <button className="btn clair" style={{ marginTop: 6 }}
            onClick={() => modifier(m => { m.saisons.splice(i, 1) })}>retirer la saison</button>
        </div>
      ))}
      <button className="btn clair" onClick={() => modifier(m => {
        m.saisons.push({ num: m.saisons.length + 1, titre: '', question: '', horloge: '', niveaux: '' })
      })}>+ saison</button>
      <p className="aide">Les campagnes se rattachent aux saisons définies ici. La thèse est la boussole : tout arc qui la contredit mérite discussion.</p>
    </div>
  )
}


function EditeurSession({ campagne, sessionId, maj, univers, retour }) {
  const [modeSession, setModeSession] = React.useState(false)
  const s = campagne.sessions.find(x => x.id === sessionId)
  const modifier = (fn) => maj(u => {
    const c = u.campagnes.find(x => x.id === campagne.id)
    fn(c.sessions.find(x => x.id === sessionId), c, u)
  })
  const evtsSession = univers.evenements.filter(e => e.sessionId === sessionId).sort((a, b) => a.debut - b.debut)
  const creerEvenement = () => maj(u => {
    const e = nouvelEvenement()
    const base = s.date != null ? s.date : e.debut
    e.debut = base + evtsSession.length          // continuité : jour suivant à chaque ajout
    e.sessionId = sessionId
    e.campagneId = campagne.id
    e.factionId = campagne.factionId
    e.titre = 'Événement ' + (evtsSession.length + 1)
    u.evenements.push(e)
  })
  const basculerEvt = (evtId) => maj(u => {
    const e = u.evenements.find(x => x.id === evtId)
    if (e.sessionId === sessionId) { e.sessionId = null }
    else { e.sessionId = sessionId; e.campagneId = campagne.id }
  })
  const modifierEvt = (evtId, fn) => maj(u => { fn(u.evenements.find(x => x.id === evtId)) })
  const evtsDispo = univers.evenements
    .filter(e => e.sessionId == null)
    .sort((a, b) => a.debut - b.debut)
  return (
    <div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn clair" onClick={retour}>← retour à {campagne.titre}</button>
        <span style={{ flex: 1 }} />
        <button className="btn plein" style={{ color: 'var(--bleu-nuit)' }} onClick={() => setModeSession(true)}>▶ Mode session</button>
      </div>
      {modeSession && <ModeSession session={s} campagne={campagne} univers={univers} maj={maj}
        fermer={() => setModeSession(false)} />}
      <h2 style={{ marginTop: 10 }}>{s.code ? s.code + ' · ' : ''}{s.titre}</h2>
      <div className="rangee">
        <span className="etroit"><label>Code</label>
          <input placeholder="S01" value={s.code} onChange={e => modifier(x => { x.code = e.target.value })} /></span>
        <span><label>Titre</label>
          <input value={s.titre} onChange={e => modifier(x => { x.titre = e.target.value })} /></span>
        <DateSiderienne label="Date en jeu" optionnel valeur={s.date}
          surChange={v => modifier(x => { x.date = v })} />
      </div>
      <span><label>Résumé</label>
        <textarea value={s.resume} onChange={e => modifier(x => { x.resume = e.target.value })} /></span>

      <h3>Préparation (les sections à lire en session)</h3>
      {s.sections.map((sec, i) => (
        <div className="carte" key={sec.id}>
          <span><label>Titre de la section</label>
            <input value={sec.titre} placeholder="Scène 1 : la gargote"
              onChange={e => modifier(x => { x.sections[i].titre = e.target.value })} /></span>
          <span><label>Contenu</label>
            <textarea style={{ minHeight: 110 }} value={sec.contenu}
              onChange={e => modifier(x => { x.sections[i].contenu = e.target.value })} /></span>
          <div className="rangee" style={{ marginTop: 6 }}>
            <button className="btn clair" disabled={i === 0}
              onClick={() => modifier(x => { const [m] = x.sections.splice(i, 1); x.sections.splice(i - 1, 0, m) })}>↑</button>
            <button className="btn clair" disabled={i === s.sections.length - 1}
              onClick={() => modifier(x => { const [m] = x.sections.splice(i, 1); x.sections.splice(i + 1, 0, m) })}>↓</button>
            <button className="btn clair" onClick={() => modifier(x => { x.sections.splice(i, 1) })}>retirer</button>
          </div>
        </div>
      ))}
      <button className="btn clair" onClick={() => modifier(x => {
        x.sections.push({ id: uid('sec'), titre: '', contenu: '' })
      })}>+ section</button>

      <h3>Événements de la session ({evtsSession.length})</h3>
      <p className="aide">Chaque nouvel événement se pré-remplit au jour suivant le précédent (à partir de la date de session). Faction et campagne sont héritées, tout reste modifiable ici ou dans l'onglet Événements.</p>
      {evtsSession.map(e => (
        <div className="carte" key={e.id}>
          <div className="rangee">
            <span><label>Titre</label>
              <input value={e.titre} onChange={ev => modifierEvt(e.id, x => { x.titre = ev.target.value })} /></span>
            <DateSiderienne label="Date" valeur={e.debut}
              surChange={v => modifierEvt(e.id, x => { x.debut = v ?? x.debut })} />
          </div>
          <span><label>Description</label>
            <textarea style={{ minHeight: 50 }} value={e.desc}
              onChange={ev => modifierEvt(e.id, x => { x.desc = ev.target.value })} /></span>
          <button className="btn clair" style={{ marginTop: 6 }} onClick={() => basculerEvt(e.id)}>détacher de la session</button>
        </div>
      ))}
      <button className="btn clair" onClick={creerEvenement}>+ nouvel événement (jour suivant)</button>

      {evtsDispo.length > 0 && <>
        <h3>Rattacher un événement existant</h3>
        {evtsDispo.map(e => (
          <div key={e.id} className="puce off" style={{ borderColor: 'var(--or)', display: 'inline-flex', margin: 3 }}
            onClick={() => basculerEvt(e.id)}>
            {fmtDate(e.debut)} · {e.titre}
          </div>
        ))}
      </>}
      <div style={{ marginTop: 20 }}>
        <button className="btn danger" onClick={() => {
          if (!confirm(`Supprimer la session "${s.titre}" ? Ses événements redeviennent non rattachés.`)) return
          maj(u => {
            const c = u.campagnes.find(x => x.id === campagne.id)
            c.sessions = c.sessions.filter(x => x.id !== sessionId)
            u.evenements.forEach(e => { if (e.sessionId === sessionId) e.sessionId = null })
          })
          retour()
        }}>Supprimer cette session</button>
      </div>
    </div>
  )
}


// ── Mode session : vue plein écran à lire pendant la partie ──
function ModeSession({ session, campagne, univers, maj, fermer }) {
  const [pnjOuvert, setPnjOuvert] = React.useState(null)
  React.useEffect(() => {
    const echap = (e) => { if (e.key === 'Escape') fermer() }
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [])
  const evtsSession = univers.evenements.filter(e => e.sessionId === session.id)
  const idsPnjs = [...new Set([...campagne.pnjIds, ...evtsSession.flatMap(e => e.participants)])]
  const pnjs = idsPnjs.map(id => univers.pnjs.find(p => p.id === id)).filter(Boolean)
  const majPnj = (pnjId, fn) => maj(u => { fn(u.pnjs.find(p => p.id === pnjId)) })
  const borner = (v, min, max) => Math.min(max, Math.max(min, v))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--parch)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bleu)', color: 'var(--texte-clair)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '3px solid var(--or)' }}>
        <strong style={{ fontVariant: 'small-caps', fontSize: '1.05rem' }}>
          {session.code ? session.code + ' · ' : ''}{session.titre}</strong>
        <span style={{ color: 'var(--or-clair)', fontSize: '.85rem' }}>
          {campagne.titre}{session.date != null ? ' · ' + fmtDate(session.date) : ''}</span>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={fermer}>Quitter (Échap)</button>
      </div>
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Préparation : les sections à lire */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 30px', maxWidth: 780 }}>
          {session.resume && <p style={{ fontStyle: 'italic', color: 'var(--gris)', marginBottom: 16 }}>{session.resume}</p>}
          {session.sections.length === 0 && <p className="aide">Aucune section de préparation. Reviens dans l'éditeur pour en écrire.</p>}
          {session.sections.map(sec => (
            <div key={sec.id} style={{ marginBottom: 22 }}>
              <h2 style={{ fontVariant: 'small-caps', color: 'var(--or)', borderBottom: '1px solid var(--parch-mid)', paddingBottom: 4, fontSize: '1.25rem' }}>{sec.titre || 'Section'}</h2>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '1.02rem', lineHeight: 1.65 }}>{sec.contenu}</div>
            </div>
          ))}
          {evtsSession.length > 0 && <>
            <h2 style={{ fontVariant: 'small-caps', color: 'var(--or)', fontSize: '1.1rem', marginTop: 10 }}>Événements prévus</h2>
            {evtsSession.sort((a, b) => a.debut - b.debut).map(e => (
              <div key={e.id} className="carte" style={{ padding: '8px 12px' }}>
                <strong>{fmtDate(e.debut)}</strong> · {e.titre}
                {e.desc && <div style={{ fontSize: '.9rem' }}>{e.desc}</div>}
              </div>
            ))}
          </>}
        </div>
        {/* PNJ et compteurs en direct */}
        <div style={{ width: 380, flex: 'none', borderLeft: '2px solid var(--parch-mid)', overflowY: 'auto', padding: '14px 16px', background: 'var(--fond2)' }}>
          <h3 style={{ fontVariant: 'small-caps', color: 'var(--or)', marginTop: 0 }}>PNJ de la session</h3>
          {pnjs.length === 0 && <p className="aide">Aucun PNJ lié. Ajoute des PNJ clés à la campagne ou des participants aux événements.</p>}
          {pnjs.map(p => {
            const f = univers.factions.find(x => x.id === p.faction)
            const ouvert = pnjOuvert === p.id
            return (
              <div key={p.id} className="carte" style={{ borderLeftColor: f?.couleur || 'var(--or)', cursor: 'pointer' }}
                onClick={() => setPnjOuvert(ouvert ? null : p.id)}>
                <strong>{p.nom}</strong>
                <span className="aide"> · {p.poste || p.role}</span>
                {ouvert && <div onClick={ev => ev.stopPropagation()} style={{ cursor: 'default', marginTop: 6 }}>
                  {p.description && <p style={{ fontSize: '.86rem' }}>{p.description}</p>}
                  {p.repliques.filter(Boolean).map((r, i) =>
                    <p key={i} style={{ borderLeft: '3px solid var(--or)', paddingLeft: 8, fontStyle: 'italic', fontSize: '.86rem', margin: '4px 0' }}>{r}</p>)}
                  {p.secrets && <div style={{ border: '1px dashed var(--rouge)', padding: '5px 8px', fontSize: '.82rem', margin: '6px 0' }}>
                    <span style={{ color: 'var(--rouge)', font: '700 9px monospace', letterSpacing: '.1em' }}>SECRET · </span>{p.secrets}</div>}
                  {p.arbre && <div style={{ textAlign: 'center', marginTop: 6 }}>
                    <Manometre compteur={p.arbre.compteur} largeur={190} surDelta={(d) => majPnj(p.id, x => {
                      const cc = x.arbre.compteur
                      cc.valeur = borner((cc.valeur ?? cc.initial ?? 0) + d, cc.min, cc.max)
                    })} />
                    {p.arbre.compteur.evenements.filter(e => e.label).map((ev, i) => (
                      <button key={i} className="btn clair" style={{ margin: 2, fontSize: '.72rem' }}
                        onClick={() => majPnj(p.id, x => {
                          const cc = x.arbre.compteur
                          cc.valeur = borner((cc.valeur ?? cc.initial ?? 0) + ev.delta, cc.min, cc.max)
                        })}>{ev.label} ({ev.delta > 0 ? '+' : ''}{ev.delta})</button>
                    ))}
                  </div>}
                  {p.compteurs.map((cpt, i) => (
                    <div key={cpt.id} style={{ textAlign: 'center', marginTop: 6 }}>
                      <Manometre compteur={cpt} largeur={190} surDelta={(d) => majPnj(p.id, x => {
                        const cc = x.compteurs[i]
                        cc.valeur = borner((cc.valeur ?? cc.min) + d, cc.min, cc.max)
                      })} />
                    </div>
                  ))}
                </div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
