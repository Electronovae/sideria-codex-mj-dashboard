import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function Selection({ player, estMJ }) {
  const navigate = useNavigate()
  const [fiches, setFiches] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur(null)
    // Pas de filtre explicite : la policy RLS ne renvoie déjà que les fiches
    // du joueur connecté, ou toutes les fiches si le compte est MJ/admin.
    const { data, error } = await supabase.from('characters').select('id, name, level, origin').order('name')
    if (error) setErreur(error.message)
    else setFiches(data ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  if (chargement) return <div className="fiches-message">Chargement des fiches…</div>

  return (
    <div className="fiches-selection">
      <div className="fiches-carte">
        <div className="fiches-carte-titre">
          {estMJ ? 'Toutes les fiches du Codex' : 'Vos fiches de personnage'}
        </div>
        {erreur && <p className="fiches-message fiches-message--erreur">{erreur}</p>}

        {fiches.length === 0 ? (
          <p className="fiches-vide">Aucune fiche pour le moment.</p>
        ) : (
          <ul className="fiches-liste">
            {fiches.map(f => (
              <li key={f.id}>
                <button className="fiches-item" onClick={() => navigate(f.id)}>
                  <span className="fiches-item-nom">{f.name || 'Sans nom'}</span>
                  <span className="fiches-item-meta">Niv. {f.level ?? 1} {f.origin ? `· ${f.origin}` : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!estMJ && (
          <button className="fiches-btn" onClick={() => navigate('nouveau')}>+ Créer un personnage</button>
        )}
      </div>
    </div>
  )
}
