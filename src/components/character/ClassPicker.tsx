import { useState } from 'react'
import '../character/CharacterSheet.css'

interface Feature {
  id: string; level: number; name: string; description: string
  cost_type: string; cost_amount: number
}
interface Subclass { id: string; name: string; description: string; features: Feature[] }
interface ClassData { id: string; name: string; hit_dice: number; primary_stat: string; description?: string; features: Feature[]; subclasses: Subclass[] }

interface Props {
  classes:    ClassData[]
  character:  any
  update:     (field: string, value: any) => void
  onClose:    () => void
}

type Step = 'class' | 'subclass' | 'confirm'

export default function ClassPicker({ classes, character, update, onClose }: Props) {
  const [step, setStep] = useState<Step>('class')
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [selectedSubclass, setSelectedSubclass] = useState<Subclass | null>(null)

  const handleSelectClass = (cls: ClassData) => {
    setSelectedClass(cls)
    setSelectedSubclass(null)
    setStep('subclass')
  }

  const handleSelectSubclass = (sub: Subclass) => {
    setSelectedSubclass(sub)
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (!selectedClass) return
    update('class_primary_id', selectedClass.id)
    update('subclass_primary_id', selectedSubclass?.id ?? null)
    onClose()
  }

  const COST_COLORS: Record<string, string> = {
    '1': '#6B8E23', '2': '#4682B4', '3': '#9A6E1A',
    '4': '#8B4513', '5': '#6B3A8E', '6': '#8B1A1A',
    '7': '#1A1A8B', '8': '#2E4A1A', '9': '#4A2E1A', '10': '#1A2E4A',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: 'var(--parch-min)', border: '2px solid var(--gold)',
        borderRadius: '4px', width: '900px', maxWidth: '95vw',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.6)'
      }}>
        {/* Header modal */}
        <div style={{ background: 'var(--blue)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-l)', fontSize: '11pt', fontWeight: 700 }}>
            {step === 'class' && 'Choisir une classe'}
            {step === 'subclass' && `${selectedClass?.name} — Choisir une subclasse`}
            {step === 'confirm' && 'Confirmer le choix'}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Fil d'Ariane */}
            {['class', 'subclass', 'confirm'].map((s, i) => (
              <span key={s} style={{
                fontFamily: 'Cinzel, serif', fontSize: '7pt',
                color: step === s ? 'var(--gold-l)' : 'rgba(255,255,255,.4)',
                cursor: i < ['class','subclass','confirm'].indexOf(step) ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (s === 'class') { setStep('class'); setSelectedClass(null); setSelectedSubclass(null) }
                if (s === 'subclass' && selectedClass) { setStep('subclass'); setSelectedSubclass(null) }
              }}>
                {s === 'class' ? 'Classe' : s === 'subclass' ? 'Subclasse' : 'Confirmer'}
                {i < 2 && <span style={{ margin: '0 4px', color: 'rgba(255,255,255,.3)' }}>›</span>}
              </span>
            ))}
            <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,.6)', fontSize: '14pt', cursor: 'pointer', padding: '0 4px', marginLeft: '8px' }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>

          {/* ÉTAPE 1 : Sélection de la classe */}
          {step === 'class' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
              {classes.map(cls => (
                <div key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  style={{
                    border: `1px solid var(--blue)`, borderRadius: '3px',
                    cursor: 'pointer', overflow: 'hidden',
                    transition: 'border-color .15s, box-shadow .15s',
                    background: character.class_primary_id === cls.id ? 'color-mix(in srgb, var(--blue) 8%, var(--parch-min))' : 'var(--parch-min)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-l)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = character.class_primary_id === cls.id ? 'var(--blue)' : 'var(--blue)')}
                >
                  <div style={{ background: 'var(--blue)', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-l)', fontSize: '9pt', fontWeight: 700 }}>{cls.name}</span>
                    <span style={{ fontSize: '7pt', color: 'rgba(255,255,255,.6)', fontStyle: 'italic' }}>d{cls.hit_dice}</span>
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    {cls.description && (
                      <p style={{ fontSize: '8pt', color: 'var(--gray)', fontStyle: 'italic', marginBottom: '6px', lineHeight: 1.4 }}>{cls.description}</p>
                    )}
                    <div style={{ fontSize: '7pt', color: 'var(--blue)', marginBottom: '3px', fontFamily: 'Cinzel, serif', fontWeight: 600 }}>
                      {cls.subclasses.length} subclasse{cls.subclasses.length > 1 ? 's' : ''} disponible{cls.subclasses.length > 1 ? 's' : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {cls.subclasses.map(sub => (
                        <span key={sub.id} style={{
                          background: 'var(--parch-mid)', border: '1px solid var(--parch-dk)',
                          borderRadius: '2px', padding: '1px 4px', fontSize: '6.5pt', color: 'var(--gray)'
                        }}>{sub.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ÉTAPE 2 : Sélection de la subclasse */}
          {step === 'subclass' && selectedClass && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Features de la classe commune */}
              <div style={{ background: 'var(--parch-mid)', border: '1px solid var(--blue)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--blue)', padding: '3px 8px' }}>
                  <span style={{ fontFamily: 'Cinzel, serif', color: '#fff', fontSize: '8pt', fontWeight: 700 }}>
                    Features communes — {selectedClass.name}
                  </span>
                </div>
                <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedClass.features.map(f => (
                    <div key={f.id} style={{
                      border: '1px solid var(--parch-dk)', borderRadius: '2px',
                      padding: '3px 6px', background: 'var(--parch-min)', maxWidth: '220px'
                    }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '1px' }}>
                        <span style={{ fontSize: '7.5pt', fontWeight: 700 }}>{f.name}</span>
                        {f.cost_amount > 0 && (
                          <span style={{
                            fontSize: '6pt', padding: '0 3px', borderRadius: '2px',
                            background: COST_COLORS[String(f.cost_amount)] ?? 'var(--blue)',
                            color: '#fff', fontFamily: 'Cinzel, serif'
                          }}>{f.cost_amount}F</span>
                        )}
                      </div>
                      <div style={{ fontSize: '6.5pt', color: 'var(--gray)', fontStyle: 'italic', lineHeight: 1.3 }}>{f.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subclasses */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                {selectedClass.subclasses.map(sub => (
                  <div key={sub.id}
                    onClick={() => handleSelectSubclass(sub)}
                    style={{
                      border: '1px solid var(--gold)', borderRadius: '3px',
                      cursor: 'pointer', overflow: 'hidden',
                      background: selectedSubclass?.id === sub.id ? 'color-mix(in srgb, var(--gold) 8%, var(--parch-min))' : 'var(--parch-min)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--gold) 6%, var(--parch-min))')}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedSubclass?.id === sub.id ? 'color-mix(in srgb, var(--gold) 8%, var(--parch-min))' : 'var(--parch-min)')}
                  >
                    <div style={{ background: 'var(--gold)', padding: '3px 8px' }}>
                      <span style={{ fontFamily: 'Cinzel, serif', color: '#fff', fontSize: '8.5pt', fontWeight: 700 }}>{sub.name}</span>
                    </div>
                    <div style={{ padding: '5px 8px' }}>
                      <p style={{ fontSize: '7.5pt', color: 'var(--gray)', fontStyle: 'italic', marginBottom: '6px', lineHeight: 1.4 }}>{sub.description}</p>
                      {sub.features?.map(f => (
                        <div key={f.id} className="feature-row" style={{ fontSize: '7pt', padding: '2px 0' }}>
                          <span style={{ fontWeight: 700, fontSize: '7pt', marginRight: '3px' }}>{f.name}</span>
                          {f.cost_amount > 0 && (
                            <span style={{
                              fontSize: '6pt', padding: '0 3px', borderRadius: '2px',
                              background: COST_COLORS[String(f.cost_amount)] ?? 'var(--blue)',
                              color: '#fff', fontFamily: 'Cinzel, serif', marginRight: '3px', flexShrink: 0
                            }}>{f.cost_amount}F</span>
                          )}
                          <span style={{ color: 'var(--gray)', fontStyle: 'italic', fontSize: '6.5pt' }}>{f.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Confirmation */}
          {step === 'confirm' && selectedClass && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: '16pt', color: 'var(--blue)', fontWeight: 700 }}>{selectedClass.name}</div>
                {selectedSubclass && (
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '11pt', color: 'var(--gold)', marginTop: '2px' }}>
                    ◆ {selectedSubclass.name}
                  </div>
                )}
                <div style={{ fontSize: '9pt', color: 'var(--gray)', fontStyle: 'italic', marginTop: '6px' }}>
                  {selectedClass.description}
                </div>
              </div>

              <div style={{ background: 'var(--parch-mid)', border: '1px solid var(--blue)', borderRadius: '3px', padding: '8px 10px', fontSize: '8pt', color: 'var(--gray)', fontStyle: 'italic' }}>
                Ce choix mettra à jour la classe principale de la fiche. Les features de la classe et de la subclasse seront disponibles dans la section dédiée.
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                <button onClick={() => setStep('subclass')} style={{
                  border: '1px solid var(--blue)', background: 'var(--parch-mid)',
                  color: 'var(--blue)', fontFamily: 'Cinzel, serif', fontSize: '9pt',
                  padding: '6px 16px', cursor: 'pointer', borderRadius: '2px'
                }}>← Retour</button>
                <button onClick={handleConfirm} style={{
                  border: '1px solid var(--gold)', background: 'var(--gold)',
                  color: '#fff', fontFamily: 'Cinzel, serif', fontSize: '9pt',
                  padding: '6px 20px', cursor: 'pointer', borderRadius: '2px', fontWeight: 700,
                  letterSpacing: '.04em'
                }}>Confirmer le choix</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
