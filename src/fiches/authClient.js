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

// Connexion classique une fois qu'un mot de passe a été défini.
// Le mot de passe est vérifié et haché côté serveur par Supabase Auth, jamais stocké en clair.
export async function connexionMotDePasse(email, motDePasse) {
  if (!supabase) throw new Error('Supabase non configuré (.env)')
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
  if (error) throw error
}

// Définit ou change le mot de passe du compte actuellement connecté.
export async function definirMotDePasse(motDePasse) {
  if (!supabase) throw new Error('Supabase non configuré (.env)')
  const { error } = await supabase.auth.updateUser({ password: motDePasse })
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
    .select('id, name_player, role, password_defini')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (errLecture) throw errLecture
  if (existant) return existant

  const { data: cree, error: errCreation } = await supabase
    .from('Player')
    .insert({ auth_user_id: authUserId, name_player: email.split('@')[0], role: 'player' })
    .select('id, name_player, role, password_defini')
    .single()
  if (errCreation) throw errCreation
  return cree
}

// Marque le mot de passe comme défini pour ne plus reproposer la bannière.
export async function marquerMotDePasseDefini(playerId) {
  const { error } = await supabase.from('Player').update({ password_defini: true }).eq('id', playerId)
  if (error) throw error
}
