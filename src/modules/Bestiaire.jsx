import React, { useState } from 'react'
import { useStudio, Champ, SelecteurFaction, PuceFaction, ChampEditable, ListeFiche } from './communs.jsx'
import { nouvelleCreature, CARAS, uid } from '../lib/modele.js'

const LABEL_CARA = { for: 'FOR', dex: 'DEX', con: 'CON', int: 'INT', sag: 'SAG', cha: 'CHA', ecl: 'ÉCL' }

// Badge équilibré / à rééquilibrer, réutilisé dans la liste et dans la fiche.
const BadgeEquilibre = ({ equilibre }) => (
  <span className={'badge-equilibre' + (equilibre ? ' ok' : ' non')}>
    {equilibre ? '✓ Équilibré' : '⚠ À rééquilibrer'}
  </span>
)

// Bloc répétable { nom, description } : utilisé pour actions / actions bonus / réactions / capacités.
function BlocEntrees({ titre, aide, entrees, modifier }) {
  return (
    <>
      <h3>{titre}</h3>
      {aide && <p className="aide">{aide}</p>}
      {entrees.map((e, i) => (
        <div className="carte" key={i} style={{ marginBottom: 8 }}>
          <div className="rangee">
            <Champ label="Nom" value={e.nom} onChange={ev => modifier(arr => { arr[i].nom = ev.target.value })} />
            <button className="btn clair etroit" onClick={() => modifier(arr => { arr.splice(i, 1) })}>retirer</button>
          </div>
          <Champ label="Description" zone value={e.description}
            onChange={ev => modifier(arr => { arr[i].description = ev.target.value })} />
        </div>
      ))}
      <button className="btn clair" onClick={() => modifier(arr => { arr.push({ nom: '', description: '' }) })}>
        + entrée
      </button>
    </>
  )
}

