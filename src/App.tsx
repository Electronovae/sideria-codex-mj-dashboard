import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import AuthentificationPage from './pages/AuthentificationPage'
import SelectionCharacterPage from './pages/SelectionCharacterPage'
import CharacterSheetPage from './pages/CharacterSheetPage'
import './components/character/CharacterSheet.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
      if (!session) setSelectedCharacterId(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="sheet-loading">Chargement…</div>
  }

  if (!session) {
    return <AuthentificationPage />
  }

  if (selectedCharacterId) {
    return <CharacterSheetPage characterId={selectedCharacterId} />
  }

  return <SelectionCharacterPage onOpenCharacter={setSelectedCharacterId} />
}

export default App
