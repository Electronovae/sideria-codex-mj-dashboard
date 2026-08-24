import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFiche } from './useFiche.js'
import {
  COMPETENCES_PAR_CARAC, LIBELLES_COMPETENCES, LIBELLES_CARAC, LIBELLES_FACTIONS,
  PALIERS_MONTEE, modificateur,
} from './modeleFiche.js'

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

  const attaques = fiche.attacks ?? []
  const modifierAttaque = (i, ch, valeur) => {
    const copie = attaques.map((a, idx) => idx === i ? { ...a, [ch]: valeur } : a)
    modifier('attacks', copie)
  }
  const ajouterAttaque = () => modifier('attacks', [...attaques, { nom: '', bonus: '', degats: '' }])
  const retirerAttaque = (i) => modifier('attacks', attaques.filter((_, idx) => idx !== i))

  const inventaire = fiche.inventory ?? []
  const modifierObjet = (i, valeur) => modifier('inventory', inventaire.map((o, idx) => idx === i ? valeur : o))
  const ajouterObjet = () => modifier('inventory', [...inventaire, ''])
  const retirerObjet = (i) => modifier('inventory', inventaire.filter((_, idx) => idx !== i))

  const montees = fiche.montees_caracteristique ?? PALIERS_MONTEE.map(() => false)
  const basculerMontee = (i) => {
    const copie = montees.map((v, idx) => idx === i ? !v : v)
    modifier('montees_caracteristique', copie)
  }

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

      <section className="feuille-bloc">
        <h2>Identité</h2>
        <div className="fc-grille fc-grille--4">
          {champ('Nom', 'name')}
          {champ('Peuple / Origine', 'origin')}
          {champ('Niveau Sidérien', 'level', 'number')}
          {champ('XP', 'xp', 'number')}
        </div>
        <div className="fc-grille fc-grille--4" style={{ marginTop: 6 }}>
          {champ('Indice de Défense (ID)', 'indice_defense', 'number')}
          {champ('Initiative', 'initiative_bonus', 'number')}
          {champ('Perception passive', 'perception_passive', 'number')}
          {champ('SR de sort', 'sr_sort', 'number')}
        </div>
        <p className="feuille-note">Classe et sous-classe seront ajoutées à l'étape 2.</p>
      </section>

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
              <label className="carac-sauv">
                <input
                  type="checkbox"
                  checked={!!fiche.saving_throw_proficiencies?.[cle]}
                  onChange={e => modifierJson('saving_throw_proficiencies', cle, e.target.checked)}
                /> Sauv.
              </label>
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
            <p style={{ fontSize: '.68em', color: 'var(--gris)', fontStyle: 'italic', marginTop: 4 }}>Cristallite (CON/ÉCL) · Conduit · Traceur</p>
          </div>
        </div>

        <div className="feuille-sousbloc">
          <h3>Montées de caractéristique</h3>
          <div className="montees-grille">
            {PALIERS_MONTEE.map((palier, i) => (
              <label key={palier} className="montee-case">
                <input type="checkbox" checked={!!montees[i]} onChange={() => basculerMontee(i)} />
                Niv. {palier}
              </label>
            ))}
          </div>
        </div>
      </section>

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

        <div className="feuille-sousbloc">
          <h3>Armure et défense</h3>
          <div className="fc-grille fc-grille--3">
            {champ('Armure', 'armor_name')}
            {champ('Bouclier', 'shield_name')}
            {champ('Résistances / Immunités', 'resistances')}
          </div>
        </div>

        <div className="feuille-sousbloc">
          <h3>Convertisseur &amp; ressource spéciale</h3>
          <div className="fc-grille fc-grille--4">
            {champ('Type de convertisseur', 'convertisseur_type')}
            {champ('Mana max', 'mana_max', 'number')}
            {champ('Mana actuel', 'mana_current', 'number')}
            {champ('Type de ressource spéciale', 'ressource_speciale_type')}
          </div>
          <div className="fc-grille fc-grille--3">
            {champ('Ressource max', 'fragments_max', 'number')}
            {champ('Ressource actuelle', 'fragments_current', 'number')}
          </div>
        </div>

        <div className="feuille-sousbloc">
          <h3>Étincelle</h3>
          <div className="fc-grille fc-grille--3">
            {champJson('Dé actuel', 'spark', 'die')}
            {champJson('Utilisées', 'spark', 'current', 'number')}
            {champJson('Maximum', 'spark', 'max', 'number')}
          </div>
          <p className="feuille-note">Progression : 1d8 → 1d10 → 1d12 → 1d20</p>
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

      <section className="feuille-bloc">
        <h2>Attaques</h2>
        <table className="feuille-table">
          <thead><tr><th>Nom de l'attaque</th><th>Bonus</th><th>Dégâts / Type / Notes</th><th></th></tr></thead>
          <tbody>
            {attaques.map((a, i) => (
              <tr key={i}>
                <td><input value={a.nom ?? ''} onChange={e => modifierAttaque(i, 'nom', e.target.value)} /></td>
                <td><input value={a.bonus ?? ''} onChange={e => modifierAttaque(i, 'bonus', e.target.value)} style={{ width: 60 }} /></td>
                <td><input value={a.degats ?? ''} onChange={e => modifierAttaque(i, 'degats', e.target.value)} /></td>
                <td><button className="ligne-suppr" onClick={() => retirerAttaque(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="fiches-btn fiches-btn--discret" style={{ marginTop: 8 }} onClick={ajouterAttaque}>+ Ajouter une attaque</button>
      </section>

      <section className="feuille-bloc">
        <h2>Serment d'Éther</h2>
        <div className="fc-grille fc-grille--3">
          {champJson('Faction', 'oath', 'faction')}
          {champJson('Statut', 'oath', 'statut')}
          {champJson('Termes', 'oath', 'termes')}
        </div>
      </section>

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

      <section className="feuille-bloc">
        <h2>Traits, idéaux et liens</h2>
        <div className="fc-grille fc-grille--2">
          {champ('Trait de caractère', 'personality_trait')}
          {champ('Idéal', 'ideal')}
          {champ('Lien / attache', 'bond')}
          {champ('Défaut', 'flaw')}
        </div>
        <div className="fc-grille fc-grille--2">
          {champ('Peur / ligne rouge', 'fear_redline')}
        </div>
        <div className="fc-grille fc-grille--3" style={{ marginTop: 8 }}>
          {champListe('Alliés de confiance', 'relations', 'allies')}
          {champListe('Ennemis / rivaux', 'relations', 'enemies')}
          {champListe('Dettes / obligations', 'relations', 'debts')}
        </div>
      </section>

      <section className="feuille-bloc">
        <h2>Inventaire</h2>
        {inventaire.map((objet, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input value={objet} onChange={e => modifierObjet(i, e.target.value)} style={{ flex: 1 }} />
            <button className="ligne-suppr" onClick={() => retirerObjet(i)}>✕</button>
          </div>
        ))}
        <button className="fiches-btn fiches-btn--discret" style={{ marginTop: 4 }} onClick={ajouterObjet}>+ Ajouter un objet</button>

        <div className="fc-grille fc-grille--6" style={{ marginTop: 14 }}>
          {champJson('LE', 'currency', 'le', 'number')}
          {champJson('PP', 'currency', 'pp', 'number')}
          {champJson('PO', 'currency', 'po', 'number')}
          {champJson('PA', 'currency', 'pa', 'number')}
          {champJson('PC', 'currency', 'pc', 'number')}
          {champJson('Cristaux', 'currency', 'cristaux', 'number')}
        </div>
      </section>

      <section className="feuille-bloc">
        <h2>Notes libres</h2>
        <label className="fc-champ fc-champ--zone">
          <span>Notes</span>
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
