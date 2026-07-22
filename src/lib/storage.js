import { supabase } from './supabase.js'
import { universInitial, normaliser } from './modele.js'

const CLE = 'sideria-studio-univers'

// ── Local : autosave navigateur ─────────────────────────────
export function chargerLocal() {
  try {
    const brut = localStorage.getItem(CLE)
    if (brut) return normaliser(JSON.parse(brut))
  } catch (e) { console.warn('localStorage indisponible', e) }
  return universInitial()
}

export function sauverLocal(univers) {
  try { localStorage.setItem(CLE, JSON.stringify(univers)) } catch (e) { /* mode privé, etc. */ }
}

// ── Fichier : export / import JSON (pour le vault Obsidian) ─
export function exporterJson(univers) {
  const blob = new Blob([JSON.stringify(univers, null, 1)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'sideria_univers.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function importerJson(fichier) {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader()
    lecteur.onload = () => {
      try {
        const d = JSON.parse(lecteur.result)
        if (!d.meta || !d.pnjs) throw new Error('structure inattendue')
        resoudre(normaliser(d))
      } catch (e) { rejeter(e) }
    }
    lecteur.onerror = rejeter
    lecteur.readAsText(fichier)
  })
}

// ── Supabase : un univers = une ligne JSONB ─────────────────
export const supabaseActif = () => supabase != null

export async function pousserSupabase(univers, idLigne) {
  if (!supabase) throw new Error('Supabase non configuré (.env)')
  const ligne = { nom: univers.meta.nom, data: univers, updated_at: new Date().toISOString() }
  if (idLigne) {
    const { error } = await supabase.from('univers').update(ligne).eq('id', idLigne)
    if (error) throw error
    await archiver(univers, idLigne)
    return idLigne
  }
  const { data, error } = await supabase.from('univers').insert(ligne).select('id').single()
  if (error) throw error
  await archiver(univers, data.id)
  return data.id
}

// Conserve un instantané dans la table historique (les 20 plus récents).
async function archiver(univers, universId) {
  try {
    await supabase.from('historique').insert({ univers_id: universId, data: univers })
    const { data } = await supabase.from('historique')
      .select('id').eq('univers_id', universId)
      .order('created_at', { ascending: false }).range(20, 200)
    if (data?.length) await supabase.from('historique').delete().in('id', data.map(x => x.id))
  } catch (e) { /* l'archivage ne doit jamais bloquer la sauvegarde */ }
}

export async function tirerSupabase() {
  if (!supabase) throw new Error('Supabase non configuré (.env)')
  const { data, error } = await supabase
    .from('univers').select('id, data, updated_at')
    .order('updated_at', { ascending: false }).limit(1)
  if (error) throw error
  if (!data.length) return null
  return { id: data[0].id, univers: normaliser(data[0].data) }
}
