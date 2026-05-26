import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useClasses = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('classes')
      .select('*')
      .then(({ data }) => {
        setClasses(data || [])
        setLoading(false)
      })
  }, [])

  return { classes, loading }
}