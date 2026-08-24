import React, { useState } from 'react'
import { definirMotDePasse, marquerMotDePasseDefini } from './authClient.js'

export default function BanniereMotDePasse({ player, onDefini, onIgnorer }) {
  const [ouvert, setOuvert] = useState(false)
  const [mdp, setMdp] = useState('')
  const [mdp2, setMdp2] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)

  const soumettre = async (e) => {
    e.preventDefault()
    if (mdp.length < 6) { setErreur('6 caractères minimum.'); return }
    if (mdp !== mdp2) { setErreur('Les deux mots de passe ne correspondent pas.'); return }
    setEnvoi(true)
    setErreur(null)
    try {
      await definirMotDePasse(mdp)
      await marquerMotDePasseDefini(player.id)
      onDefini()
    } catch (err) {
      setErreur(err.message || 'Impossible d\u2019enregistrer le mot de passe.')
    } finally {
      setEnvoi(false)
    }
  }

  if (!ouvert) {
    return (
      <div className="fiches-banniere">
        <span>Définissez un mot de passe pour ne plus repasser par le lien magique la prochaine fois.</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="fiches-btn" onClick={() => setOuvert(true)}>Définir un mot de passe</button>
          <button className="fiches-btn fiches-btn--discret" onClick={onIgnorer}>Plus tard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fiches-banniere">
      <form onSubmit={soumettre} className="fiches-form fiches-form--inline" style={{ flexWrap: 'wrap' }}>
        <input type="password" placeholder="Mot de passe" value={mdp} onChange={e => setMdp(e.target.value)} disabled={envoi} required />
        <input type="password" placeholder="Confirmer" value={mdp2} onChange={e => setMdp2(e.target.value)} disabled={envoi} required />
        <button type="submit" className="fiches-btn" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Valider'}</button>
        <button type="button" className="fiches-btn fiches-btn--discret" onClick={() => setOuvert(false)}>Annuler</button>
      </form>
      {erreur && <p className="fiches-message fiches-message--erreur">{erreur}</p>}
    </div>
  )
}
