import { supabase } from '../lib/supabase.js'

export const authActif = () => supabase != null

export async function envoyerLienMagique(email) {
  if (!supabase) throw new Error('Supabase non configuré (.env)')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/fiches' },
  })
  if (error) throw error
}

export async function deconnexion() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function surChangementSession(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_evt, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function sessionActuelle() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Récupère la ligne Player liée au compte connecté, la crée si besoin (role 'player' par défaut).
export async function obtenirOuCreerPlayer(authUserId, email) {
  const { data: existant, error: errLecture } = await supabase
    .from('Player')
    .select('id, name_player, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (errLecture) throw errLecture
  if (existant) return existant

  const { data: cree, error: errCreation } = await supabase
    .from('Player')
    .insert({ auth_user_id: authUserId, name_player: email.split('@')[0], role: 'player' })
    .select('id, name_player, role')
    .single()
  if (errCreation) throw errCreation
  return cree
}
