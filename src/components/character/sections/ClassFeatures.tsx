interface Feature {
  id:            string
  level:         number
  name:          string
  description:   string
  cost_type:     string
  cost_amount:   number
  uses_per_rest: number | null
  is_subclass:   boolean
}

interface Subclass {
  id:       string
  name:     string
  features: Feature[]
}

interface Props {
  classData:       any
  subclassId:      string | null
  characterLevel:  number
  activeFeatures:  any[]
  updateArray:     (field: string, value: any[]) => void
}

function FeatureRow({ feature, isActive, isLocked, onToggle }: {
  feature: Feature; isActive: boolean; isLocked: boolean; onToggle: () => void
}) {
  const costLabel = feature.cost_amount
    ? `(${feature.cost_amount}${feature.cost_type === 'fragments' ? 'F' : feature.cost_type === 'mana' ? 'M' : ''})`
    : null

  return (
    <div className={`feature-row${isLocked ? ' locked' : ''}`}>
      <span className={`feature-check${isActive ? ' used' : ''}`} onClick={!isLocked ? onToggle : undefined} />
      <span className="feature-name">{feature.name}</span>
      {costLabel && <span className="feature-cost">{costLabel}</span>}
      <span className="feature-desc">{feature.description}</span>
      <span className="feature-level">niv.{feature.level}</span>
    </div>
  )
}

export default function ClassFeatures({ classData, subclassId, characterLevel, activeFeatures, updateArray }: Props) {
  if (!classData) return (
    <div className="box" style={{ flex: 1 }}>
      <div className="bt">Features de classe</div>
      <div className="bb" style={{ color: 'var(--gray)', fontSize: '8pt', fontStyle: 'italic', padding: '6px' }}>
        Aucune classe sélectionnée.
      </div>
    </div>
  )

  const features: Feature[] = classData.features ?? []
  const subclasses: Subclass[] = classData.subclasses ?? []
  const selectedSub = subclasses.find(s => s.id === subclassId) ?? null

  const isActive = (id: string) => activeFeatures?.some(f => f.feature_id === id) ?? false

  const toggle = (feature: Feature) => {
    const current = activeFeatures ?? []
    if (isActive(feature.id)) {
      updateArray('active_features', current.filter(f => f.feature_id !== feature.id))
    } else {
      updateArray('active_features', [...current, { feature_id: feature.id, class_id: classData.id, is_subclass: false, used: false }])
    }
  }

  return (
    <div className="box" style={{ flex: 1, overflow: 'hidden' }}>
      <div className="bt">{classData.name} — Features</div>
      <div className="bb" style={{ padding: '2px 4px', overflow: 'auto', maxHeight: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {features.map(f => (
            <FeatureRow
              key={f.id}
              feature={f}
              isActive={isActive(f.id)}
              isLocked={f.level > characterLevel}
              onToggle={() => toggle(f)}
            />
          ))}
        </div>

        {selectedSub && (
          <>
            <div className="subclass-header" style={{ marginTop: '4px' }}>
              ◆ Subclasse : {selectedSub.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {selectedSub.features?.map(f => (
                <FeatureRow
                  key={f.id}
                  feature={f}
                  isActive={isActive(f.id)}
                  isLocked={f.level > characterLevel}
                  onToggle={() => toggle(f)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
