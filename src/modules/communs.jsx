import React, { useContext } from 'react'
import { Ctx } from '../App.jsx'
import { SAISONS, versJour, depuisJour } from '../lib/calendrier.js'

export const useStudio = () => useContext(Ctx)

export const Champ = ({ label, ...props }) => (
  <span style={{ display: 'block' }}>
    <label>{label}</label>
    {props.zone ? <textarea {...props} /> : <input {...props} />}
  </span>
)

export const SelecteurFaction = ({ valeur, surChange, avecVide = true }) => {
  const { univers } = useStudio()
  return (
    <select value={valeur ?? ''} onChange={e => surChange(e.target.value || null)}>
      {avecVide && <option value="">— aucune —</option>}
      {univers.factions.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
    </select>
  )
}

export const PuceFaction = ({ id }) => {
  const { univers } = useStudio()
  const f = univers.factions.find(x => x.id === id)
  if (!f) return null
  return (
    <span className="puce" style={{ borderColor: f.couleur, cursor: 'default' }}>
      <span className="rond" style={{ background: f.couleur }} />{f.nom}
    </span>
  )
}

// Sélecteur multiple de PNJ sous forme de puces cliquables.
export const PucesPnjs = ({ ids, surChange }) => {
  const { univers } = useStudio()
  const ens = new Set(ids)
  const basculer = (id) => {
    ens.has(id) ? ens.delete(id) : ens.add(id)
    surChange([...ens])
  }
  return (
    <div>
      {univers.pnjs.map(p => {
        const f = univers.factions.find(x => x.id === p.faction)
        return (
          <span key={p.id} className={'puce' + (ens.has(p.id) ? '' : ' off')}
            style={{ borderColor: f?.couleur || 'var(--gris)' }}
            onClick={() => basculer(p.id)}>{p.nom}</span>
        )
      })}
    </div>
  )
}

// Sélecteur multiple de PJ sous forme de puces cliquables.
export const PucesJoueurs = ({ ids, surChange }) => {
  const { univers } = useStudio()
  const ens = new Set(ids)
  const basculer = (id) => {
    ens.has(id) ? ens.delete(id) : ens.add(id)
    surChange([...ens])
  }
  return (
    <div>
      {univers.joueurs.map(j => {
        const f = univers.factions.find(x => x.id === j.faction)
        return (
          <span key={j.id} className={'puce' + (ens.has(j.id) ? '' : ' off')}
            style={{ borderColor: f?.couleur || 'var(--gris)' }}
            onClick={() => basculer(j.id)}>{j.personnage}</span>
        )
      })}
    </div>
  )
}

// Zone de dépôt d'un fichier .md/.txt : glisser un fichier dessus déclenche onTexte(contenu, nomSansExtension).
// Enveloppe n'importe quel bloc (un champ, une liste de sections...) sans changer sa mise en page.
// Le cadre reste visible en permanence (pas seulement au survol) : sur des zones voisines de petite taille
// (résumé, chaque section...), un cadre invisible tant qu'on ne survole pas est trop dur à viser précisément,
// et le dépôt finit systématiquement sur la zone la plus grande/visible plutôt que celle visée. D'où le repère
// permanent + le libellé toujours affiché sous chaque zone.
export const ZoneDepotMd = ({ onTexte, children, style, className = '', libelle = 'Déposer le fichier .md ici' }) => {
  const [survole, setSurvole] = React.useState(false)

  const lireFichier = (fichier) => {
    if (!fichier) return
    const nom = fichier.name.replace(/\.(md|markdown|txt)$/i, '')
    const lecteur = new FileReader()
    lecteur.onload = () => onTexte(String(lecteur.result || ''), nom)
    lecteur.readAsText(fichier, 'utf-8')
  }

  return (
    <div
      className={className}
      style={{
        ...style,
        position: 'relative',
        border: survole ? '2px dashed var(--or)' : '1px dashed var(--parch-mid)',
        borderRadius: 6,
        padding: 8,
        background: survole ? 'color-mix(in srgb, var(--or) 10%, transparent)' : 'transparent',
        transition: 'border-color .12s, background-color .12s',
      }}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (!survole) setSurvole(true) }}
      onDragLeave={e => { e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setSurvole(false) }}
      onDrop={e => {
        e.preventDefault()
        e.stopPropagation()
        setSurvole(false)
        const fichier = [...(e.dataTransfer.files || [])].find(f => /\.(md|markdown|txt)$/i.test(f.name))
        if (!fichier) return
        lireFichier(fichier)
      }}
    >
      {children}
      <div style={{
        fontSize: '.72rem', color: survole ? 'var(--or)' : 'var(--gris)',
        marginTop: 4, fontWeight: survole ? 600 : 400,
      }}>📄 {survole ? 'Lâcher ici' : libelle}</div>
    </div>
  )
}

