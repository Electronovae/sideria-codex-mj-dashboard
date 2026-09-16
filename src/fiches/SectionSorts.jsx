import React, { useMemo, useState } from 'react'
import { useSorts } from '../wiki/useWikiData.js'
import { TexteLeger } from '../wiki/texteLeger.jsx'
import { quotaSorts, sortsAccessibles, libelleIntervalle } from './modeleFiche.js'

function disciplineDe(sort) {
  return (sort.sous_type || '').split('•')[0].trim()
}
function accesDe(sort) {
  return (sort.sous_type || '').split('•').slice(1).join('•').trim()
}

function DetailSort({ sort }) {
  const champs = sort.contenu?.filter(c => c.type === 'champ') ?? []
  const description = sort.contenu?.find(c => c.type === 'description')
  const progression = sort.contenu?.find(c => c.type === 'progression')
  return (
    <div className="sort-detail">
      {sort.meta && <p className="sort-meta">{sort.meta}</p>}
      {champs.map((c, i) => (
        <p key={i} className="sort-champ"><strong>{c.label}</strong> <TexteLeger>{c.texte}</TexteLeger></p>
      ))}
      {description && <p className="sort-description"><TexteLeger>{description.texte}</TexteLeger></p>}
      {progression && (
        <p className="sort-progression"><strong>Surcharge.</strong> <TexteLeger>{progression.texte}</TexteLeger></p>
      )}
    </div>
  )
}

