import { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../components/character/CharacterSheet.css'
import './AuthentificationPage.css'

type Mode = 'login' | 'signup'

export default function AuthentificationPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        setMessage('Connexion réussie. Bienvenue dans le Codex.')
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        setMessage('Compte créé. Vérifiez votre e-mail pour confirmer votre adresse.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sheet-page auth-page">
      <div className="sheet-header">
        <div className="auth-header-inner">
          <span className="sheet-header-title">
            The Sideria Codex <span>— Authentification</span>
          </span>
        </div>
      </div>

      <div className="sheet-inner">
        <div className="box auth-card">
          <div className="bt">Portail de l'Éther</div>
          <div className="bb">
            <p className="auth-intro">
              {mode === 'login'
                ? 'Connectez-vous pour accéder à votre fiche personnage.'
                : 'Créez votre compte pour rejoindre Sidéria et accéder au Codex.'}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field auth-field">
                <label htmlFor="auth-email">Adresse e-mail</label>
                <input
                  id="auth-email"
                  className="field-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field auth-field">
                <label htmlFor="auth-password">Mot de passe</label>
                <input
                  id="auth-password"
                  className="field-input"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="auth-alert auth-alert--error" role="alert">
                  {error}
                </div>
              )}

              {message && (
                <div className="auth-alert auth-alert--success" role="status">
                  {message}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </button>

              {mode === 'login' ? (
                <p className="auth-switch">
                  Si vous n&apos;êtes pas enregistré à Sidéria,{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => {
                      setMode('signup')
                      setError(null)
                      setMessage(null)
                    }}
                  >
                    cliquez ici
                  </button>{' '}
                  pour faire votre enregistrement.
                </p>
              ) : (
                <p className="auth-switch">
                  Déjà enregistré à Sidéria ?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => {
                      setMode('login')
                      setError(null)
                      setMessage(null)
                    }}
                  >
                    cliquez ici
                  </button>{' '}
                  pour vous connecter.
                </p>
              )}
            </form>

            <p className="auth-hint">
              Vos données restent liées à votre compte pour retrouver facilement vos personnages.
            </p>
          </div>
        </div>
      </div>

      <div className="sheet-footer">
        <span className="sheet-footer-l">The Sideria Codex — Portail des Voyageurs</span>
        <span className="sheet-footer-r">Un compte, une progression continue dans les Archives.</span>
      </div>
    </div>
  )
}
