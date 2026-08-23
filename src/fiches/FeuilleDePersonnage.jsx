import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFiche } from './useFiche.js'
import { COMPETENCES_PAR_CARAC, LIBELLES_COMPETENCES, LIBELLES_CARAC, LIBELLES_FACTIONS, modificateur } from './modeleFiche.js'

const ETAPES_CRISTALLITE = [
  ['0', 'Exposition'], ['1', 'Précoce'], ['1b', 'Consolidé'], ['2', 'Avancé'],
  ['3', 'Critique'], ['4', 'Terminal'], ['5', 'Passage'], ['6', 'Fusion'],
]

export default function FeuilleDePersonnage({ estMJ }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fiche, chargement, erreur, enregistrement, modifiee, dernierEnregistrement, modifier, modifierJson, enregistrer } = useFiche(id)

  if (chargement) return <div className="fiches-message">Chargement de la fiche…</div>
  if (erreur) return <div className="fiches-message fiches-message--erreur">{erreur}</div>
  if (!fiche) return null

  const champ = (label, cle, type = 'text') => (
    <label className="fc-champ">
      <span>{label}</span>
      <input type={type} value={fiche[cle] ?? ''} onChange={e => modifier(cle, type === 'number' ? Number(e.target.value) : e.target.value)} />
    </label>
  )

  const champJson = (label, groupe, cle, type = 'text') => (
    <label className="fc-champ">
      <span>{label}</span>
      <input
        type={type}
        value={fiche[groupe]?.[cle] ?? ''}
        onChange={e => modifierJson(groupe, cle, type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </label>
  )

  const champListe = (label, groupe, cle) => (
    <label className="fc-champ">
      <span>{label}</span>
      <input
        type="text"
        placeholder="séparés par des virgules"
        value={(fiche[groupe]?.[cle] ?? []).join(', ')}
        onChange={e => modifierJson(groupe, cle, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
      />
    </label>
  )

  return (
    <div className="feuille">
      <div className="feuille-barre">
        <button className="fiches-btn fiches-btn--discret" onClick={() => navigate('..')}>← Retour</button>
        <div className="feuille-statut">
          {enregistrement ? 'Enregistrement…' : modifiee ? 'Modifications non enregistrées' : dernierEnregistrement ? `Enregistré à ${dernierEnregistrement.toLocaleTimeString()}` : 'À jour'}
        </div>
        <button className="fiches-btn" disabled={!modifiee || enregistrement} onClick={enregistrer}>
          Enregistrer la fiche
        </button>
      </div>

      {/* IDENTITÉ */}
      <section className="feuille-bloc">
        <h2>Identité</h2>
        <div className="fc-grille fc-grille--4">
          {champ('Nom', 'name')}
          {champ('Peuple / Origine', 'origin')}
          {champ('Niveau', 'level', 'number')}
          {champ('XP', 'xp', 'number')}
        </div>
        <p className="feuille-note">Classe et sous-classe seront ajoutées à l'étape 2.</p>
      </section>

      {/* CARACTÉRISTIQUES */}
      <section className="feuille-bloc">
        <h2>Caractéristiques</h2>
        <div className="carac-grille">
          {Object.entries(LIBELLES_CARAC).map(([cle, libelle]) => (
            <div key={cle} className="carac-bloc">
              <div className="carac-nom">{libelle}</div>
              <input
                type="number" className="carac-valeur"
                value={fiche.stats?.[cle] ?? 10}
                onChange={e => modifierJson('stats', cle, Number(e.target.value))}
              />
              <div className="carac-mod">{modificateur(fiche.stats?.[cle]) >= 0 ? '+' : ''}{modificateur(fiche.stats?.[cle])}</div>
              <div className="carac-competences">
                {COMPETENCES_PAR_CARAC[cle].map(comp => (
                  <label key={comp} className="carac-comp">
                    <input
                      type="checkbox"
                      checked={!!fiche.skill_proficiencies?.[comp]}
                      onChange={e => modifierJson('skill_proficiencies', comp, e.target.checked)}
                    />
                    {LIBELLES_COMPETENCES[comp]}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="carac-bloc carac-bloc--ecl">
            <div className="carac-nom">Éclat (ÉCL)</div>
            <input type="number" className="carac-valeur" value={fiche.stats?.ecl ?? 0}
              onChange={e => modifierJson('stats', 'ecl', Number(e.target.value))} />
            <div className="carac-mod">{modificateur(fiche.stats?.ecl ?? 0) >= 0 ? '+' : ''}{modificateur(fiche.stats?.ecl ?? 0)}</div>
          </div>
        </div>
      </section>

      {/* COMBAT */}
      <section className="feuille-bloc">
        <h2>Combat &amp; Ressources</h2>
        <div className="fc-grille fc-grille--6">
          {champ('PV Max', 'hp_max', 'number')}
          {champ('PV Actuels', 'hp_current', 'number')}
          {champ('PV Temp.', 'hp_temp', 'number')}
          {champ('GRD', 'armor_class', 'number')}
          {champ('Vitesse (m/tour)', 'speed', 'number')}
          {champ('Dés de résistance restants', 'hit_dice_remaining', 'number')}
        </div>
        <div className="fc-grille fc-grille--4">
          {champ('Mana max', 'mana_max', 'number')}
          {champ('Mana actuel', 'mana_current', 'number')}
          {champ('Fragments max', 'fragments_max', 'number')}
          {champ('Fragments actuels', 'fragments_current', 'number')}
        </div>

        <div className="feuille-sousbloc">
          <h3>Étincelle</h3>
          <div className="fc-grille fc-grille--3">
            {champJson('Dé actuel', 'spark', 'die')}
            {champJson('Utilisées', 'spark', 'current', 'number')}
            {champJson('Maximum', 'spark', 'max', 'number')}
          </div>
        </div>

        <div className="feuille-sousbloc">
          <h3>Jets de mort</h3>
          <div className="fc-grille fc-grille--3">
            {champ('Succès', 'death_saves_success', 'number')}
            {champ('Échecs', 'death_saves_failure', 'number')}
            <label className="fc-champ fc-champ--case">
              <input type="checkbox" checked={!!fiche.is_stable} onChange={e => modifier('is_stable', e.target.checked)} />
              <span>Stabilisé</span>
            </label>
          </div>
        </div>

        <div className="feuille-sousbloc">
          <h3>Cristallite</h3>
          <table className="feuille-table">
            <thead><tr><th>Stade</th><th>Nom</th></tr></thead>
            <tbody>
              {ETAPES_CRISTALLITE.map(([code, nom]) => (
                <tr key={code}>
                  <td>{code}</td>
                  <td>
                    <label className="fc-champ--case">
                      <input
                        type="radio" name="cristallite" checked={String(fiche.cristallite) === code}
                        onChange={() => modifier('cristallite', code)}
                      /> {nom}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SERMENT D'ÉTHER */}
      <section className="feuille-bloc">
        <h2>Serment d'Éther</h2>
        <div className="fc-grille fc-grille--3">
          {champJson('Faction', 'oath', 'faction')}
          {champJson('Statut', 'oath', 'statut')}
          {champJson('Termes', 'oath', 'termes')}
        </div>
      </section>

      {/* FACTIONS */}
      <section className="feuille-bloc">
        <h2>Réputation des factions</h2>
        <div className="fc-grille fc-grille--3">
          {Object.entries(LIBELLES_FACTIONS).map(([cle, libelle]) => (
            <label key={cle} className="fc-champ">
              <span>{libelle}</span>
              <input
                type="number" min="-5" max="4"
                value={fiche.factions?.[cle] ?? 0}
                onChange={e => modifierJson('factions', cle, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      </section>

      {/* TRAITS & LIENS */}
      <section className="feuille-bloc">
        <h2>Traits, idéaux et liens</h2>
        <div className="fc-grille fc-grille--2">
          {champ('Trait de caractère', 'personality_trait')}
          {champ('Idéal', 'ideal')}
          {champ('Lien / attache', 'bond')}
          {champ('Défaut / ligne rouge', 'flaw')}
        </div>
        <div className="fc-grille fc-grille--3">
          {champListe('Alliés de confiance', 'relations', 'allies')}
          {champListe('Ennemis / rivaux', 'relations', 'enemies')}
          {champListe('Dettes / obligations', 'relations', 'debts')}
        </div>
      </section>

      {/* MONNAIE & NOTES */}
      <section className="feuille-bloc">
        <h2>Monnaie &amp; notes libres</h2>
        <div className="fc-grille fc-grille--5">
          {champJson('LE', 'currency', 'pp', 'number')}
          {champJson('PO', 'currency', 'po', 'number')}
          {champJson('PA', 'currency', 'pa', 'number')}
          {champJson('PC', 'currency', 'pc', 'number')}
          {champJson('Cristaux', 'currency', 'cristaux', 'number')}
        </div>
        <label className="fc-champ fc-champ--zone">
          <span>Notes libres</span>
          <textarea rows={6} value={fiche.notes ?? ''} onChange={e => modifier('notes', e.target.value)} />
        </label>
        {estMJ && (
          <label className="fc-champ fc-champ--zone fc-champ--mj">
            <span>Notes MJ (visibles par le MJ uniquement)</span>
            <textarea rows={4} value={fiche.notes_mj ?? ''} onChange={e => modifier('notes_mj', e.target.value)} />
          </label>
        )}
      </section>

      <div className="feuille-barre feuille-barre--basse">
        <button className="fiches-btn" disabled={!modifiee || enregistrement} onClick={enregistrer}>
          Enregistrer la fiche
        </button>
      </div>
    </div>
  )
}
