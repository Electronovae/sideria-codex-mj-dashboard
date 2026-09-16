import React, { useMemo, useState } from 'react'
import { ListeFiche, Texte } from './communs.jsx'
import { useClasses } from '../fiches/useClasses.js'
import { useSorts } from '../wiki/useWikiData.js'
import { quotaSorts, sortsAccessibles } from '../fiches/modeleFiche.js'
import { supabase } from '../lib/supabase.js'

// ── Petits blocs de présentation, tous en lecture seule (le contenu du manuel n'est pas
// édité ici), à l'exception du set de sorts de départ par classe, géré en bas de fiche. ──

function BlocBase({ base }) {
  if (!base?.fields?.length) return null
  return (
    <table style={{ margin: '8px 0' }}>
      <tbody>
        {base.fields.map((f, i) => (
          <tr key={i}>
            <td style={{ color: 'var(--gris)', paddingRight: 12, whiteSpace: 'nowrap' }}>{f.label}</td>
            <td><Texte>{f.value}</Texte></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BlocExtra({ items }) {
  if (!items?.length) return null
  return items.map((it, i) => (
    <div key={i} className="carte" style={{ marginBottom: 10 }}>
      {it.title && <h4 style={{ margin: '0 0 4px' }}>{it.title}</h4>}
      <Texte>{it.text}</Texte>
    </div>
  ))
}

function Feature({ f, forceOuvert }) {
  const [ouvert, setOuvert] = useState(false)
  React.useEffect(() => { if (forceOuvert != null) setOuvert(forceOuvert) }, [forceOuvert])
  const complet = f.texte_complet && f.texte_complet !== f.description
  return (
    <div className="carte" style={{ marginBottom: 8 }}>
      <div className="rangee" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong>{f.nom}</strong>
        <span className="aide" style={{ margin: 0 }}>
          {f.cout_fragments ? `${f.cout_fragments} Frag.` : ''}
          {f.niveau_requis ? ` · niv. ${f.niveau_requis}` : ''}
        </span>
      </div>
      <Texte>{ouvert || !complet ? (f.texte_complet || f.description) : f.description}</Texte>
      {complet && (
        <span onClick={() => setOuvert(o => !o)} style={{ cursor: 'pointer', color: 'var(--or)', fontSize: '.78rem' }}>
          {ouvert ? '▲ résumé' : '▼ texte complet du manuel'}
        </span>
      )}
    </div>
  )
}

function BlocLegendaire({ items }) {
  if (!items?.length) return null
  return (
    <>
      <h3>Capacités légendaires</h3>
      {items.map((l, i) => (
        <div key={i} className="carte" style={{ marginBottom: 8, borderLeftColor: 'var(--or-clair)' }}>
          <Texte>{l.text}</Texte>
        </div>
      ))}
    </>
  )
}

function BlocMulticlassage({ items }) {
  if (!items?.length) return null
  return (
    <>
      <h3>Suggestions de multiclassage</h3>
      {items.map((m, i) => (
        <div key={i} className="carte" style={{ marginBottom: 8 }}>
          <strong>{m.name}</strong>
          <Texte>{m.text}</Texte>
        </div>
      ))}
    </>
  )
}

function FicheSousClasse({ sc, forceOuvert }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ borderBottom: '1px solid var(--parch-mid)', paddingBottom: 3 }}>{sc.nom}</h3>
      {sc.tagline && <p className="citation">{sc.tagline}</p>}
      {sc.flavour && <Texte>{sc.flavour}</Texte>}
      {(sc.features || []).map(f => <Feature key={f.id} f={f} forceOuvert={forceOuvert} />)}
      <BlocLegendaire items={
        // les capacités légendaires liées à un Patron/Serment sont parfois stockées dans mechanics de la sous-classe
        Array.isArray(sc.mechanics) ? sc.mechanics.map(t => ({ text: t })) : null
      } />
    </div>
  )
}

function EditeurSortsDepart({ classe }) {
  const { sorts, chargement: chargSorts } = useSorts()
  const [sortsDepart, setSortsDepart] = useState(classe.sorts_depart || [])
  const [maxDepart, setMaxDepart] = useState(classe.sorts_max_depart ?? 0)
  const [intervalle, setIntervalle] = useState(classe.sorts_intervalle_niveaux ?? 0)
  const [recherche, setRecherche] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState(null)

  const sortsDisponibles = useMemo(() => {
    const liste = sortsAccessibles(sorts, classe)
    const exclusif = s => !/tronc commun/i.test(s.sous_type || '')
    return [...liste.filter(exclusif), ...liste.filter(s => !exclusif(s))]
  }, [sorts, classe])

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    if (!q) return sortsDisponibles
    return sortsDisponibles.filter(s => sortsDepart.includes(s.id)
      || s.nom.toLowerCase().includes(q) || (s.sous_type || '').toLowerCase().includes(q))
  }, [sortsDisponibles, recherche, sortsDepart])

  if (chargSorts) return <p className="aide">Chargement des sorts…</p>

  const enregistrer = async (champs) => {
    setEnregistrement(true)
    setErreur(null)
    const { error } = await supabase.from('classes_sideria').update(champs).eq('id', classe.id)
    if (error) setErreur(error.message)
    else Object.assign(classe, champs) // garde la liste des classes en cache à jour si on change de classe puis revient
    setEnregistrement(false)
  }

  const basculer = (id) => {
    const suivant = sortsDepart.includes(id) ? sortsDepart.filter(x => x !== id) : [...sortsDepart, id]
    setSortsDepart(suivant)
    enregistrer({ sorts_depart: suivant })
  }
  const changerMax = (valeur) => {
    const v = Math.max(0, Math.min(5, Number(valeur) || 0))
    setMaxDepart(v)
    enregistrer({ sorts_max_depart: v })
  }
  const changerIntervalle = (valeur) => {
    const v = Number(valeur) || 0
    setIntervalle(v)
    enregistrer({ sorts_intervalle_niveaux: v })
  }

  const exemple = [1, 5, 10, 20].map(n => `niv. ${n} : ${quotaSorts({ sorts_max_depart: maxDepart, sorts_intervalle_niveaux: intervalle }, { level: n })}`).join(', ')

  return (
    <div>
      <div className="rangee" style={{ gap: 12, alignItems: 'end', marginBottom: 8, flexWrap: 'wrap' }}>
        <span className="etroit"><label>Sorts au niveau 1</label>
          <select value={maxDepart} onChange={e => changerMax(e.target.value)}>
            {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select></span>
        <span><label>Sorts gagnés en montant de niveau</label>
          <select value={intervalle} onChange={e => changerIntervalle(e.target.value)}>
            <option value={0}>Aucun</option>
            <option value={1}>1 sort par niveau</option>
            <option value={2}>1 sort tous les 2 niveaux</option>
            <option value={3}>1 sort tous les 3 niveaux</option>
          </select></span>
      </div>
      <p className="aide">Sorts connus : {exemple}.{enregistrement && ' Enregistrement…'}</p>
      {erreur && <p className="aide" style={{ color: 'var(--rouge)' }}>{erreur}</p>}

      {maxDepart > 0 && (
        <>
          <p className="aide" style={{ marginTop: 10 }}>
            Coché ici, un sort est imposé (verrouillé) et compte dans les {maxDepart} sorts de départ.
            {sortsDepart.length > maxDepart && <strong style={{ color: 'var(--rouge)' }}> Plus de sorts imposés que de sorts de départ !</strong>}
          </p>
          <input type="text" placeholder="Rechercher un sort…" value={recherche}
            onChange={e => setRecherche(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {filtres.map(s => (
              <label key={s.id} className="rangee" style={{ gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                <input type="checkbox" checked={sortsDepart.includes(s.id)} onChange={() => basculer(s.id)} />
                <span>{s.nom}</span>
                <span className="aide">{s.sous_type}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FicheClasse({ c }) {
  const [forceOuvert, setForceOuvert] = useState(null)
  if (!c) return null
  return (
    <div>
      <div className="rangee" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{ margin: '0 0 4px' }}>{c.nom}</h2>
        <button className="btn clair" onClick={() => setForceOuvert(v => !(v ?? false))}>
          {forceOuvert ? '▲ replier tout' : '▼ texte complet du manuel'}
        </button>
      </div>
      {c.flavour && <p className="citation">{c.flavour}</p>}
      {c.description && <Texte>{c.description}</Texte>}
      <BlocExtra items={c.description_extra} />
      <BlocBase base={c.base} />

      <h3>Techniques de classe</h3>
      {(c.features || []).length
        ? c.features.map(f => <Feature key={f.id} f={f} forceOuvert={forceOuvert} />)
        : <p className="aide">Aucune technique renseignée pour l'instant.</p>}

      <BlocLegendaire items={c.legendaire} />
      <BlocMulticlassage items={c.multiclassage} />

      {(c.subclasses || []).length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>{c.subclasses_label || 'Spécialisations'}</h3>
          {c.subclasses.map(sc => <FicheSousClasse key={sc.id} sc={sc} forceOuvert={forceOuvert} />)}
        </>
      )}

      <h3 style={{ marginTop: 24 }}>Sorts : départ et progression</h3>
      <EditeurSortsDepart classe={c} />
    </div>
  )
}

export default function Wiki() {
  const { classes, chargement } = useClasses()
  const [selId, setSelId] = useState(null)
  const classe = classes.find(c => c.id === selId) || classes[0]

  if (chargement) return <div className="vide">Chargement du codex des classes…</div>

  return (
    <ListeFiche
      items={classes}
      selId={classe?.id ?? null}
      surSel={setSelId}
      surAjout={null}
      libelleAjout={null}
      rendu={c => (
        <>
          <div>{c.nom}</div>
          <div className="sous">{c.subclasses?.length || 0} spécialisation{(c.subclasses?.length || 0) > 1 ? 's' : ''}</div>
        </>
      )}
      enfants={<FicheClasse key={classe?.id} c={classe} />}
    />
  )
}
