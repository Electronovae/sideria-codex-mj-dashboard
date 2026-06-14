import { useState } from 'react'
import '../components/character/CharacterSheet.css'
import './AuthentificationPage.css'
import './SelectionCharacterPage.css'

type CharacterSummary = {
  id: string
  name: string
  className: string
  level: number
  origin: string
}

const MOCK_CHARACTERS: CharacterSummary[] = [
  { id: 'c6eeff55-4151-4641-92e8-ad00a5c34fe5', name: 'Aldric Vorn', className: 'Sentinelle', level: 3, origin: 'Brumes de Khar' },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Lyra Duskmere', className: 'Éveilleur', level: 5, origin: 'Cité d\'Étheris' },
]

export default function SelectionCharacterPage() {
  const [characters, setCharacters] = useState<CharacterSummary[]>(MOCK_CHARACTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newOrigin, setNewOrigin] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMessage(null)
  }

  const handleOpenSheet = () => {
    if (!selectedId) return
    const character = characters.find(c => c.id === selectedId)
    setMessage(`Fiche sélectionnée : ${character?.name ?? 'Inconnue'} (connexion back à venir).`)
  }

  const handleCreate = (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!newName.trim()) return

    const newCharacter: CharacterSummary = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      className: '—',
      level: 1,
      origin: newOrigin.trim() || 'À définir',
    }

    setCharacters(prev => [...prev, newCharacter])
    setSelectedId(newCharacter.id)
    setNewName('')
    setNewOrigin('')
    setShowCreateForm(false)
    setMessage(`Nouvelle fiche créée : ${newCharacter.name} (enregistrement back à venir).`)
  }

  return (
    <div className="sheet-page auth-page selection-page">
      <div className="sheet-header">
        <div className="auth-header-inner">
          <span className="sheet-header-title">
            The Sideria Codex <span>— Sélection du personnage</span>
          </span>
        </div>
      </div>

      <div className="sheet-inner">
        <div className="box auth-card selection-card">
          <div className="bt">Archives des Voyageurs</div>
          <div className="bb">
            <p className="auth-intro">
              Choisissez une fiche existante ou forgez un nouveau personnage pour entrer dans le Codex.
            </p>

            <div className="selection-list" role="list" aria-label="Fiches personnage disponibles">
              {characters.length === 0 ? (
                <p className="selection-empty">Aucune fiche enregistrée pour le moment.</p>
              ) : (
                characters.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    role="listitem"
                    className={`selection-item${selectedId === character.id ? ' selected' : ''}`}
                    onClick={() => handleSelect(character.id)}
                    aria-pressed={selectedId === character.id}
                  >
                    <span className="selection-item-name">{character.name}</span>
                    <span className="selection-item-meta">
                      {character.className} · Niv. {character.level}
                    </span>
                    <span className="selection-item-origin">{character.origin}</span>
                  </button>
                ))
              )}
            </div>

            <div className="selection-actions">
              <button
                type="button"
                className="auth-submit"
                disabled={!selectedId}
                onClick={handleOpenSheet}
              >
                Ouvrir la fiche
              </button>

              <button
                type="button"
                className="selection-create-toggle"
                onClick={() => {
                  setShowCreateForm(prev => !prev)
                  setMessage(null)
                }}
              >
                {showCreateForm ? 'Annuler la création' : '+ Créer une nouvelle fiche'}
              </button>
            </div>

            {showCreateForm && (
              <form className="selection-create-form" onSubmit={handleCreate}>
                <div className="field auth-field">
                  <label htmlFor="new-character-name">Nom du personnage</label>
                  <input
                    id="new-character-name"
                    className="field-input"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex. Aldric Vorn"
                    required
                  />
                </div>

                <div className="field auth-field">
                  <label htmlFor="new-character-origin">Origine (optionnel)</label>
                  <input
                    id="new-character-origin"
                    className="field-input"
                    type="text"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    placeholder="Ex. Brumes de Khar"
                  />
                </div>

                <button type="submit" className="auth-submit">
                  Forger la fiche
                </button>
              </form>
            )}

            {message && (
              <div className="auth-alert auth-alert--success" role="status">
                {message}
              </div>
            )}

            <p className="auth-hint">
              Les fiches affichées sont des données de démonstration. La liaison Supabase sera ajoutée ensuite.
            </p>
          </div>
        </div>
      </div>

      <div className="sheet-footer">
        <span className="sheet-footer-l">The Sideria Codex — Hall des Héros</span>
        <span className="sheet-footer-r">Chaque nom gravé ici ouvre une histoire dans Sidéria.</span>
      </div>
    </div>
  )
}