export default function Bestiaire() {
  const { univers, maj } = useStudio()
  const [selId, setSelId] = useState(univers.creatures[0]?.id ?? null)
  const [filtre, setFiltre] = useState('toutes') // 'toutes' | 'equilibrees' | 'a-faire'
  const creature = univers.creatures.find(c => c.id === selId)

  const visibles = univers.creatures.filter(c => {
    if (filtre === 'equilibrees') return c.equilibre
    if (filtre === 'a-faire') return !c.equilibre
    return true
  })

  const ajouter = () => {
    const c = nouvelleCreature()
    maj(u => u.creatures.push(c))
    setSelId(c.id)
  }
  const modifier = (fn) => maj(u => { fn(u.creatures.find(c => c.id === selId)) })
  const modifierListe = (champ) => (fn) => modifier(c => fn(c[champ]))
  const supprimer = () => {
    if (!confirm(`Supprimer ${creature.nom} ?`)) return
    maj(u => { u.creatures = u.creatures.filter(c => c.id !== selId) })
    setSelId(null)
  }

  const nbEquilibrees = univers.creatures.filter(c => c.equilibre).length

  return (
    <ListeFiche
      items={visibles} selId={selId} surSel={setSelId} surAjout={ajouter}
      libelleAjout="+ Nouvelle créature"
      tris={{
        faction: c => (univers.factions.find(f => f.id === c.factionId)?.nom || 'zzz') + '·' + c.nom,
        nom: c => c.nom,
        code: c => c.code,
        puissance: c => c.facteurPuissance ?? -1,
        equilibre: c => (c.equilibre ? '0' : '1') + c.nom,
      }}
      groupe={c => univers.factions.find(f => f.id === c.factionId)?.nom || 'Sans faction'}
      entete={
        <div className="rangee" style={{ padding: '0 14px 10px', gap: 6 }}>
          <button className={'btn etroit' + (filtre === 'toutes' ? ' plein' : ' clair')}
            onClick={() => setFiltre('toutes')}>
            Toutes ({univers.creatures.length})
          </button>
          <button className={'btn etroit' + (filtre === 'equilibrees' ? ' plein' : ' clair')}
            onClick={() => setFiltre('equilibrees')}>
            ✓ Équilibrées ({nbEquilibrees})
          </button>
          <button className={'btn etroit' + (filtre === 'a-faire' ? ' plein' : ' clair')}
            onClick={() => setFiltre('a-faire')}>
            ⚠ À rééquilibrer ({univers.creatures.length - nbEquilibrees})
          </button>
        </div>
      }
      rendu={c => {
        const f = univers.factions.find(x => x.id === c.factionId)
        return (
          <>
            <span className="rond" style={{ background: f?.couleur || '#888' }} />
            <span>
              {c.nom}
              <div className="sous">
                {c.code && <code>{c.code}</code>}
                {c.code && ' · '}
                {c.facteurPuissance != null ? `FP ${c.facteurPuissance}` : 'FP ?'}
                {' · '}{c.equilibre ? '✓' : '⚠'}
              </div>
            </span>
          </>
        )
      }}
      enfants={creature && (
        <div key={creature.id}>
          <div className="rangee" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>{creature.nom}</h2>
            <BadgeEquilibre equilibre={creature.equilibre} />
          </div>

          <div className="rangee" style={{ marginTop: 10 }}>
            <button
              className={'btn' + (creature.equilibre ? ' plein' : ' clair')}
              onClick={() => modifier(c => { c.equilibre = !c.equilibre })}
            >
              {creature.equilibre ? '✓ Marquer comme équilibré' : '⚠ Marquer comme non équilibré'}
            </button>
          </div>

          <div className="rangee">
            <Champ label="Nom" value={creature.nom} onChange={e => modifier(c => { c.nom = e.target.value })} />
            <Champ label="Code" placeholder="VDJ-001" value={creature.code}
              onChange={e => modifier(c => { c.code = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Rang" value={creature.rang} onChange={e => modifier(c => { c.rang = e.target.value })} />
            <Champ label="Type" value={creature.type} onChange={e => modifier(c => { c.type = e.target.value })} />
            <Champ label="Alignement" value={creature.alignement}
              onChange={e => modifier(c => { c.alignement = e.target.value })} />
          </div>
          <div className="rangee">
            <span><label>Faction</label>
              <SelecteurFaction valeur={creature.factionId} surChange={v => modifier(c => { c.factionId = v })} />
            </span>
            {creature.factionId && <PuceFaction id={creature.factionId} />}
          </div>

          <div className="rangee">
            <Champ label="Image (URL)" placeholder="https://..." value={creature.image}
              onChange={e => modifier(c => { c.image = e.target.value })} />
            {creature.image && <span className="etroit">
              <img src={creature.image} alt={creature.nom}
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, marginTop: 18 }} />
            </span>}
          </div>

          <h3>Combat</h3>
          <div className="rangee">
            <Champ label="CA" type="number" value={creature.ca ?? ''}
              onChange={e => modifier(c => { c.ca = e.target.value === '' ? null : +e.target.value })} />
            <Champ label="CA (détail)" value={creature.caDetail}
              onChange={e => modifier(c => { c.caDetail = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="PV" type="number" value={creature.pv ?? ''}
              onChange={e => modifier(c => { c.pv = e.target.value === '' ? null : +e.target.value })} />
            <Champ label="PV (détail)" value={creature.pvDetail}
              onChange={e => modifier(c => { c.pvDetail = e.target.value })} />
            <Champ label="Vitesse" value={creature.vitesse}
              onChange={e => modifier(c => { c.vitesse = e.target.value })} />
          </div>

          <label>Caractéristiques</label>
          <div className="rangee" style={{ flexWrap: 'wrap' }}>
            {CARAS.map(k => (
              <span className="etroit" key={k}>
                <label>{LABEL_CARA[k]}</label>
                <div className="rangee" style={{ gap: 4 }}>
                  <input type="number" style={{ width: 52 }} value={creature.stats[k].val}
                    onChange={e => modifier(c => { c.stats[k].val = +e.target.value })} />
                  <input type="number" style={{ width: 48 }} title="modificateur" value={creature.stats[k].mod}
                    onChange={e => modifier(c => { c.stats[k].mod = +e.target.value })} />
                </div>
              </span>
            ))}
          </div>

          <div className="rangee">
            <Champ label="Jets de sauvegarde" value={creature.jetsSauvegarde}
              onChange={e => modifier(c => { c.jetsSauvegarde = e.target.value })} />
            <Champ label="Compétences" value={creature.competences}
              onChange={e => modifier(c => { c.competences = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Immunités" value={creature.immunites}
              onChange={e => modifier(c => { c.immunites = e.target.value })} />
            <Champ label="Résistances" value={creature.resistances}
              onChange={e => modifier(c => { c.resistances = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Sens" value={creature.sens} onChange={e => modifier(c => { c.sens = e.target.value })} />
            <Champ label="Langues" value={creature.langues}
              onChange={e => modifier(c => { c.langues = e.target.value })} />
            <Champ label="Facteur de Puissance" type="number" className="etroit"
              value={creature.facteurPuissance ?? ''}
              onChange={e => modifier(c => { c.facteurPuissance = e.target.value === '' ? null : +e.target.value })} />
          </div>

          <h3>Équipement Sidéria</h3>
          <div className="rangee">
            <Champ label="Armure" value={creature.equipement.armure}
              onChange={e => modifier(c => { c.equipement.armure = e.target.value })} />
            <Champ label="Arme principale" value={creature.equipement.armePrincipale}
              onChange={e => modifier(c => { c.equipement.armePrincipale = e.target.value })} />
          </div>
          <div className="rangee">
            <Champ label="Arme secondaire" value={creature.equipement.armeSecondaire}
              onChange={e => modifier(c => { c.equipement.armeSecondaire = e.target.value })} />
            <Champ label="Équipement" value={creature.equipement.equipement}
              onChange={e => modifier(c => { c.equipement.equipement = e.target.value })} />
          </div>

          <BlocEntrees titre="Actions" entrees={creature.actions} modifier={modifierListe('actions')} />
          <BlocEntrees titre="Actions bonus" entrees={creature.actionsBonus} modifier={modifierListe('actionsBonus')} />
          <BlocEntrees titre="Réactions" entrees={creature.reactions} modifier={modifierListe('reactions')} />
          <BlocEntrees titre="Capacités" entrees={creature.capacites} modifier={modifierListe('capacites')} />

          <label className="aide">Tactique MJ</label>
          <ChampEditable valeur={creature.tactiqueMj} vide="Aucune tactique renseignée."
            surChange={v => modifier(c => { c.tactiqueMj = v })} />

          <label className="aide">Prompt image</label>
          <ChampEditable valeur={creature.promptImage} vide="Aucun prompt renseigné."
            surChange={v => modifier(c => { c.promptImage = v })} />

          <label className="aide">Lore</label>
          <ChampEditable valeur={creature.lore} vide="Aucun lore renseigné."
            surChange={v => modifier(c => { c.lore = v })} />

          <div style={{ marginTop: 24 }}>
            <button className="btn danger" onClick={supprimer}>Supprimer cette créature</button>
          </div>
        </div>
      )}
    />
  )
}
