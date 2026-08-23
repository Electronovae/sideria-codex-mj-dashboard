import React, { useState } from 'react'
import { envoyerLienMagique } from './authClient.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState(null)

  const soumettre = async (e) => {
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

  return (
    <div className="fiches-login">
      <div className="fiches-carte">
        <h1>The Sideria Codex</h1>
        <p className="fiches-souscarte">Accès aux fiches de personnage</p>

        {envoye ? (
          <p className="fiches-message fiches-message--succes">
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Ouvrez-le pour accéder à votre fiche.
          </p>
        ) : (
          <form onSubmit={soumettre} className="fiches-form">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email" type="email" value={email} required disabled={envoi}
              onChange={e => setEmail(e.target.value)} placeholder="voyageur@exemple.com"
            />
            {erreur && <p className="fiches-message fiches-message--erreur">{erreur}</p>}
            <button type="submit" className="fiches-btn" disabled={envoi}>
              {envoi ? 'Envoi…' : 'Recevoir le lien de connexion'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
