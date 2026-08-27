import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { connexionMotDePasse, deconnexion, sessionActuelle, surChangementSession } from '../fiches/authClient.js'
import App from '../App.jsx'

// Seul(s) compte(s) autorisé(s) à ouvrir le Studio. La connexion elle-même passe par
// Supabase Auth (email + mot de passe) ; ce garde-fou empêche que n'importe quel compte
// Supabase Auth existant (ex. un joueur qui aurait défini un mot de passe côté /fiches)
// ouvre le dashboard MJ.
const EMAILS_AUTORISES = ['fdevenderdauge@protonmail.com']

function StudioLogin({ onConnecte }) {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  const soumettre = async (e) => {
    e.preventDefault()
    if (!email.trim() || !motDePasse) return
    setEnvoi(true)
    setErreur(null)
    try {
      await connexionMotDePasse(email.trim(), motDePasse)
      // onAuthStateChange (dans StudioGate) prend le relais et vérifie l'email autorisé.
    } catch (err) {
      setErreur(err.message === 'Invalid login credentials'
        ? 'E-mail ou mot de passe incorrect.'
        : (err.message || 'Connexion impossible.'))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="fiches-login">
      <div className="fiches-carte">
        <h1>Sidéria Studio</h1>
        <p className="fiches-souscarte">Accès réservé au maître du jeu</p>
        <form onSubmit={soumettre} className="fiches-form">
          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email" type="email" value={email} required disabled={envoi} autoFocus
            onChange={e => setEmail(e.target.value)}
          />
          <label htmlFor="mdp">Mot de passe</label>
          <input
            id="mdp" type="password" value={motDePasse} required disabled={envoi}
            onChange={e => setMotDePasse(e.target.value)}
          />
          {erreur && <p className="fiches-message fiches-message--erreur" style={{ padding: '4px 0' }}>{erreur}</p>}
          <button type="submit" className="fiches-btn" disabled={envoi}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function StudioGate() {
  const [statut, setStatut] = useState('chargement') // 'chargement' | 'refuse' | 'autorise' | 'deconnecte'
  const [emailConnecte, setEmailConnecte] = useState(null)

  const evaluer = (session) => {
    const email = session?.user?.email?.toLowerCase() || null
    setEmailConnecte(email)
    if (email && EMAILS_AUTORISES.includes(email)) {
      setStatut('autorise')
    } else if (email) {
      setStatut('refuse')
    } else {
      setStatut('deconnecte')
    }
  }

  useEffect(() => {
    if (!supabase) { setStatut('deconnecte'); return }
    sessionActuelle().then(evaluer)
    return surChangementSession(evaluer)
  }, [])

  if (!supabase) {
    return <div className="fiches-message">Supabase non configuré (.env).</div>
  }

  if (statut === 'chargement') {
    return <div className="fiches-message">Chargement…</div>
  }

  if (statut === 'refuse') {
    return (
      <div className="fiches-login">
        <div className="fiches-carte">
          <h1>Sidéria Studio</h1>
          <p className="fiches-message fiches-message--erreur" style={{ padding: '8px 0' }}>
            Le compte {emailConnecte} n'a pas accès au Studio.
          </p>
          <button className="fiches-btn fiches-btn--discret" onClick={() => deconnexion()}>
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  if (statut === 'deconnecte') {
    return <StudioLogin />
  }

  return <App deconnexion={deconnexion} />
}
