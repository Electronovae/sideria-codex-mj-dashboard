import { useState } from 'react'
import { useCharacter } from '../hooks/useCharacter'
import { useClasses } from '../hooks/useClasses'
import CoreStats from '../components/character/sections/CoreStats'
import Combat from '../components/character/sections/Combat'
import Attacks from '../components/character/sections/Attacks'
import Inventory from '../components/character/sections/Inventory'
import Factions from '../components/character/sections/Factions'
import PersonalityTraits from '../components/character/sections/PersonalityTraits'
import ClassFeatures from '../components/character/sections/ClassFeatures'
import ClassPicker from '../components/character/ClassPicker'
import SpellBrowser from '../components/SpellBrowser'
import '../components/character/CharacterSheet.css'
import './CharacterSheetPage.css'

type Tab = 'session' | 'lore'

type Props = {
  characterId: string
}

export default function CharacterSheetPage({ characterId }: Props) {
  const { character, loading, error, saved, update, updateJson, updateArray } = useCharacter(characterId)
  const { classes } = useClasses()
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [classLocked, setClassLocked] = useState(false)
  const [tab, setTab] = useState<Tab>('session')

  if (loading) return <div className="sheet-loading">Chargement de la fiche…</div>
  if (error) return <div className="sheet-loading">Erreur : {error}</div>

  const primaryClass = classes.find(c => c.id === character.class_primary_id) ?? character.class_primary ?? null
  const subclasses = primaryClass?.subclasses ?? []

  return (
    <>
      <div className="sheet-page character-sheet-page">
        <div className="sheet-header">
          <div className="sheet-header-actions">
            <span className="sheet-header-title">
              The Sideria Codex <span>— Fiche de Personnage</span>
            </span>
            <div className="sheet-tabs" role="tablist" aria-label="Sections de la fiche">
              {(['session', 'lore'] as Tab[]).map(t => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  className={`sheet-tab${tab === t ? ' active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t === 'session' ? '⚔ Session' : '📖 Lore & Sorts'}
                </button>
              ))}
            </div>
          </div>
          <span className={`sheet-header-sub ${saved ? 'saved' : 'saving'}`}>
            {saved ? 'Enregistré ✓' : 'Enregistrement…'}
          </span>
        </div>

        <div className="sheet-inner">
          <div className="box identity-box">
            <div className="bt">Identité</div>
            <div className="bb">
              <div className="identity-row">
                <div className="field identity-name">
                  <label htmlFor="char-name">Nom</label>
                  <input
                    id="char-name"
                    className="field-input"
                    value={character.name || ''}
                    onChange={e => update('name', e.target.value)}
                  />
                </div>

                <div className="field identity-field">
                  <label htmlFor="char-class">Classe</label>
                  <select
                    id="char-class"
                    className="sheet-select"
                    disabled={classLocked}
                    value={character.class_primary_id ?? ''}
                    onChange={e => update('class_primary_id', e.target.value || null)}
                  >
                    <option value="">— Choisir —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {subclasses.length > 0 && (
                  <div className="field identity-field">
                    <label htmlFor="char-subclass">Subclasse</label>
                    <select
                      id="char-subclass"
                      className="sheet-select sheet-select--gold"
                      disabled={classLocked}
                      value={character.subclass_primary_id ?? ''}
                      onChange={e => update('subclass_primary_id', e.target.value || null)}
                    >
                      <option value="">— Choisir —</option>
                      {subclasses.map((s: { id: string; name: string }) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="identity-actions">
                  <button
                    type="button"
                    className={`sheet-btn sheet-btn--lock${classLocked ? ' locked' : ''}`}
                    onClick={() => setClassLocked(!classLocked)}
                    title={classLocked ? 'Déverrouiller la classe' : 'Verrouiller la classe'}
                    aria-label={classLocked ? 'Déverrouiller la classe' : 'Verrouiller la classe'}
                  >
                    {classLocked ? '🔒 Verrouillé' : '🔓 Classe'}
                  </button>

                  {!classLocked && (
                    <button
                      type="button"
                      className="sheet-btn sheet-btn--gold"
                      onClick={() => setShowClassPicker(true)}
                    >
                      ◆ Fiche détaillée
                    </button>
                  )}
                </div>

                <div className="identity-stats">
                  {[
                    { label: 'NIV.', field: 'level' as const },
                    { label: 'XP', field: 'xp' as const },
                  ].map(({ label, field }) => (
                    <div key={label} className="identity-stat">
                      <span className="identity-stat-label">{label}</span>
                      <input
                        type="number"
                        className="identity-stat-input"
                        value={character[field] ?? 0}
                        onChange={e => update(field, parseInt(e.target.value) || 0)}
                        aria-label={label}
                      />
                    </div>
                  ))}
                  <div className="identity-stat">
                    <span className="identity-stat-label">DR</span>
                    <span className="identity-stat-value">
                      +{character.proficiency_bonus ?? 2}
                    </span>
                  </div>
                </div>

                <div className="field identity-field">
                  <label htmlFor="char-origin">Origine</label>
                  <input
                    id="char-origin"
                    className="field-input"
                    value={character.origin || ''}
                    onChange={e => update('origin', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {tab === 'session' && (
            <div className="sheet-grid sheet-grid--session">
              <div className="sheet-col">
                <CoreStats
                  stats={character.stats ?? {}}
                  skillProficiencies={character.skill_proficiencies ?? {}}
                  savingThrows={character.saving_throw_proficiencies ?? {}}
                  proficiencyBonus={character.proficiency_bonus ?? 2}
                  updateJson={updateJson}
                />
              </div>
              <div className="sheet-col">
                <Combat character={character} update={update} updateJson={updateJson} />
              </div>
              <div className="sheet-col">
                <Attacks attacks={character.attacks ?? []} updateArray={updateArray} />
                <PersonalityTraits character={character} update={update} />
              </div>
              <div className="sheet-col">
                <Factions
                  factions={character.factions ?? {}}
                  serment={{ faction: '', statut: '', termes: '' }}
                  updateJson={updateJson}
                  update={update}
                />
              </div>
            </div>
          )}

          {tab === 'lore' && (
            <div className="sheet-grid sheet-grid--lore">
              <div className="sheet-col">
                <ClassFeatures
                  classData={primaryClass}
                  subclassId={character.subclass_primary_id ?? null}
                  characterLevel={character.level ?? 1}
                  activeFeatures={character.active_features ?? []}
                  updateArray={updateArray}
                />
                <Inventory
                  inventory={character.inventory ?? []}
                  currency={character.currency ?? {}}
                  updateArray={updateArray}
                  updateJson={updateJson}
                />
              </div>
              <div className="sheet-col">
                <div className="box spell-browser-box">
                  <div className="bt">Sorts — Compendium Éthérique</div>
                  <div className="bb">
                    <SpellBrowser />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sheet-footer">
          <span className="sheet-footer-l">The Sideria Codex — L'Ère de l'Éther — {character.name}</span>
          <span className="sheet-footer-r">Entre la grève qui couve et la rouille qui avance, Sideria tient sur un fil.</span>
        </div>
      </div>

      {showClassPicker && (
        <ClassPicker
          classes={classes}
          character={character}
          update={update}
          onClose={() => setShowClassPicker(false)}
        />
      )}
    </>
  )
}