// Parse un .md de session complet (structure # Titre / bloc d'intro / ## Scène 1 / ## Scène 2 / ...)
// en {titre, resume, sections: [{titre, contenu}], evenements: [{titre, desc}]}.
// Convention pour les événements : une section "## Événements" (accents/casse libres) en fin de fichier,
// avec un "### Titre" par événement suivi de sa description. Cette section est retirée des sections normales.
function normaliser(txt) {
  return String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function parserSessionMd(texte) {
  const lignes = String(texte || '').replace(/\r\n/g, '\n').split('\n')
  let i = 0
  while (i < lignes.length && !lignes[i].trim()) i++

  let titre = ''
  if (lignes[i] && /^#\s+/.test(lignes[i])) { titre = lignes[i].replace(/^#\s+/, '').trim(); i++ }

  const introLignes = []
  while (i < lignes.length && !/^##\s+/.test(lignes[i])) { introLignes.push(lignes[i]); i++ }
  const resume = introLignes.join('\n').replace(/^-{3,}\s*$/gm, '').trim()

  const sections = []
  const blocsEvenements = []
  while (i < lignes.length) {
    const m = lignes[i].match(/^##\s+(.+)$/)
    const secTitre = m ? m[1].replace(/^\d+(bis)?\.\s*/i, '').trim() : lignes[i].trim()
    i++
    const corps = []
    while (i < lignes.length && !/^##\s+/.test(lignes[i])) { corps.push(lignes[i]); i++ }
    const contenu = corps.join('\n').replace(/^-{3,}\s*$/gm, '').trim()
    if (normaliser(secTitre).match(/^evenements?$/)) {
      blocsEvenements.push(contenu)
    } else if (secTitre || contenu) {
      sections.push({ titre: secTitre, contenu })
    }
  }

  const evenements = []
  for (const bloc of blocsEvenements) {
    const lignesEvt = bloc.split('\n')
    let j = 0
    while (j < lignesEvt.length) {
      const m = lignesEvt[j].match(/^###\s+(.+)$/)
      if (!m) { j++; continue }
      const evtTitre = m[1].trim()
      j++
      const corps = []
      while (j < lignesEvt.length && !/^###\s+/.test(lignesEvt[j])) { corps.push(lignesEvt[j]); j++ }
      const desc = corps.join('\n').replace(/^-{3,}\s*$/gm, '').trim()
      if (evtTitre) evenements.push({ titre: evtTitre, desc })
    }
  }

  return { titre, resume, sections, evenements }
}

// Bouton d'import d'un .md de session ENTIER : parse la structure (# titre, intro, ## scènes)

// et restitue {titre, resume, sections}. À la différence de BoutonDepotMd/ZoneDepotMd, qui ne font
// que déverser du texte brut dans un seul champ, celui-ci découpe réellement le fichier.
export const BoutonImportSessionMd = ({ onSession, libelle = 'Importer un .md de session complète', style }) => {
  const [survole, setSurvole] = React.useState(false)
  const inputRef = React.useRef(null)

  const traiter = (fichier) => {
    if (!fichier) return
    const lecteur = new FileReader()
    lecteur.onload = () => onSession(parserSessionMd(String(lecteur.result || '')))
    lecteur.readAsText(fichier, 'utf-8')
  }

  return (
    <>
      <button type="button" className="btn clair" onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (!survole) setSurvole(true) }}
        onDragLeave={e => { e.stopPropagation(); setSurvole(false) }}
        onDrop={e => {
          e.preventDefault()
          e.stopPropagation()
          setSurvole(false)
          const fichier = [...(e.dataTransfer.files || [])].find(f => /\.(md|markdown|txt)$/i.test(f.name))
          traiter(fichier)
        }}
        style={{
          ...style,
          borderStyle: 'dashed',
          borderColor: survole ? 'var(--or)' : undefined,
          color: survole ? 'var(--or)' : undefined,
        }}>
        🗂️ {survole ? 'Lâcher ici' : libelle}
      </button>
      <input ref={inputRef} type="file" accept=".md,.markdown,.txt" style={{ display: 'none' }}
        onChange={e => { traiter(e.target.files?.[0]); e.target.value = '' }} />
    </>
  )
}

// Bouton compact de dépôt .md : glisser un fichier dessus OU cliquer pour parcourir. À placer dans une barre d'actions.
export const BoutonDepotMd = ({ onTexte, libelle = 'Glisser .md ici', style }) => {
  const [survole, setSurvole] = React.useState(false)
  const inputRef = React.useRef(null)

  const lireFichier = (fichier) => {
    if (!fichier) return
    const nom = fichier.name.replace(/\.(md|markdown|txt)$/i, '')
    const lecteur = new FileReader()
    lecteur.onload = () => onTexte(String(lecteur.result || ''), nom)
    lecteur.readAsText(fichier, 'utf-8')
  }

  return (
    <>
      <button type="button" className="btn clair" onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (!survole) setSurvole(true) }}
        onDragLeave={e => { e.stopPropagation(); setSurvole(false) }}
        onDrop={e => {
          e.preventDefault()
          e.stopPropagation()
          setSurvole(false)
          const fichier = [...(e.dataTransfer.files || [])].find(f => /\.(md|markdown|txt)$/i.test(f.name))
          lireFichier(fichier)
        }}
        style={{
          ...style,
          borderStyle: 'dashed',
          borderColor: survole ? 'var(--or)' : undefined,
          color: survole ? 'var(--or)' : undefined,
        }}>
        📄 {survole ? 'Lâcher ici' : libelle}
      </button>
      <input ref={inputRef} type="file" accept=".md,.markdown,.txt" style={{ display: 'none' }}
        onChange={e => { lireFichier(e.target.files?.[0]); e.target.value = '' }} />
    </>
  )
}

// Saisie d'une date sidérienne (an / saison / jour) -> index de jour ou null.
export const DateSiderienne = ({ label, valeur, surChange, optionnel = false }) => {
  const d = valeur != null ? depuisJour(valeur) : { an: '', sais: 0, jour: 1 }
  const emettre = (an, sais, jour) => {
    if (an === '' || isNaN(parseInt(an))) { surChange(null); return }
    surChange(versJour(parseInt(an), parseInt(sais) || 0, parseInt(jour) || 1))
  }
  return (
    <span style={{ display: 'block' }}>
      <label>{label}{optionnel ? ' (optionnel)' : ''}</label>
      <span className="rangee">
        <input className="etroit" type="number" placeholder="An" value={d.an}
          onChange={e => emettre(e.target.value, d.sais, d.jour)} />
        <select value={d.sais} onChange={e => emettre(d.an, e.target.value, d.jour)}>
          {SAISONS.map((s, i) => <option key={i} value={i}>{s}</option>)}
        </select>
        <input className="etroit" type="number" min="1" max="70" value={d.jour}
          onChange={e => emettre(d.an, d.sais, e.target.value)} />
      </span>
    </span>
  )
}

// Cadre générique liste (gauche) + fiche (droite), avec tri optionnel.
// tris : { libellé: (item) => valeur } ; le premier est le tri par défaut.
export const ListeFiche = ({ items, selId, surSel, surAjout, rendu, enfants, libelleAjout = '+ Ajouter', tris = null, groupe = null }) => {
  const cles = tris ? Object.keys(tris) : []
  const [tri, setTri] = React.useState(cles[0] || null)
  const affiches = tri && tris
    ? [...items].sort((a, b) => {
        const va = tris[tri](a), vb = tris[tri](b)
        if (typeof va === 'number' && typeof vb === 'number') return va - vb
        return String(va ?? '').localeCompare(String(vb ?? ''), 'fr')
      })
    : items
  return (
    <>
      <div className="liste">
        <button className="btn clair ajout" onClick={surAjout}>{libelleAjout}</button>
        {tris && (
          <div style={{ padding: '0 14px 8px' }}>
            <label>Trier par</label>
            <select value={tri} onChange={e => setTri(e.target.value)}>
              {cles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        {affiches.map((it, i) => {
          const grpActif = groupe && tri === cles[0]
          const entete = grpActif && (i === 0 || groupe(affiches[i - 1]) !== groupe(it))
            ? <div className="sous-titre-liste" key={'g' + i}>{groupe(it)}</div> : null
          return (
            <React.Fragment key={it.id}>
              {entete}
              <div className={'item' + (it.id === selId ? ' sel' : '')} onClick={() => surSel(it.id)}
                style={grpActif ? { paddingLeft: 22 } : undefined}>
                {rendu(it)}
              </div>
            </React.Fragment>
          )
        })}
      </div>
      <div className="fiche">
        {enfants || <div className="vide">Sélectionne un élément à gauche, ou crées-en un.</div>}
      </div>
    </>
  )
}


// ── Wikilinks : résout [[Nom]] vers l'entité correspondante ──
export function resoudreNom(univers, nom) {
  const n = nom.trim().toLowerCase()
  const chercher = (liste, type, cle) => {
    const x = liste.find(e => (e[cle] || '').toLowerCase() === n)
    return x ? { type, id: x.id } : null
  }
  return chercher(univers.pnjs, 'pnj', 'nom')
    || chercher(univers.joueurs, 'pj', 'personnage')
    || chercher(univers.factions, 'faction', 'nom')
    || chercher(univers.lieux, 'lieu', 'nom')
    || chercher(univers.campagnes, 'campagne', 'titre')
    || chercher(univers.arcs, 'arc', 'nom')
    || chercher(univers.evenements, 'evenement', 'titre')
}

// Extrait tous les [[Nom]] présents dans un texte (utilisé pour l'interconnexion / les liens retour).
export function extraireWikiliens(texte) {
  if (!texte) return []
  const noms = []
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g
  let m
  while ((m = re.exec(String(texte)))) noms.push(m[1].trim())
  return noms
}

// Rend un [[Nom]] en lien cliquable vers le Codex (utilisé par LigneRiche et Texte).
function Wikilien({ nom, libelle }) {
  const { univers, setOnglet, setCodexCible } = useStudio()
  const cible = resoudreNom(univers, nom)
  if (!cible) return <span style={{ color: 'var(--gris)', borderBottom: '1px dashed var(--gris)' }} title="Aucune entité ne porte ce nom">{libelle}</span>
  return <span onClick={() => { setCodexCible(cible); setOnglet('codex') }}
    style={{ color: '#b8912a', cursor: 'pointer', borderBottom: '1px dashed var(--or)' }}>{libelle}</span>
}

// Découpe une ligne de texte en morceaux : wikilinks, gras, italique, texte brut.
function LigneRiche({ texte }) {
  const morceaux = String(texte).split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(m => m !== '')
  return <>{morceaux.map((m, i) => {
    const lien = m.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
    if (lien) return <Wikilien key={i} nom={lien[1]} libelle={lien[2] || lien[1]} />
    const gras = m.match(/^\*\*([^*]+)\*\*$/)
    if (gras) return <strong key={i}>{gras[1]}</strong>
    const ital = m.match(/^\*([^*]+)\*$/)
    if (ital) return <em key={i}>{ital[1]}</em>
    return <React.Fragment key={i}>{m}</React.Fragment>
  })}</>
}

// ── Interconnexion : liens sortants et liens retour (backlinks) ──
// Décrit, pour chaque type d'entité, où chercher les [[wikilinks]] potentiels.
const CHAMPS_TEXTE_PAR_TYPE = {
  pnj: ['description', 'secrets'],
  pj: ['notes', 'secrets'],
  faction: ['description', 'objectifs', 'ressources'],
  lieu: ['description', 'secrets'],
  campagne: ['pitch', 'issues'],
  evenement: ['desc'],
  arc: ['description'],
}

const TOUTES_ENTITES = (univers) => ([
  ...univers.pnjs.map(e => ({ type: 'pnj', id: e.id, nom: e.nom, obj: e })),
  ...univers.joueurs.map(e => ({ type: 'pj', id: e.id, nom: e.personnage, obj: e })),
  ...univers.factions.map(e => ({ type: 'faction', id: e.id, nom: e.nom, obj: e })),
  ...univers.lieux.map(e => ({ type: 'lieu', id: e.id, nom: e.nom, obj: e })),
  ...univers.campagnes.map(e => ({ type: 'campagne', id: e.id, nom: e.titre, obj: e })),
  ...univers.evenements.map(e => ({ type: 'evenement', id: e.id, nom: e.titre, obj: e })),
  ...univers.arcs.map(e => ({ type: 'arc', id: e.id, nom: e.nom, obj: e })),
])

// Liste les entités qui référencent `cible` (type, id) via un [[wikilink]] dans un de leurs champs texte.
export function trouverBacklinks(univers, cible) {
  const nomCible = TOUTES_ENTITES(univers).find(e => e.type === cible.type && e.id === cible.id)?.nom
  if (!nomCible) return []
  const nomCibleBas = nomCible.trim().toLowerCase()
  const resultats = []
  TOUTES_ENTITES(univers).forEach(e => {
    if (e.type === cible.type && e.id === cible.id) return
    const champs = CHAMPS_TEXTE_PAR_TYPE[e.type] || []
    for (const champ of champs) {
      const noms = extraireWikiliens(e.obj[champ])
      if (noms.some(n => n.trim().toLowerCase() === nomCibleBas)) { resultats.push(e); break }
    }
  })
  return resultats
}

// Rend un texte au format markdown fonctionnel léger :
// # / ## / ### titres, **gras**, *italique*, listes "- item", [[wikilinks]] cliquables.
// Pas de dépendance externe : suffisant pour les zones de texte du Studio.
export function Texte({ children }) {
  if (!children) return null
  const lignes = String(children).split('\n')
  const blocs = []
  let listeCourante = null
  const clorreListe = () => { if (listeCourante) { blocs.push(listeCourante); listeCourante = null } }
  lignes.forEach((ligne, i) => {
    const titre = ligne.match(/^(#{1,3})\s+(.*)$/)
    const item = ligne.match(/^[-*]\s+(.*)$/)
    if (titre) {
      clorreListe()
      const Tag = ['h4', 'h5', 'h6'][titre[1].length - 1]
      blocs.push(<Tag key={i} style={{ margin: '.4em 0 .2em' }}><LigneRiche texte={titre[2]} /></Tag>)
    } else if (item) {
      if (!listeCourante) listeCourante = <ul key={'l' + i} style={{ margin: '.2em 0', paddingLeft: '1.3em' }} />
      listeCourante = { ...listeCourante, props: { ...listeCourante.props, children: [...(listeCourante.props.children || []), <li key={i}><LigneRiche texte={item[1]} /></li>] } }
    } else if (ligne.trim() === '') {
      clorreListe()
      blocs.push(<React.Fragment key={i} />)
    } else {
      clorreListe()
      blocs.push(<p key={i} style={{ margin: '.2em 0' }}><LigneRiche texte={ligne} /></p>)
    }
  })
  clorreListe()
  return <>{blocs}</>
}
