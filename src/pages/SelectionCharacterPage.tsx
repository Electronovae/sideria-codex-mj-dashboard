import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
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

type PlayerRow = {
  id: number
  name_player: string
  role: string
}

type Props = {
  onOpenCharacter?: (characterId: string) => void
}

async function getOrCreatePlayer(authUserId: string, email: string): Promise<PlayerRow> {
  const { data: existing, error: fetchError } = await supabase
    .from('Player')
    .select('id, name_player, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (existing) return existing

  const { data: created, error: createError } = await supabase
    .from('Player')
    .insert({
      auth_user_id: authUserId,
      name_player: email.split('@')[0],
      role: 'player',
    })
    .select('id, name_player, role')
    .single()

  if (createError) throw createError
  return created
}

function mapCharacterRow(row: {
  id: string
  name: string | null
  level: number | null
  origin: string | null
  class_primary: { name: string } | null
}): CharacterSummary {
  return {
    id: row.id,
    name: row.name?.trim() || 'Sans nom',
    className: row.class_primary?.name ?? '—',
    level: row.level ?? 1,
    origin: row.origin?.trim() || '—',
  }
}

export default function SelectionCharacterPage({ onOpenCharacter }: Props) {
  const [player, setPlayer] = useState<PlayerRow | null>(null)
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newOrigin, setNewOrigin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadCharacters = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('Session introuvable. Veuillez vous reconnecter.')

      const playerRow = await getOrCreatePlayer(user.id, user.email ?? 'voyageur')
      setPlayer(playerRow)

      const isStaff = playerRow.role === 'admin' || playerRow.role === 'mj'

      let query = supabase
        .from('characters')
        .select('id, name, level, origin, class_primary:class_primary_id(name)')
        .order('name')

      if (!isStaff) {
        query = query.eq('player_id', playerRow.id)
      }

      const { data, error: charactersError } = await query
      if (charactersError) throw charactersError

      setCharacters((data ?? []).map(mapCharacterRow))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger vos personnages.'
      setError(msg)
      setCharacters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCharacters()
  }, [loadCharacters])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMessage(null)
    setError(null)
  }

  const handleOpenSheet = () => {
    if (!selectedId) return
    onOpenCharacter?.(selectedId)
  }

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!newName.trim() || !player) return

    setCreating(true)
    setError(null)
    setMessage(null)

    try {
      const { data, error: insertError } = await supabase
        .from('characters')
        .insert({
          name: newName.trim(),
          origin: newOrigin.trim() || null,
          level: 1,
          player_id: player.id,
        })
        .select('id, name, level, origin, class_primary:class_primary_id(name)')
        .single()

      if (insertError) throw insertError

      const created = mapCharacterRow(data)
      setCharacters(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedId(created.id)
      setNewName('')
      setNewOrigin('')
      setShowCreateForm(false)
      setMessage(`Fiche créée : ${created.name}.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de créer la fiche.'
      setError(msg)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="sheet-loading">Chargement de vos personnages…</div>
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
              {player
                ? `Bienvenue, ${player.name_player}. Choisissez une fiche existante ou forgez un nouveau personnage.`
                : 'Choisissez une fiche existante ou forgez un nouveau personnage pour entrer dans le Codex.'}
            </p>

            {error && (
              <div className="auth-alert auth-alert--error" role="alert">
                {error}
              </div>
            )}

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
                  setError(null)
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
                    disabled={creating}
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
                    disabled={creating}
                  />
                </div>

                <button type="submit" className="auth-submit" disabled={creating}>
                  {creating ? 'Création…' : 'Forger la fiche'}
                </button>
              </form>
            )}

            {message && (
              <div className="auth-alert auth-alert--success" role="status">
                {message}
              </div>
            )}

            <p className="auth-hint">
              Vos fiches sont enregistrées dans le Codex et liées à votre compte Sidéria.
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
