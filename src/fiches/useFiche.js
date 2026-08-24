import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useFiche(characterId) {
  const [fiche, setFiche] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [modifiee, setModifiee] = useState(false)
  const [dernierEnregistrement, setDernierEnregistrement] = useState(null)
  const [suppression, setSuppression] = useState(false)
  const [televersement, setTeleversement] = useState(false)

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

  const supprimer = useCallback(async () => {
    setSuppression(true)
    setErreur(null)
    const { error } = await supabase.from('characters').delete().eq('id', characterId)
    setSuppression(false)
    if (error) { setErreur(error.message); return false }
    return true
  }, [characterId])

  // Téléverse le portrait dans le bucket public, sous {id_fiche}/portrait.{ext} (chemin attendu par la policy).
  const televerserPortrait = useCallback(async (fichier) => {
    if (!fichier) return
    setTeleversement(true)
    setErreur(null)
    try {
      const extension = fichier.name.split('.').pop()
      const chemin = `${characterId}/portrait.${extension}`
      const { error: errUpload } = await supabase.storage
        .from('character-images')
        .upload(chemin, fichier, { upsert: true, cacheControl: '3600' })
      if (errUpload) throw errUpload

      const { data: publique } = supabase.storage.from('character-images').getPublicUrl(chemin)
      // Casse le cache navigateur si le fichier est remplacé sous le même nom.
      const url = `${publique.publicUrl}?t=${Date.now()}`

      const { error: errUpdate } = await supabase.from('characters').update({ avatar_url: url }).eq('id', characterId)
      if (errUpdate) throw errUpdate

      setFiche(prev => ({ ...prev, avatar_url: url }))
      return true
    } catch (err) {
      setErreur(err.message || 'Impossible de téléverser l\u2019image.')
      return false
    } finally {
      setTeleversement(false)
    }
  }, [characterId])

  return {
    fiche, chargement, erreur, enregistrement, modifiee, dernierEnregistrement,
    modifier, modifierJson, enregistrer, supprimer, suppression,
    televerserPortrait, televersement,
  }
}