export default function SectionSorts({ fiche, modifier, classe, classeSecondaire, estMJ }) {
  const { sorts, chargement } = useSorts()
  const [ouvert, setOuvert] = useState(null)
  const [catalogue, setCatalogue] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [toutAfficher, setToutAfficher] = useState(false)

  const connus = Array.isArray(fiche.sorts_connus) ? fiche.sorts_connus : []
  const quota = quotaSorts(classe, fiche)
  const plein = connus.length >= quota
  const imposes = classe?.sorts_depart || []

  const sortsConnus = useMemo(
    () => connus.map(id => sorts.find(s => s.id === id)).filter(Boolean)
      .sort((a, b) => (a.cout_mana ?? 99) - (b.cout_mana ?? 99) || a.nom.localeCompare(b.nom)),
    [connus, sorts],
  )

  const accessibles = useMemo(() => {
    const base = toutAfficher && estMJ ? sorts : sortsAccessibles(sorts, [classe, classeSecondaire])
    return base.filter(s => !connus.includes(s.id))
  }, [sorts, classe, classeSecondaire, connus, toutAfficher, estMJ])

  const disciplines = useMemo(
    () => [...new Set(accessibles.map(disciplineDe))].filter(Boolean).sort(),
    [accessibles],
  )

  const catalogueFiltre = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return accessibles.filter(s => (!discipline || disciplineDe(s) === discipline)
      && (!q || s.nom.toLowerCase().includes(q) || (s.sous_type || '').toLowerCase().includes(q)))
      .sort((a, b) => (a.cout_mana ?? 99) - (b.cout_mana ?? 99) || a.nom.localeCompare(b.nom))
  }, [accessibles, recherche, discipline])

  const apprendre = (id) => {
    if (plein && !estMJ) return
    modifier('sorts_connus', [...connus, id])
  }
  const oublier = (id) => {
    if (imposes.includes(id) && !estMJ) return
    modifier('sorts_connus', connus.filter(x => x !== id))
  }

  if (chargement) return <section className="feuille-bloc"><p className="feuille-note">Chargement du grimoire…</p></section>

  return (
    <section className="feuille-bloc">
      <div className="grimoire-tete">
        <h2>Grimoire</h2>
        <div className="grimoire-quota" title={`${connus.length} sorts connus sur ${quota}`}>
          <span className="grimoire-quota-chiffres">{connus.length}<span>/{quota}</span></span>
          <span className="grimoire-quota-pips">
            {Array.from({ length: Math.max(quota, connus.length) }, (_, i) => (
              <span key={i} className={'grimoire-pip' + (i < connus.length ? ' plein' : '') + (i >= quota ? ' exces' : '')} />
            ))}
          </span>
        </div>
      </div>
      <p className="feuille-note" style={{ marginTop: 0 }}>
        {classe
          ? <>{classe.nom} : {classe.sorts_max_depart ?? 0} sort{(classe.sorts_max_depart ?? 0) > 1 ? 's' : ''} au niveau 1, puis {libelleIntervalle(classe.sorts_intervalle_niveaux)}.
              {fiche.sorts_bonus ? ` Bonus accordé par le MJ : +${fiche.sorts_bonus}.` : ''} Mana : {fiche.mana_current ?? 0} / {fiche.mana_max ?? 0}.</>
          : 'Aucune classe renseignée sur cette fiche.'}
      </p>
      {connus.length > quota && (
        <p className="grimoire-alerte">Ce personnage connaît plus de sorts que son quota. À régulariser avec le MJ.</p>
      )}

      {sortsConnus.length === 0 && <p className="feuille-note">Aucun sort connu pour l'instant.</p>}
      <div className="grimoire-liste">
        {sortsConnus.map(s => {
          const estOuvert = ouvert === s.id
          const impose = imposes.includes(s.id)
          return (
            <article key={s.id} className={'grimoire-sort' + (estOuvert ? ' ouvert' : '')}>
              <button type="button" className="grimoire-sort-tete" onClick={() => setOuvert(estOuvert ? null : s.id)}>
                <span className="grimoire-sort-cout">{s.cout_mana ?? '?'}</span>
                <span className="grimoire-sort-nom">{s.nom}
                  <span className="grimoire-sort-disc">{disciplineDe(s)}{impose ? ', set de départ' : ''}</span>
                </span>
                <span className="grimoire-sort-fleche">{estOuvert ? '▾' : '▸'}</span>
              </button>
              {estOuvert && (
                <div className="grimoire-sort-corps">
                  <DetailSort sort={s} />
                  {(!impose || estMJ) && (
                    <button type="button" className="fiches-btn fiches-btn--discret" onClick={() => oublier(s.id)}>
                      Retirer du grimoire
                    </button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="grimoire-catalogue">
        {!catalogue ? (
          <button type="button" className="fiches-btn" disabled={plein && !estMJ} onClick={() => setCatalogue(true)}>
            {plein && !estMJ ? 'Grimoire complet' : '+ Apprendre un sort'}
          </button>
        ) : (
          <>
            <div className="grimoire-filtres">
              <input type="text" placeholder="Rechercher un sort…" value={recherche} onChange={e => setRecherche(e.target.value)} />
              <select value={discipline} onChange={e => setDiscipline(e.target.value)}>
                <option value="">Toutes les disciplines</option>
                {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button type="button" className="fiches-btn fiches-btn--discret" onClick={() => setCatalogue(false)}>Fermer</button>
            </div>
            {estMJ && (
              <label className="fc-champ--case" style={{ fontSize: '.8em', display: 'block', margin: '6px 0' }}>
                <input type="checkbox" checked={toutAfficher} onChange={e => setToutAfficher(e.target.checked)} style={{ width: 'auto' }} />
                {' '}Afficher tous les sorts (MJ), y compris hors classe et au-delà du quota
              </label>
            )}
            <p className="feuille-note">
              {catalogueFiltre.length} sort{catalogueFiltre.length > 1 ? 's' : ''} accessible{catalogueFiltre.length > 1 ? 's' : ''} : tronc commun et exclusifs de ta classe.
              {plein && estMJ && ' Quota atteint : en tant que MJ tu peux quand même en ajouter.'}
            </p>
            <div className="grimoire-liste grimoire-liste--catalogue">
              {catalogueFiltre.map(s => {
                const estOuvert = ouvert === 'cat-' + s.id
                return (
                  <article key={s.id} className={'grimoire-sort grimoire-sort--catalogue' + (estOuvert ? ' ouvert' : '')}>
                    <div className="grimoire-sort-tete">
                      <span className="grimoire-sort-cout">{s.cout_mana ?? '?'}</span>
                      <button type="button" className="grimoire-sort-nom grimoire-sort-nom--bouton"
                        onClick={() => setOuvert(estOuvert ? null : 'cat-' + s.id)}>
                        {s.nom}
                        <span className="grimoire-sort-disc">{disciplineDe(s)}, {accesDe(s)}</span>
                      </button>
                      <button type="button" className="fiches-btn" disabled={plein && !estMJ} onClick={() => apprendre(s.id)}>
                        Apprendre
                      </button>
                    </div>
                    {estOuvert && <div className="grimoire-sort-corps"><DetailSort sort={s} /></div>}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
      <p className="feuille-note">Pense à enregistrer la fiche après avoir modifié ton grimoire.</p>
    </section>
  )
}
