import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useSpells = () => {
  const [spells, setSpells]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('spells')
      .select('*')
      .order('discipline')
      .then(({ data }) => {
        setSpells(data || [])
        setLoading(false)
      })
  }, [])

  return { spells, loading }
}
