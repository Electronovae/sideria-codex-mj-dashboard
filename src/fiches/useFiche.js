import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useFiche(characterId) {
  const [fiche, setFiche] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [modifiee, setModifiee] = useState(false)
  const [dernierEnregistrement, setDernierEnregistrement] = useState(null)

  useEffect(() => {
    if (!characterId) return
    setChargement(true)
    setErreur(null)
    supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setFiche(data)
        setChargement(false)
      })
  }, [characterId])

  // Mutation locale uniquement : rien n'est écrit tant que enregistrer() n'est pas appelé.
  const modifier = useCallback((champ, valeur) => {
    setFiche(prev => ({ ...prev, [champ]: valeur }))
    setModifiee(true)
  }, [])

  const modifierJson = useCallback((champ, cle, valeur) => {
    setFiche(prev => ({ ...prev, [champ]: { ...prev[champ], [cle]: valeur } }))
    setModifiee(true)
  }, [])

  const enregistrer = useCallback(async () => {
    if (!fiche) return
    setEnregistrement(true)
    setErreur(null)
    const { id, created_at, updated_at, class_primary_id, class_secondary_id, ...donnees } = fiche
    const { error } = await supabase.from('characters').update(donnees).eq('id', characterId)
    setEnregistrement(false)
    if (error) { setErreur(error.message); return false }
    setModifiee(false)
    setDernierEnregistrement(new Date())
    return true
  }, [fiche, characterId])

  return { fiche, chargement, erreur, enregistrement, modifiee, dernierEnregistrement, modifier, modifierJson, enregistrer }
}
