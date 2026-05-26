import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { debounce } from 'lodash'
import { getProficiencyBonus } from '../utils/modifiers'

export const useCharacter = (characterId) => {
  const [character, setCharacter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    if (!characterId) return
    setLoading(true)
    supabase
      .from('characters')
      .select('*, class_primary:class_primary_id(*), class_secondary:class_secondary_id(*)')
      .eq('id', characterId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else {
          // Recalcul automatique du bonus de maîtrise
          setCharacter({ ...data, proficiency_bonus: getProficiencyBonus(data.level) })
        }
        setLoading(false)
      })
  }, [characterId])

  // Sauvegarde auto debouncée 500ms
  const saveToSupabase = useCallback(
    debounce(async (updates) => {
      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', characterId)
      if (!error) setSaved(true)
    }, 500),
    [characterId]
  )

  // Mise à jour d'un champ simple (ex: 'name', 'level')
  const update = (field, value) => {
    setSaved(false)
    setCharacter(prev => {
      const updated = { ...prev, [field]: value }
      // Recalcul du bonus de maîtrise si le niveau change
      if (field === 'level') {
        updated.proficiency_bonus = getProficiencyBonus(value)
      }
      saveToSupabase({ [field]: value })
      return updated
    })
  }

  // Mise à jour d'un champ JSONB imbriqué (ex: stats.for, factions.academie)
  const updateJson = (field, key, value) => {
    setSaved(false)
    setCharacter(prev => {
      const updated = { ...prev, [field]: { ...prev[field], [key]: value } }
      saveToSupabase({ [field]: updated[field] })
      return updated
    })
  }

  // Mise à jour d'un tableau JSONB (ex: attacks, inventory)
  const updateArray = (field, newArray) => {
    setSaved(false)
    setCharacter(prev => ({ ...prev, [field]: newArray }))
    saveToSupabase({ [field]: newArray })
  }

  return { character, loading, error, saved, update, updateJson, updateArray }
}