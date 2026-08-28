import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function usePeuples() {
  const [peuples, setPeuples] = useState([])
  const [chargement, setChargement] = useState(true)
  useEffect(() => {
    supabase.from('peuples_sideria').select('*').order('ordre')
      .then(({ data }) => { setPeuples(data ?? []); setChargement(false) })
  }, [])
  return { peuples, chargement }
}

export function useHistoriques() {
  const [historiques, setHistoriques] = useState([])
  const [chargement, setChargement] = useState(true)
  useEffect(() => {
    supabase.from('historiques_sideria').select('*').order('ordre')
      .then(({ data }) => { setHistoriques(data ?? []); setChargement(false) })
  }, [])
  return { historiques, chargement }
}

export function useDons() {
  const [dons, setDons] = useState([])
  const [chargement, setChargement] = useState(true)
  useEffect(() => {
    supabase.from('dons_sideria').select('*').order('ordre')
      .then(({ data }) => { setDons(data ?? []); setChargement(false) })
  }, [])
  return { dons, chargement }
}

export function useObjets() {
  const [objets, setObjets] = useState([])
  const [chargement, setChargement] = useState(true)
  useEffect(() => {
    supabase.from('objets_sideria').select('*').order('ordre')
      .then(({ data }) => { setObjets(data ?? []); setChargement(false) })
  }, [])
  return { objets, chargement }
}

export function useServices() {
  const [services, setServices] = useState([])
  const [chargement, setChargement] = useState(true)
  useEffect(() => {
    supabase.from('services_sideria').select('*').order('ordre')
      .then(({ data }) => { setServices(data ?? []); setChargement(false) })
  }, [])
  return { services, chargement }
}

export function useRegles() {
  const [regles, setRegles] = useState([])
  const [chargement, setChargement] = useState(true)
  useEffect(() => {
    supabase.from('regles_sideria').select('*').order('ordre')
      .then(({ data }) => { setRegles(data ?? []); setChargement(false) })
  }, [])
  return { regles, chargement }
}
