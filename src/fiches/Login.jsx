import React, { useState } from 'react'
import { envoyerLienMagique, connexionMotDePasse } from './authClient.js'

export default function Login() {
  const [mode, setMode] = useState('motdepasse') // 'motdepasse' | 'lien'
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState(null)

  const soumettreLien = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setEnvoi(true)
    setErreur(null)
    try {
      await envoyerLienMagique(email.trim())
      setEnvoye(true)
    } catch (err) {
      setErreur(err.message || 'Impossible d\u2019envoyer le lien.')
    } finally {
      setEnvoi(false)
    }
  }

  const soumettreMotDePasse = async (e) => {
    e.preventDefault()
    if (!email.trim() || !motDePasse) return
    setEnvoi(true)
    setErreur(null)
    try {
      await connexionMotDePasse(email.trim(), motDePasse)
      // La session change automatiquement, FichesApp prend le relais.
    } catch (err) {
      setErreur(
        err.message === 'Invalid login credentials'
          ? 'E-mail ou mot de passe incorrect. Si vous n\u2019avez jamais défini de mot de passe, utilisez le lien magique.'
          : (err.message || 'Connexion impossible.')
      )
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="fiches-login">
      <div className="fiches-carte">
        <h1>The Sideria Codex</h1>
        <p className="fiches-souscarte">Accès aux fiches de personnage</p>

        {mode === 'motdepasse' ? (
          <form onSubmit={soumettreMotDePasse} className="fiches-form">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email" type="email" value={email} required disabled={envoi}
              onChange={e => setEmail(e.target.value)} placeholder="voyageur@exemple.com"
            />
            <label htmlFor="mdp">Mot de passe</label>
            <input
              id="mdp" type="password" value={motDePasse} required disabled={envoi}
              onChange={e => setMotDePasse(e.target.value)}
            />
            {erreur && <p className="fiches-message fiches-message--erreur">{erreur}</p>}
            <button type="submit" className="fiches-btn" disabled={envoi}>
              {envoi ? 'Connexion…' : 'Se connecter'}
            </button>
            <button type="button" className="fiches-btn fiches-btn--discret" onClick={() => { setMode('lien'); setErreur(null) }}>
              Première connexion / mot de passe oublié → utiliser le lien magique
            </button>
          </form>
        ) : envoye ? (
          <p className="fiches-message fiches-message--succes">
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Ouvrez-le pour accéder à votre fiche, vous pourrez y définir un mot de passe pour la prochaine fois.
          </p>
        ) : (
          <form onSubmit={soumettreLien} className="fiches-form">
            <label htmlFor="email2">Adresse e-mail</label>
            <input
              id="email2" type="email" value={email} required disabled={envoi}
              onChange={e => setEmail(e.target.value)} placeholder="voyageur@exemple.com"
            />
            {erreur && <p className="fiches-message fiches-message--erreur">{erreur}</p>}
            <button type="submit" className="fiches-btn" disabled={envoi}>
              {envoi ? 'Envoi…' : 'Recevoir le lien de connexion'}
            </button>
            <button type="button" className="fiches-btn fiches-btn--discret" onClick={() => { setMode('motdepasse'); setErreur(null) }}>
              ← J'ai déjà un mot de passe
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
