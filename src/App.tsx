import { useState } from 'react'
import { useCharacter } from './hooks/useCharacter'
import { useClasses }   from './hooks/useClasses'
import { useSpells }    from './hooks/useSpells'
import Header           from './components/character/sections/Header'
import CoreStats        from './components/character/sections/CoreStats'
import Combat           from './components/character/sections/Combat'
import Attacks          from './components/character/sections/Attacks'
import Inventory        from './components/character/sections/Inventory'
import Factions         from './components/character/sections/Factions'
import PersonalityTraits from './components/character/sections/PersonalityTraits'
import ClassFeatures    from './components/character/sections/ClassFeatures'
import ClassPicker      from './components/character/ClassPicker'
import SpellList        from './components/character/SpellList'
import './components/character/CharacterSheet.css'

const TEST_CHARACTER_ID = 'c6eeff55-4151-4641-92e8-ad00a5c34fe5'

type Tab = 'session' | 'lore'

function App() {
  const { character, loading, error, saved, update, updateJson, updateArray } = useCharacter(TEST_CHARACTER_ID)
  const { classes } = useClasses()
  const { spells }  = useSpells()
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [classLocked, setClassLocked] = useState(false)
  const [tab, setTab] = useState<Tab>('session')

  if (loading) return <div className="sheet-loading">Chargement de la fiche…</div>
  if (error)   return <div className="sheet-loading">Erreur : {error}</div>

  const primaryClass = classes.find(c => c.id === character.class_primary_id) ?? character.class_primary ?? null
  const subclasses   = primaryClass?.subclasses ?? []

  // Sorts connus : stockés dans character.active_features avec feature_id préfixé "spell-"
  const knownSpellIds = (character.active_features ?? [])
    .filter((f: any) => f.feature_id?.startsWith('spell-'))
    .map((f: any) => f.feature_id.replace('spell-', ''))

  const toggleSpell = (spellId: string) => {
    const current = character.active_features ?? []
    const key = `spell-${spellId}`
    if (knownSpellIds.includes(spellId)) {
      updateArray('active_features', current.filter((f: any) => f.feature_id !== key))
    } else {
      updateArray('active_features', [...current, { feature_id: key, class_id: null, is_subclass: false, used: false }])
    }
  }

  return (
    <>
      <div className="sheet-page">
        {/* Header barre bleue */}
        <div className="sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="sheet-header-title">
              The Sideria Codex <span>— Fiche de Personnage</span>
            </span>
            {/* Onglets */}
            {(['session', 'lore'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                border: `1px solid ${tab === t ? 'var(--gold-l)' : 'rgba(255,255,255,.3)'}`,
                background: tab === t ? 'rgba(200,150,14,.2)' : 'transparent',
                color: tab === t ? 'var(--gold-l)' : 'rgba(255,255,255,.6)',
                fontFamily: 'Cinzel,serif', fontSize: '7pt', padding: '2px 8px',
                cursor: 'pointer', borderRadius: '2px', letterSpacing: '.04em',
              }}>
                {t === 'session' ? '⚔ Session' : '📖 Lore & Sorts'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`sheet-header-sub ${saved ? 'saved' : 'saving'}`}>
              {saved ? 'Enregistré ✓' : 'Enregistrement…'}
            </span>
          </div>
        </div>

        <div className="sheet-inner">
          {/* ── Header identité ── */}
          <div className="box" style={{ marginBottom: '2px' }}>
            <div className="bt">Identité</div>
            <div className="bb">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {/* Nom */}
                <div className="field" style={{ flex: 2, minWidth: '120px' }}>
                  <label>Nom :</label>
                  <input className="field-input" style={{ fontSize: '12pt', fontWeight: 600 }}
                    value={character.name || ''} onChange={e => update('name', e.target.value)} />
                </div>

                {/* Classe avec select + cadenas */}
                <div className="field" style={{ flex: 1, minWidth: '120px', alignItems: 'center' }}>
                  <label>Classe :</label>
                  <select
                    disabled={classLocked}
                    value={character.class_primary_id ?? ''}
                    onChange={e => update('class_primary_id', e.target.value || null)}
                    style={{
                      flex: 1, border: 'none', borderBottom: '1px solid var(--ink)',
                      background: 'transparent', fontFamily: 'Crimson Pro,serif', fontSize: '10pt',
                      color: 'var(--blue)', fontWeight: 600, outline: 'none', cursor: classLocked ? 'not-allowed' : 'pointer',
                    }}>
                    <option value="">— Choisir —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Subclasse */}
                {subclasses.length > 0 && (
                  <div className="field" style={{ flex: 1, minWidth: '120px' }}>
                    <label>Subclasse :</label>
                    <select
                      disabled={classLocked}
                      value={character.subclass_primary_id ?? ''}
                      onChange={e => update('subclass_primary_id', e.target.value || null)}
                      style={{
                        flex: 1, border: 'none', borderBottom: '1px solid var(--ink)',
                        background: 'transparent', fontFamily: 'Crimson Pro,serif', fontSize: '10pt',
                        color: 'var(--gold)', outline: 'none', cursor: classLocked ? 'not-allowed' : 'pointer',
                      }}>
                      <option value="">— Choisir —</option>
                      {subclasses.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Cadenas */}
                <button
                  onClick={() => setClassLocked(!classLocked)}
                  title={classLocked ? 'Déverrouiller la classe' : 'Verrouiller la classe'}
                  style={{
                    border: '1px solid var(--blue)', borderRadius: '2px',
                    background: classLocked ? 'var(--blue)' : 'var(--parch-mid)',
                    color: classLocked ? '#fff' : 'var(--blue)',
                    fontSize: '10pt', padding: '2px 6px', cursor: 'pointer', flexShrink: 0,
                  }}>
                  {classLocked ? '🔒' : '🔓'}
                </button>

                {/* Bouton ClassPicker modal */}
                {!classLocked && (
                  <button onClick={() => setShowClassPicker(true)} style={{
                    border: '1px solid var(--gold)', background: 'var(--parch-mid)',
                    color: 'var(--gold)', fontFamily: 'Cinzel,serif', fontSize: '7pt',
                    padding: '3px 8px', cursor: 'pointer', borderRadius: '2px', flexShrink: 0,
                  }}>◆ Fiche détaillée</button>
                )}

                {/* Stats identité */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {[
                    { label: 'NIV.', field: 'level', type: 'number' as const },
                    { label: 'XP',   field: 'xp',    type: 'number' as const },
                  ].map(({ label, field, type }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                      <span style={{ fontFamily: 'Cinzel,serif', fontSize: '6pt', fontWeight: 700, color: 'var(--gray)' }}>{label}</span>
                      <input type={type}
                        value={character[field] ?? 0}
                        onChange={e => update(field, parseInt(e.target.value) || 0)}
                        style={{
                          width: '40px', textAlign: 'center', border: '1px solid var(--blue)',
                          borderRadius: '2px', background: 'var(--parch-mid)',
                          fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '10pt',
                          color: 'var(--blue)', outline: 'none', padding: '1px 0',
                        }} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                    <span style={{ fontFamily: 'Cinzel,serif', fontSize: '6pt', fontWeight: 700, color: 'var(--gray)' }}>DR</span>
                    <span style={{
                      width: '40px', textAlign: 'center', border: '1px solid var(--blue)',
                      borderRadius: '2px', background: 'var(--parch-mid)',
                      fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '10pt', color: 'var(--blue)',
                      padding: '1px 0', display: 'block',
                    }}>+{character.proficiency_bonus ?? 2}</span>
                  </div>
                </div>

                {/* Origine */}
                <div className="field" style={{ flex: 1, minWidth: '80px' }}>
                  <label>Origine :</label>
                  <input className="field-input" value={character.origin || ''} onChange={e => update('origin', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── PAGE SESSION ── */}
          {tab === 'session' && (
            <div className="sheet-grid" style={{ flex: 1, minHeight: 0 }}>
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

          {/* ── PAGE LORE & SORTS ── */}
          {tab === 'lore' && (
            <div className="sheet-grid" style={{ flex: 1, minHeight: 0, gridTemplateColumns: '1fr 1.4fr' }}>
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
                <div className="box" style={{ flex: 1 }}>
                  <div className="bt">Sorts — Compendium Éthérique</div>
                  <div className="bb" style={{ padding: '4px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <SpellList
                      spells={spells}
                      knownSpellIds={knownSpellIds}
                      onToggle={toggleSpell}
                    />
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

export default App
