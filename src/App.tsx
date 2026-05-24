import { useCharacter } from './hooks/useCharacter'
import CoreStats from './components/character/sections/CoreStats'
import SavingThrows from './components/character/sections/SavingThrows'

const TEST_CHARACTER_ID = 'a373042f-ed2a-4454-985a-ffe0b6ee35f4'

function App() {
  const { character, loading, error, updateJson } = useCharacter(TEST_CHARACTER_ID)

  if (loading) return <p>Chargement...</p>
  if (error)   return <p>Erreur : {error}</p>

  return (
    <div style={{ padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'right' }}>
        <h1 style={{ margin: 0 }}>{character.name}</h1>
        <p style={{ margin: 0, color: '#aaa' }}>Niveau {character.level} — PV {character.hp_current}/{character.hp_max}</p>
      </div>
      <CoreStats
        stats={character.stats}
        skillProficiencies={character.skill_proficiencies}
        savingThrows={character.saving_throw_proficiencies}
        proficiencyBonus={character.proficiency_bonus}
        updateJson={updateJson}
      /> 
      </div>
  )
}

export default App